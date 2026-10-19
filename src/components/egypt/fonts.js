import { Noto_Sans_Egyptian_Hieroglyphs } from 'next/font/google';

// Hieroglyphs need a font that has them: phones ship few, and a missing glyph
// renders as an empty box. Loaded here rather than in _app.js so only Egypt
// Explorer pays for it. Used through `style`, not a CSS variable on a wrapper,
// because the passport and the guide are portalled sheets that sit outside any
// wrapper this page could put a variable on.
const hiero = Noto_Sans_Egyptian_Hieroglyphs({
  weight: '400',
  subsets: ['egyptian-hieroglyphs'],
  display: 'swap',
});

export const HIERO_STYLE = { fontFamily: hiero.style.fontFamily };
