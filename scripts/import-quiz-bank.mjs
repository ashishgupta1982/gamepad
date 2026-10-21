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
const existing = new Set((await QuizQuestion.find({ fingerprint: { $in: docs.map((d) => d.fingerprint) } }, { fingerprint: 1 }).lean()).map((d) => d.fingerprint));
const fresh = docs.filter((d) => !existing.has(d.fingerprint));
console.log(`${existing.size} already in the bank, ${fresh.length} new.`);

if (!apply) {
  console.log('Dry run: nothing written. Add --apply to add the new ones.');
} else if (fresh.length) {
  const made = await QuizQuestion.insertMany(fresh, { ordered: false });
  console.log(`Added ${made.length} questions to the bank.`);
}
await mongoose.disconnect();
