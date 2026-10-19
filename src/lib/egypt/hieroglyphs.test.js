import { describe, it, expect } from 'vitest';
import { spellName } from './hieroglyphs';

const signs = (name) => spellName(name).map((s) => s.name);

describe('spellName', () => {
  it('spells two-letter sounds as one sign', () => {
    expect(signs('Ashish')).toEqual(['vulture', 'pool', 'reed', 'pool']);
  });

  it('writes a doubled letter once, as scribes did', () => {
    expect(signs('Anna')).toEqual(['vulture', 'water', 'vulture']);
  });

  it('drops spaces, digits and accents', () => {
    expect(signs('Zoë 2')).toEqual(['door bolt', 'quail chick', 'reed']);
  });

  it('uses two signs where one sound needs them', () => {
    expect(signs('Max')).toEqual(['owl', 'vulture', 'basket', 'folded cloth']);
  });

  it('returns nothing for nothing', () => {
    expect(spellName('')).toEqual([]);
    expect(spellName('123')).toEqual([]);
  });
});
