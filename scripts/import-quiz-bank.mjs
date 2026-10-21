// Load the seed questions in data/quiz-bank/*.json into the question bank
// (models/QuizQuestion.js). A dry run unless --apply is given: it reads and
// checks every file, then says what it would add.
//
//   npm run quiz:import             check the files, write nothing
//   npm run quiz:import -- --apply  add the new questions to the database
//
// Insert-only: a question already in the bank (same fingerprint) is left as it
// is, stats, status and all, so running it again is always safe. The database
// is MONGODB_URI from .env.local, the live one.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { bankCategoryIds, readSeedFile } from '../src/lib/quiz/bank.js';
import QuizQuestion from '../src/models/QuizQuestion.js';

const apply = process.argv.includes('--apply');
const dir = path.resolve('data/quiz-bank');

const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json')).sort();
if (!files.length) {
  console.log(`No seed files in ${dir}.`);
  process.exit(0);
}

const all = [];
const problems = [];
const tally = {};
for (const file of files) {
  let json;
  try {
    json = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  } catch (err) {
    problems.push(`${file}: not valid JSON (${err.message})`);
    continue;
  }
  const { docs, errors } = readSeedFile(json, file);
  problems.push(...errors);
  for (const d of docs) {
    const key = `${d.category} · ${d.band}`;
    tally[key] = tally[key] || { questions: 0, family: 0, media: 0 };
    tally[key].questions += 1;
    if (d.family) tally[key].family += 1;
    if (d.media) tally[key].media += 1;
  }
  all.push(...docs);
}

// The same question in two files is kept once.
const byFingerprint = new Map();
for (const d of all) if (!byFingerprint.has(d.fingerprint)) byFingerprint.set(d.fingerprint, d);
const docs = [...byFingerprint.values()];

console.log('\nCategory · band                     questions  family  pictures');
for (const [key, t] of Object.entries(tally).sort()) {
  console.log(`${key.padEnd(36)} ${String(t.questions).padStart(9)} ${String(t.family).padStart(7)} ${String(t.media).padStart(9)}`);
}
const missing = bankCategoryIds().filter((id) => !Object.keys(tally).some((k) => k.startsWith(`${id} ·`)));
if (missing.length) console.log(`\nNo seed questions yet: ${missing.join(', ')}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s), left out:`);
  for (const p of problems) console.log(`  - ${p}`);
}
console.log(`\n${docs.length} usable questions in ${files.length} file(s).`);

if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI is not set: run through npm run quiz:import, which reads .env.local.');
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);

// What the files say, against what the bank holds. A seed question corrected
// in its file (an option, the explanation, a tag) is updated in place, its
// stats kept. One whose wording changed has a new fingerprint, so it arrives
// as new, and the old wording, no longer in any file, is retired. Questions
// the writer added during play are never touched.
const FIELDS = ['question', 'options', 'correctAnswer', 'explanation', 'category', 'band', 'family', 'difficulty', 'dated', 'media'];
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const plainMedia = (m) => (m?.kind ? Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined && v !== '')) : null);
const inBank = new Map((await QuizQuestion.find({ source: 'seed' }).lean()).map((d) => [d.fingerprint, d]));
const fresh = [];
const changed = [];
for (const d of docs) {
  const had = inBank.get(d.fingerprint);
  if (!had) fresh.push(d);
  else if (FIELDS.some((f) => (f === 'media' ? !same(plainMedia(had.media), plainMedia(d.media)) : !same(had[f], d[f])))) changed.push(d);
  // Retired, but back in a file: it comes back into play.
  else if (had.status === 'retired') changed.push(d);
}
const inFiles = new Set(docs.map((d) => d.fingerprint));
const gone = [...inBank.values()].filter((d) => !inFiles.has(d.fingerprint) && d.status !== 'retired');
// A new seed question may already be in the bank from the writer: it is left as it is.
const fromWriter = new Set((await QuizQuestion.find({ fingerprint: { $in: fresh.map((d) => d.fingerprint) } }, { fingerprint: 1 }).lean()).map((d) => d.fingerprint));
const toAdd = fresh.filter((d) => !fromWriter.has(d.fingerprint));

console.log(`\nThe bank: ${inBank.size} seed questions now.`);
console.log(`  ${toAdd.length} to add${fromWriter.size ? ` (${fromWriter.size} more already there from the writer, left alone)` : ''}`);
console.log(`  ${changed.length} to update in place`);
for (const d of changed) console.log(`    ~ ${d.category}: ${d.question.slice(0, 70)}`);
console.log(`  ${gone.length} to retire (no longer in any file)`);
for (const d of gone) console.log(`    - ${d.category}: ${d.question.slice(0, 70)}`);

if (!apply) {
  console.log('\nDry run: nothing written. Add --apply to do it.');
} else {
  if (toAdd.length) console.log(`Added ${(await QuizQuestion.insertMany(toAdd, { ordered: false })).length}.`);
  for (const d of changed) {
    // Corrected, so back in play: a question the thumbs sent to review (or one
    // retired) is served again, and its "wrong answer" flags are cleared.
    const set = { ...Object.fromEntries(FIELDS.map((f) => [f, d[f] ?? null])), status: 'active', 'stats.wrong': 0 };
    await QuizQuestion.updateOne({ fingerprint: d.fingerprint }, { $set: set });
  }
  if (changed.length) console.log(`Updated ${changed.length}.`);
  if (gone.length) {
    await QuizQuestion.updateMany({ fingerprint: { $in: gone.map((d) => d.fingerprint) } }, { $set: { status: 'retired' } });
    console.log(`Retired ${gone.length}.`);
  }
}
const live = await QuizQuestion.countDocuments({ status: 'active' });
console.log(`\nActive questions in the bank${apply ? '' : ' today'}: ${live}.`);
await mongoose.disconnect();
