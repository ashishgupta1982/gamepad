import { isMuted } from './sfx';

// The caller: the browser's own speech, in a British voice where the device has
// one. "ONE HUNDRED AND EIGHTY!" is the reason it exists (REDESIGN-PLAN.md,
// Phase 4). It follows the same mute switch as the sound effects, and like
// them it is decoration: no voice, no speech, nothing breaks.

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'en-GB' && /daniel|arthur|george|male/i.test(v.name)) || voices.find((v) => v.lang === 'en-GB') || null;
}

export function say(text, { rate = 1, pitch = 1 } = {}) {
  if (typeof window === 'undefined' || isMuted() || !window.speechSynthesis) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    // The list loads late on some browsers, so it is asked for each time.
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    synth.speak(u);
  } catch {}
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const under100 = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`);

/** British style: "one hundred and forty". Up to 999. */
export function numberWords(n) {
  if (n < 100) return under100(n);
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` and ${under100(rest)}` : ''}`;
}

/** What the caller shouts for a visit. */
export function callVisit(total) {
  if (total === 180) return say('One hundred and eighty!', { rate: 0.85, pitch: 1.15 });
  if (total === 0) return say('No score');
  return say(numberWords(total), { pitch: total >= 100 ? 1.1 : 1 });
}
