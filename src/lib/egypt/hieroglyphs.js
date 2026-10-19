// A name, spelt in hieroglyphs, for the cartouche maker.
//
// The sign list is the usual "hieroglyph alphabet": uniliteral signs from
// Gardiner's list, with the vowels approximated the way museum shops and
// Egyptology books do it for modern names. Ancient Egyptian wrote few vowels, so
// this is spelling by sound, and the card says so. Every code point was checked
// against Unicode's own data (EGYPTIAN HIEROGLYPH <Gardiner number>) before it
// went in, because a wrong one renders as a perfectly plausible wrong sign.
//
// Two-letter sounds are matched before single letters, so "Ashish" becomes
// a-sh-i-sh, not a-s-h-i-s-h.

const SIGN = {
  vulture: { glyph: '𓄿', sound: 'a', name: 'vulture' }, // G1
  foot: { glyph: '𓃀', sound: 'b', name: 'foot' }, // D58
  basket: { glyph: '𓎡', sound: 'k', name: 'basket' }, // V31
  hand: { glyph: '𓂧', sound: 'd', name: 'hand' }, // D46
  reed: { glyph: '𓇋', sound: 'i', name: 'reed' }, // M17
  viper: { glyph: '𓆑', sound: 'f', name: 'horned viper' }, // I9
  jarStand: { glyph: '𓎼', sound: 'g', name: 'jar stand' }, // W11
  shelter: { glyph: '𓉔', sound: 'h', name: 'reed shelter' }, // O4
  cobra: { glyph: '𓆓', sound: 'j', name: 'cobra' }, // I10
  lion: { glyph: '𓃭', sound: 'l', name: 'lion' }, // E23
  owl: { glyph: '𓅓', sound: 'm', name: 'owl' }, // G17
  water: { glyph: '𓈖', sound: 'n', name: 'water' }, // N35
  quail: { glyph: '𓅱', sound: 'w / u / o', name: 'quail chick' }, // G43
  stool: { glyph: '𓊪', sound: 'p', name: 'stool' }, // Q3
  hill: { glyph: '𓈎', sound: 'q', name: 'hill' }, // N29
  mouth: { glyph: '𓂋', sound: 'r', name: 'mouth' }, // D21
  cloth: { glyph: '𓋴', sound: 's', name: 'folded cloth' }, // S29
  bread: { glyph: '𓏏', sound: 't', name: 'bread loaf' }, // X1
  reeds: { glyph: '𓇌', sound: 'y / ee', name: 'two reeds' }, // M17A
  bolt: { glyph: '𓊃', sound: 'z', name: 'door bolt' }, // O34
  pool: { glyph: '𓈙', sound: 'sh', name: 'pool' }, // N37
  rope: { glyph: '𓍿', sound: 'ch', name: 'tethering rope' }, // V13
  sieve: { glyph: '𓐍', sound: 'kh', name: 'sieve' }, // Aa1
};

// Longest first. Each maps to one or more signs.
const SOUNDS = [
  ['sh', ['pool']],
  ['ch', ['rope']],
  ['kh', ['sieve']],
  ['th', ['bread', 'shelter']],
  ['ph', ['viper']],
  ['ee', ['reeds']],
  ['oo', ['quail']],
  ['ck', ['basket']],
  ['qu', ['hill', 'quail']],
  ['a', ['vulture']],
  ['b', ['foot']],
  ['c', ['basket']],
  ['d', ['hand']],
  ['e', ['reed']],
  ['f', ['viper']],
  ['g', ['jarStand']],
  ['h', ['shelter']],
  ['i', ['reed']],
  ['j', ['cobra']],
  ['k', ['basket']],
  ['l', ['lion']],
  ['m', ['owl']],
  ['n', ['water']],
  ['o', ['quail']],
  ['p', ['stool']],
  ['q', ['hill']],
  ['r', ['mouth']],
  ['s', ['cloth']],
  ['t', ['bread']],
  ['u', ['quail']],
  ['v', ['viper']],
  ['w', ['quail']],
  ['x', ['basket', 'cloth']],
  ['y', ['reeds']],
  ['z', ['bolt']],
];

/**
 * Spell a name in hieroglyphs.
 * @returns {Array<{ letters: string, glyph: string, sound: string, name: string }>}
 *   one entry per sign, with the letters it stands for. Anything that is not a
 *   letter (spaces, hyphens, digits) is dropped; a doubled letter is written once,
 *   as Egyptian scribes did.
 */
export function spellName(input) {
  const text = String(input || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  const out = [];
  let i = 0;
  let last = '';
  while (i < text.length) {
    const match = SOUNDS.find(([s]) => text.startsWith(s, i));
    if (!match) { i += 1; continue; }
    const [letters, signs] = match;
    i += letters.length;
    if (letters === last && letters.length === 1) continue;
    last = letters;
    signs.forEach((key, k) => out.push({ letters: k === 0 ? letters : '', ...SIGN[key] }));
  }
  return out;
}

/** The sign list, for the key under the cartouche. */
export const ALPHABET = Object.values(SIGN);
