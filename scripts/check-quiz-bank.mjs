// Check seed questions before they go into the bank. Reads only; changes nothing.
//
//   npm run quiz:check                     every question in the files not yet in the bank
//   npm run quiz:check -- formula-1.json   just the new questions in these files
//   npm run quiz:check -- --all            every question, the ones already in too
//
// For each question checked it lists:
//   - anything that will not load (as npm run quiz:import would refuse it);
//   - a question too close to another one anywhere: in any seed file, or in the
//     live bank, including what the writer added in play (lib/quiz/overlap.js:
//     the same fact in other words, nearly the same wording, the same picture);
//   - pairs with the same answer and some words in common, to look at: these
//     are often fine, so they are listed but do not fail the check;
// and for each category touched, what it holds: per band, family, difficulty
// and pictures, against the counts in WRITING-GUIDE.md.
//
// A picture question whose picture is not fetched yet is checked by its hint
// and noted; run npm run quiz:images, then this again. Exits 1 if anything is
// listed, so it can stand in front of an import. The bank is MONGODB_URI from
// .env.local, the live one; without it the files are checked against each other.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { readSeedFile, toBank } from '../src/lib/quiz/bank.js';
import { tooClose, worthALook } from '../src/lib/quiz/overlap.js';

const args = process.argv.slice(2);
const all = args.includes('--all');
const named = args.filter((a) => !a.startsWith('--')).map((a) => path.basename(a));
const dir = path.resolve('data/quiz-bank');
const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
for (const f of named) if (!files.includes(f)) throw new Error(`No ${f} in ${dir}`);

// Every seed question, as written in its file.
const seeds = [];
const problems = [];
for (const file of files) {
  const json = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  const mine = !named.length || named.includes(file);
  if (mine) for (const e of readSeedFile(json, file).errors) if (!e.includes('did not check out')) problems.push(e);
  (json.questions || []).forEach((raw, i) => {
    const waiting = raw.media?.kind === 'image' && !raw.media.src;
    const doc = toBank(raw, { category: json.category, band: raw.band, source: 'seed' });
    if (mine && raw.media && !waiting && !doc?.media) problems.push(`${file} #${i + 1}: its picture or emoji did not check out`);
    seeds.push({ file, n: i + 1, category: json.category, band: raw.band, raw, fingerprint: doc?.fingerprint, waiting, mine });
  });
}

// The live bank, retired questions aside.
let bank = [];
if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI);
  bank = await mongoose.connection.db
    .collection('quizquestions')
    .find({ status: { $ne: 'retired' } }, { projection: { fingerprint: 1, question: 1, options: 1, correctAnswer: 1, category: 1, band: 1, media: 1, source: 1 } })
    .toArray();
  await mongoose.disconnect();
} else {
  console.log('No MONGODB_URI: checking the files against each other only.\n');
}
const inBank = new Set(bank.map((d) => d.fingerprint));

const checking = seeds.filter((s) => s.mine && (all || !s.fingerprint || !inBank.has(s.fingerprint)));
const label = (x) => (x.file ? `${x.file} #${x.n}` : `bank (${x.source}, ${x.category} ${x.band})`);
const pool = [
  ...seeds.map((s) => ({ ...s, q: s.raw })),
  ...bank.filter((d) => !seeds.some((s) => s.fingerprint === d.fingerprint)).map((d) => ({ ...d, q: d })),
];

const close = [];
const look = [];
const reported = new Set();
for (const s of checking) {
  for (const o of pool) {
    if (o === pool.find((p) => p.file === s.file && p.n === s.n)) continue;
    if (s.fingerprint && s.fingerprint === o.fingerprint) continue;
    const why = tooClose(s.raw, o.q) || (worthALook(s.raw, o.q) && 'look');
    if (!why) continue;
    const key = [label(s), label(o)].sort().join(' | ');
    if (reported.has(key)) continue;
    reported.add(key);
    (why === 'look' ? look : close).push({ why, a: s, b: o });
  }
}

console.log(`Checked ${checking.length} question${checking.length === 1 ? '' : 's'}${all ? '' : ' not yet in the bank'}${named.length ? ` in ${named.join(', ')}` : ''}, against ${pool.length}.`);
const waiting = checking.filter((s) => s.waiting);
if (waiting.length) console.log(`${waiting.length} picture${waiting.length === 1 ? ' is' : 's are'} not fetched yet (npm run quiz:images), so checked by hint.`);

if (problems.length) {
  console.log(`\nWill not load (${problems.length}):`);
  for (const p of problems) console.log(`  - ${p}`);
}
if (close.length) {
  console.log(`\nToo close (${close.length}): rewrite or drop one of each pair, unless they really are different questions.`);
  for (const { why, a, b } of close) {
    console.log(`  - ${why}`);
    console.log(`      ${label(a)}: ${a.raw.question}`);
    console.log(`      ${label(b)}: ${b.q.question}`);
  }
}

if (look.length) {
  console.log(`
Same answer, worth a look (${look.length}): fine if they are different facts; rewrite one if it is the same fact, or gives the other away.`);
  for (const { a, b } of look) {
    console.log(`      ${label(a)}: ${a.raw.question}`);
    console.log(`      ${label(b)}: ${b.q.question}`);
    console.log('');
  }
}

// What each category touched holds, from the files.
const cats = [...new Set(checking.map((s) => s.category))];
if (cats.length) {
  console.log('\nWhat the files hold (WRITING-GUIDE.md → How many):');
  for (const c of cats) {
    for (const band of ['kids', 'adults']) {
      const qs = seeds.filter((s) => s.category === c && s.band === band);
      const fam = qs.filter((s) => s.raw.family === true).length;
      const d = [1, 2, 3].map((k) => qs.filter((s) => s.raw.difficulty === k).length);
      const pics = qs.filter((s) => s.raw.media?.kind === 'image').length;
      const emoji = qs.filter((s) => s.raw.media?.kind === 'emoji').length;
      const zoom = qs.filter((s) => Array.isArray(s.raw.media?.zoom)).length;
      const written = bank.filter((b) => b.category === c && b.band === band && b.source === 'writer').length;
      console.log(
        `  ${c} ${band.padEnd(6)} ${String(qs.length).padStart(3)} questions · family ${Math.round((100 * fam) / Math.max(1, qs.length))}% · difficulty ${d.join('/')} · ${pics} pictures (${zoom} close-ups), ${emoji} emoji${written ? ` · and ${written} the writer added in play` : ''}`,
      );
    }
  }
}

if (!problems.length && !close.length) console.log('\nNothing to fix.');
process.exitCode = problems.length || close.length ? 1 : 0;
