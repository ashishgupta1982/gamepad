import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { categoriesOf, fromBank, interleave, levelFilter, readSeedFile, share, toBank, writeTarget } from './bank';
import { checkMedia } from './questions';

const raw = (over = {}) => ({
  question: 'Which planet has the most moons?',
  options: ['Saturn', 'Jupiter', 'Mars', 'Venus'],
  answer: 'Saturn',
  explanation: 'Saturn has well over a hundred.',
  family: true,
  difficulty: 2,
  ...over,
});

describe('the question bank', () => {
  it('knows what each pick draws from', () => {
    expect(categoriesOf('space')).toEqual(['space']);
    expect(categoriesOf('group:sport')).toEqual(['football', 'olympics', 'sport-mix']);
    // Mixed bag is everything but Big Worlds.
    expect(categoriesOf('mixed')).toContain('geography');
    expect(categoriesOf('mixed')).not.toContain('harry-potter');
    expect(categoriesOf('nonsense')).toEqual([]);
    expect(categoriesOf({ name: 'Trains' })).toEqual([]);
  });

  it('searches by band, or by the family flag for Family mix', () => {
    expect(levelFilter('kids')).toEqual({ band: 'kids' });
    expect(levelFilter('adults')).toEqual({ band: 'adults' });
    expect(levelFilter('family')).toEqual({ family: true });
    expect(writeTarget('family')).toEqual({ band: 'kids', familyOnly: true });
    expect(writeTarget('adults')).toEqual({ band: 'adults', familyOnly: false });
  });

  it('shares a count between picks and deals them in turn', () => {
    expect(share(10, 3)).toEqual([4, 3, 3]);
    expect(share(3, 5)).toEqual([1, 1, 1, 0, 0]);
    expect(interleave([[1, 2, 3], ['a'], ['x', 'y']])).toEqual([1, 'a', 'x', 2, 'y', 3]);
  });

  it('checks and tags a question on its way in', () => {
    const doc = toBank(raw({ dated: true }), { category: 'space', band: 'kids', source: 'seed' });
    expect(doc).toMatchObject({ category: 'space', band: 'kids', family: true, difficulty: 2, dated: true, source: 'seed', correctAnswer: 0 });
    expect(doc.fingerprint).toMatch(/^[a-z0-9]+$/);
    expect(toBank(raw({ difficulty: 9, family: 'yes' }), { category: 'space', band: 'adults' })).toMatchObject({ difficulty: 2, family: false });
    expect(toBank(raw(), { category: 'mixed', band: 'kids' })).toBeNull();
    expect(toBank(raw(), { category: 'space', band: 'family' })).toBeNull();
    expect(toBank(raw({ answer: 'Pluto' }), { category: 'space', band: 'kids' })).toBeNull();
  });

  it('serves a bank question shuffled, with the right answer still right', () => {
    const doc = toBank(raw({ media: { kind: 'emoji', text: '🪐' } }), { category: 'space', band: 'kids' });
    const q = fromBank(doc, () => 0.99);
    expect(q.options[q.correctAnswer]).toBe('Saturn');
    expect(q).toMatchObject({ id: doc.fingerprint, category: 'Space', media: { kind: 'emoji', text: '🪐' } });
  });

  it('knows a picture question by its picture, whatever the upload version', () => {
    const at = (v) => toBank(raw({ question: 'Which country’s flag is this?', media: { kind: 'image', src: `https://res.cloudinary.com/x/image/upload/${v}/GamePad/quiz/flag-br.png` } }), { category: 'flags-capitals', band: 'kids' });
    expect(at('v1').fingerprint).toBe(at('v2').fingerprint);
    const other = toBank(raw({ question: 'Which country’s flag is this?', media: { kind: 'image', src: 'https://res.cloudinary.com/x/image/upload/v1/GamePad/quiz/flag-ca.png' } }), { category: 'flags-capitals', band: 'kids' });
    expect(other.fingerprint).not.toBe(at('v1').fingerprint);
  });

  it('keeps only pictures on https', () => {
    expect(checkMedia({ kind: 'image', src: '/quiz/flags/fr.svg', alt: 'A flag' })).toBeNull();
    expect(checkMedia({ kind: 'image', src: 'https://res.cloudinary.com/x/a.webp', credit: 'Photo: A. Person, CC BY-SA 4.0' })).toBeTruthy();
    expect(checkMedia({ kind: 'image', src: 'javascript:alert(1)' })).toBeNull();
    expect(checkMedia({ kind: 'image', src: 'http://example.com/a.jpg' })).toBeNull();
    expect(checkMedia({ kind: 'emoji', text: '' })).toBeNull();
    expect(checkMedia({ kind: 'sound', src: '/quiz/a.mp3' })).toBeNull();
  });

  it('reads a seed file, naming the questions it leaves out', () => {
    const { docs, errors } = readSeedFile(
      { category: 'space', questions: [{ ...raw(), band: 'kids' }, { ...raw(), band: 'kids' }, { ...raw({ question: 'Which star is closest to Earth?', options: ['The Sun', 'Sirius', 'Vega', 'Polaris'], answer: 'The Sun' }), band: 'grown' }] },
      'space.json',
    );
    expect(docs).toHaveLength(1);
    expect(errors).toEqual(['space.json #2: a repeat', expect.stringContaining('space.json #3: not a usable question')]);
    expect(readSeedFile({ category: 'mixed', questions: [] }).errors[0]).toMatch(/unknown category/);
  });
});

// Every seed file must load cleanly: a bad question fails here, not in the database.
describe('the seed files', () => {
  const dir = path.resolve(__dirname, '../../../data/quiz-bank');
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {}
  it.each(files.length ? files : ['(none yet)'])('%s loads with no problems', (file) => {
    if (file === '(none yet)') return;
    const json = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    expect(json.category).toBe(file.replace(/\.json$/, ''));
    expect(readSeedFile(json, file).errors).toEqual([]);
  });
});
