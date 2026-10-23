import { describe, expect, it } from 'vitest';
import { pictureKey, similarity, tooClose, worthALook } from './overlap';

const q = (question, answer, media) => ({ question, options: [answer, 'x', 'y', 'z'], correctAnswer: 0, ...(media ? { media } : {}) });

describe('questions too close to share a bank', () => {
  it('the same fact in other words, in any category', () => {
    expect(tooClose(q("What are Adele's albums 19, 21, 25 and 30 named after?", 'Her age'), q("Adele's albums 19, 21, 25 and 30 are named after what?", 'Her age'))).toBe(
      'same answer, similar question',
    );
  });

  it('nearly the same question with a different answer', () => {
    expect(tooClose(q('Which planet in our solar system has the most moons?', 'Saturn'), q('Which planet in the solar system has the most moons?', 'Jupiter'))).toBe('near-identical wording');
  });

  it('the same picture twice, hint or uploaded', () => {
    expect(tooClose(q("Which country's flag is this?", 'Japan', { kind: 'image', flag: 'jp' }), q('Which country uses this flag?', 'Japan', { kind: 'image', flag: 'jp' }))).toBe('same picture');
    expect(pictureKey({ kind: 'image', src: 'https://x/v17/GamePad/quiz/dartboard-zoom.jpg' })).toBe(pictureKey({ kind: 'image', src: 'https://x/v18/GamePad/quiz/dartboard.jpg' }));
  });

  it('not two picture questions that only share their wording', () => {
    expect(tooClose(q("Which country's flag is this?", 'Japan', { kind: 'image', flag: 'jp' }), q("Which country's flag is this?", 'Peru', { kind: 'image', flag: 'pe' }))).toBeNull();
    expect(tooClose(q('Which film do these emoji describe?', 'Frozen', { kind: 'emoji', text: '❄️👸' }), q('Which film do these emoji describe?', 'Cars', { kind: 'emoji', text: '🚗🏁' }))).toBeNull();
  });

  it('not two different questions that share an answer', () => {
    expect(tooClose(q('What type of Pokémon is Squirtle?', 'Water'), q('Which type of move beats a Fire-type Pokémon?', 'Water'))).toBeNull();
    expect(similarity('Who painted the Mona Lisa?', 'Which river runs through London?')).toBe(0);
  });

  it('the same answer in different words, as one to look at', () => {
    const a = q('Harry Styles first became famous in which boy band, formed on The X Factor in 2010?', 'One Direction');
    const b = q('Which band was Harry Styles in before he went solo?', 'One Direction');
    expect(tooClose(a, b)).toBeNull();
    expect(worthALook(a, b)).toBe(true);
    expect(worthALook(a, q('Which band sang What Makes You Beautiful?', 'One Direction'))).toBe(false);
  });
});
