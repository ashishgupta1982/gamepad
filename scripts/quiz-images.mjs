// Fetch the pictures for the seed questions in data/quiz-bank/*.json.
//
//   npm run quiz:images
//
// A question's picture is written as a hint, and this fills in the rest:
//   {kind:'image', flag:'br'}          the national flag, from flagcdn.com
//                                      (public domain), saved as an SVG
//   {kind:'image', wiki:'Angkor_Wat'}  the lead photo of that English
//                                      Wikipedia article, saved as a WebP at
//                                      most 960px wide, with its credit and
//                                      licence from Wikimedia Commons
// Files go to public/quiz/flags and public/quiz/pics, served as /quiz/…, and
// `src` and `credit` are written back into the seed file. A picture already
// fetched (its `src` file exists) is skipped, so it is safe to run again.
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('.');
const SEED = path.join(ROOT, 'data/quiz-bank');
const PUBLIC = path.join(ROOT, 'public');
// Wikimedia asks every client to say who it is.
const HEADERS = { 'User-Agent': 'GamePadQuizSeed/1.0 (https://github.com/ashishgupta1982/gamepad)' };

const exists = (p) => access(p).then(() => true, () => false);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const plain = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function flag(code) {
  const rel = `/quiz/flags/${code}.svg`;
  const file = path.join(PUBLIC, rel);
  if (!(await exists(file))) {
    const res = await fetch(`https://flagcdn.com/${code}.svg`, { headers: HEADERS });
    if (!res.ok) throw new Error(`no flag for ${code} (${res.status})`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return { src: rel, credit: '' };
}

async function wiki(title) {
  const rel = `/quiz/pics/${slug(title)}.webp`;
  const file = path.join(PUBLIC, rel);
  // The article's lead image, then that file's licence on Commons.
  const page = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(title)}`);
  const name = Object.values(page.query?.pages || {})[0]?.pageimage;
  if (!name) throw new Error(`no lead image on ${title}`);
  const info = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&titles=${encodeURIComponent(`File:${name}`)}`,
  );
  const ii = Object.values(info.query?.pages || {})[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`no image info for ${name}`);
  const meta = ii.extmetadata || {};
  const artist = plain(meta.Artist?.value) || 'Unknown';
  const licence = plain(meta.LicenseShortName?.value) || 'see Wikimedia Commons';
  const publicDomain = /public domain|pd|cc0/i.test(licence);
  if (!(await exists(file))) {
    const res = await fetch(ii.thumburl || ii.url, { headers: HEADERS });
    if (!res.ok) throw new Error(`could not download ${name} (${res.status})`);
    await mkdir(path.dirname(file), { recursive: true });
    await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(file);
  }
  const credit = publicDomain ? `Photo: ${artist.slice(0, 80)}, public domain (Wikimedia Commons)` : `Photo: ${artist.slice(0, 80)}, ${licence} (Wikimedia Commons)`;
  return { src: rel, credit, source: ii.descriptionurl };
}

const files = (await readdir(SEED)).filter((f) => f.endsWith('.json')).sort();
let fetched = 0;
let failed = 0;
for (const f of files) {
  const p = path.join(SEED, f);
  const json = JSON.parse(await readFile(p, 'utf8'));
  let changed = false;
  for (const q of json.questions || []) {
    const m = q.media;
    if (m?.kind !== 'image' || (!m.flag && !m.wiki)) continue;
    if (m.src && (await exists(path.join(PUBLIC, m.src)))) continue;
    try {
      const got = m.flag ? await flag(m.flag) : await wiki(m.wiki);
      Object.assign(m, got);
      changed = true;
      fetched += 1;
      console.log(`${f}: ${m.flag || m.wiki} → ${got.src}${got.credit ? `  (${got.credit})` : ''}`);
    } catch (err) {
      failed += 1;
      console.log(`${f}: ${m.flag || m.wiki} FAILED: ${err.message}`);
    }
  }
  if (changed) await writeFile(p, `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`\n${fetched} fetched, ${failed} failed.`);
