// Fetch the pictures for the seed questions in data/quiz-bank/*.json and put
// them on Cloudinary, through @aspiro/media.
//
//   npm run quiz:images                      every file
//   npm run quiz:images -- landmarks.json    just these
//
// A question's picture is written as a hint, and this fills in the rest:
//   {kind:'image', flag:'br'}          the national flag, from flagcdn.com
//                                      (public domain), turned into a PNG
//   {kind:'image', wiki:'Angkor_Wat'}  the lead photo of that English
//                                      Wikipedia article, at most 1280px,
//                                      with its credit and licence from
//                                      Wikimedia Commons
//   {kind:'image', file:'Shell logo.svg'} one named file on Wikipedia or
//                                      Commons: a logo, a crest, a circuit
//                                      map. No credit (2026-10-22: GamePad
//                                      is the family's own, Ash's call).
//   {kind:'image', outline:'it'}     a country's silhouette, from mapsicon
//                                      (github.com/djaiss/mapsicon)
// Any of them can add zoom: [x, y, size], the centre of a square close-up as
// fractions of the picture's width and height, and its side as a fraction of
// the shorter side. The close-up is the question; the whole picture goes up
// too, as `reveal`, and is shown with the answer.
// Or hide: [[x, y, w, h], ...], for a logo with its name written in it: each
// rectangle (fractions of the picture) holds the name, which is painted out
// (hideGround: '#000000' when it sits on a dark shield, white otherwise). The
// logo without its name is the question, the whole logo the `reveal`.
// Each goes up with @aspiro/media's uploadBuffer to the app's own folder,
// GamePad/quiz (no user's folder: these belong to the app), under a fixed id,
// so running it again replaces a picture rather than adding a copy. The
// delivery URL and the credit are written back into the seed file as `src`
// and `credit`; the question screen sizes it with transformUrl. A picture
// already on Cloudinary is skipped. Needs the CLOUDINARY_* variables, which
// npm run quiz:images reads from .env.local.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { isCloudinaryUrl } from '@aspiro/media';
import { isCloudinaryConfigured, uploadBuffer } from '@aspiro/media/server';

const SEED = path.resolve('data/quiz-bank');
const FOLDER = 'GamePad/quiz';
// Wikimedia asks every client to say who it is.
const HEADERS = { 'User-Agent': 'GamePadQuizSeed/1.0 (https://github.com/ashishgupta1982/gamepad)' };

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plain = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

async function download(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
const getJson = async (url) => JSON.parse((await download(url)).toString('utf8'));

async function flag(code) {
  const svg = await download(`https://flagcdn.com/${code}.svg`);
  const png = await sharp(svg, { density: 300 }).resize({ width: 1200, withoutEnlargement: false }).png().toBuffer();
  return { bytes: png, format: 'png', publicId: `flag-${code}`, credit: '' };
}

async function file(name) {
  const info = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1000&titles=${encodeURIComponent(`File:${name}`)}`);
  const ii = Object.values(info.query?.pages || {})[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`no file called ${name}`);
  const png = await sharp(await download(ii.thumburl || ii.url))
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
  return { bytes: png, format: 'png', publicId: `file-${slug(name.replace(/.[a-z]+$/i, ''))}`, credit: '' };
}

async function outline(code) {
  const svg = (await download(`https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code}/vector.svg`)).toString('utf8').replace(/fill="#000000"/g, 'fill="#6d28d9"');
  // A white margin round the shape, so a coastline never runs into the edge of the card.
  const shape = await sharp(Buffer.from(svg), { density: 96 }).resize({ width: 780, height: 780, fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).toBuffer();
  const png = await sharp(shape).extend({ top: 60, bottom: 60, left: 60, right: 60, background: '#ffffff' }).png().toBuffer();
  return { bytes: png, format: 'png', publicId: `outline-${code}`, credit: '' };
}

// A square close-up of the picture, for a Zoomed in question.
async function closeUp(bytes, [x, y, size]) {
  const { width, height } = await sharp(bytes).metadata();
  const side = Math.max(16, Math.round(Math.min(width, height) * size));
  const left = Math.min(Math.max(0, Math.round(width * x - side / 2)), width - side);
  const top = Math.min(Math.max(0, Math.round(height * y - side / 2)), height - side);
  return sharp(bytes).extract({ left, top, width: side, height: side }).resize(900, 900).jpeg({ quality: 88 }).toBuffer();
}

// The logo with its name painted out. Inside each rectangle, whatever stands
// out from the ground colour is painted over, widened by a few pixels so no
// soft edge of a letter is left, in the row's own ground, so a shaded shield
// keeps its shading. Then the white round the logo is trimmed and a margin put
// back, so what is left sits in the middle.
async function hideName(bytes, rects, ground = '#ffffff') {
  const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const g = [0, 2, 4].map((i) => parseInt(ground.slice(1 + i, 3 + i), 16));
  const GROW = 4;
  for (const [x, y, w, h] of rects) {
    const x0 = Math.round(width * x);
    const y0 = Math.round(height * y);
    const rw = Math.min(width, Math.round(width * (x + w))) - x0;
    const rh = Math.min(height, Math.round(height * (y + h))) - y0;
    const at = (px, py) => ((py + y0) * width + px + x0) * channels;
    const mask = new Uint8Array(rw * rh);
    for (let py = 0; py < rh; py++) {
      for (let px = 0; px < rw; px++) {
        const o = at(px, py);
        if (Math.abs(data[o] - g[0]) + Math.abs(data[o + 1] - g[1]) + Math.abs(data[o + 2] - g[2]) <= 90) continue;
        for (let qy = Math.max(0, py - GROW); qy <= Math.min(rh - 1, py + GROW); qy++) {
          for (let qx = Math.max(0, px - GROW); qx <= Math.min(rw - 1, px + GROW); qx++) mask[qy * rw + qx] = 1;
        }
      }
    }
    for (let py = 0; py < rh; py++) {
      // The row's ground: the middle value of what is left unpainted in it.
      const keep = [[], [], []];
      for (let px = 0; px < rw; px++) if (!mask[py * rw + px]) for (let c = 0; c < 3; c++) keep[c].push(data[at(px, py) + c]);
      const fill = keep[0].length > rw / 10 ? keep.map((v) => v.sort((a, b) => a - b)[v.length >> 1]) : g;
      for (let px = 0; px < rw; px++) if (mask[py * rw + px]) for (let c = 0; c < 3; c++) data[at(px, py) + c] = fill[c];
    }
  }
  const painted = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  const trimmed = await sharp(painted).trim({ background: '#ffffff', threshold: 10 }).toBuffer();
  const { width: tw, height: th } = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(tw, th) * 0.08);
  return sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' }).png().toBuffer();
}

async function wiki(title) {
  // The article's lead image, then that file's licence on Commons.
  const page = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(title)}`);
  const name = Object.values(page.query?.pages || {})[0]?.pageimage;
  if (!name) throw new Error(`no lead image on ${title}`);
  const info = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&titles=${encodeURIComponent(`File:${name}`)}`,
  );
  const ii = Object.values(info.query?.pages || {})[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`no image info for ${name}`);
  const meta = ii.extmetadata || {};
  const artist = plain(meta.Artist?.value).replace(/^photo:\s*/i, '') || 'Unknown';
  const licence = plain(meta.LicenseShortName?.value) || 'see Wikimedia Commons';
  const publicDomain = /public domain|pd|cc0/i.test(licence);
  const jpg = await sharp(await download(ii.thumburl || ii.url))
    .rotate()
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88 })
    .toBuffer();
  // Public domain needs no credit, and leaving it off matters: for an old
  // painting Commons names the painter as the artist, so "Who painted this?"
  // would be answered underneath the picture.
  const credit = publicDomain ? '' : `Photo: ${artist.slice(0, 80)}, ${licence} (Wikimedia Commons)`;
  return { bytes: jpg, format: 'jpg', publicId: slug(title), credit, source: ii.descriptionurl };
}

if (!isCloudinaryConfigured()) {
  console.log('The CLOUDINARY_* variables are not set: run through npm run quiz:images, which reads .env.local.');
  process.exit(1);
}

// Named files only (npm run quiz:images -- geography.json landmarks.json), or all of them.
const only = process.argv.slice(2).filter((a) => a.endsWith('.json'));
const files = (await readdir(SEED)).filter((f) => f.endsWith('.json') && (!only.length || only.includes(f))).sort();
let done = 0;
let failed = 0;
for (const f of files) {
  const p = path.join(SEED, f);
  const json = JSON.parse(await readFile(p, 'utf8'));
  let changed = false;
  for (const q of json.questions || []) {
    const m = q.media;
    if (m?.kind !== 'image' || (!m.flag && !m.wiki && !m.file && !m.outline)) continue;
    if (isCloudinaryUrl(m.src)) continue;
    try {
      const got = m.flag ? await flag(m.flag) : m.outline ? await outline(m.outline) : m.file ? await file(m.file) : await wiki(m.wiki);
      const hint = m.flag || m.outline || m.file || m.wiki;
      // Gently, so Wikipedia does not start turning requests away.
      await new Promise((r) => setTimeout(r, 300));
      const up = await uploadBuffer(got.bytes, { folder: FOLDER, publicId: got.publicId, format: got.format, overwrite: true, invalidate: true });
      m.src = up.url;
      m.credit = got.credit;
      if (Array.isArray(m.zoom)) {
        const near = await uploadBuffer(await closeUp(got.bytes, m.zoom), { folder: FOLDER, publicId: `${got.publicId}-zoom`, format: 'jpg', overwrite: true, invalidate: true });
        m.reveal = up.url;
        m.src = near.url;
      } else if (Array.isArray(m.hide)) {
        const hidden = await uploadBuffer(await hideName(got.bytes, m.hide, m.hideGround), { folder: FOLDER, publicId: `${got.publicId}-hidden`, format: 'png', overwrite: true, invalidate: true });
        m.reveal = up.url;
        m.src = hidden.url;
      }
      if (got.source) m.source = got.source;
      changed = true;
      done += 1;
      console.log(`${f}: ${hint}${m.zoom ? ' (zoomed)' : m.hide ? ' (name hidden)' : ''} → ${up.publicId} (${Math.round(up.bytes / 1024)} KB)${got.credit ? `  ${got.credit}` : ''}`);
    } catch (err) {
      failed += 1;
      console.log(`${f}: ${m.flag || m.outline || m.file || m.wiki} FAILED: ${err.message}`);
    }
  }
  if (changed) await writeFile(p, `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`\n${done} on Cloudinary, ${failed} failed.`);
