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
  const png = await sharp(Buffer.from(svg), { density: 96 }).resize({ width: 900, height: 900, fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
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
      }
      if (got.source) m.source = got.source;
      changed = true;
      done += 1;
      console.log(`${f}: ${hint}${m.zoom ? ' (zoomed)' : ''} → ${up.publicId} (${Math.round(up.bytes / 1024)} KB)${got.credit ? `  ${got.credit}` : ''}`);
    } catch (err) {
      failed += 1;
      console.log(`${f}: ${m.flag || m.outline || m.file || m.wiki} FAILED: ${err.message}`);
    }
  }
  if (changed) await writeFile(p, `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`\n${done} on Cloudinary, ${failed} failed.`);
