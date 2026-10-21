import { play } from '@/components/arcade/sfx';
import { buzz, celebrate } from '@/components/arcade/feedback';
import { rankFor } from '@/lib/egypt/progress';

// Egypt Explorer's big moments, through the shared arcade kit (sound with the
// shared mute, a buzz, confetti, the banner). The game keeps its own look; only
// the celebrations are shared. Small moments get a sound and a buzz; a stamp
// gets words; a new rank or a full passport gets the confetti.

// Gold, lapis, papyrus, with turquoise and terracotta from the tomb paintings.
const CONFETTI = ['#f0b019', '#23376b', '#f7eedb', '#2bb3a6', '#c2502e'];

/** A quiz answer, the moment it is picked. */
export function answered(correct) {
  if (correct) {
    play('correct');
    buzz(30);
  } else {
    play('wrong');
    buzz([40, 60, 40]);
  }
}

/** A "look closely" item ticked or unticked. */
export function looked(ticked) {
  play(ticked ? 'pop' : 'back');
  if (ticked) buzz(20);
}

/** A photo quest the guide accepted. */
export function questFound(banner, { name, points }) {
  play('line');
  buzz([40, 30, 80]);
  celebrate('small', CONFETTI);
  banner.show({ title: 'Found it!', text: `+${points} to ${name}`, tone: 'win' });
}

/**
 * A stop's stamp, when the player taps "Get the stamp". `stamps` is their
 * count for the trip including this one, so one fewer is where they were.
 */
export function stamped(banner, { name, stamps, total, correct, questions }) {
  const rank = rankFor(stamps);
  const before = rankFor(stamps - 1);
  const perfect = correct === questions;

  if (stamps >= total) {
    play('win');
    buzz([60, 40, 60, 40, 200]);
    celebrate('big', CONFETTI);
    banner.show({ title: 'EVERY STAMP!', text: `${name} is a ${rank.title}: the passport is full`, tone: 'win', big: true, hold: 3400 });
    return;
  }
  play('stamp');
  buzz([30, 40, 60]);
  if (rank.title !== before.title) {
    celebrate('small', CONFETTI);
    banner.show({ title: `${rank.title}!`, text: stamps === 1 ? `${name}’s first stamp, and a new rank` : `${name} has ${stamps} stamps and a new rank`, tone: 'win', big: true, hold: 2800 });
    return;
  }
  if (perfect) celebrate('small', CONFETTI);
  banner.show({ title: 'Stamped!', text: perfect ? `Every answer right, ${name}` : `${correct} of ${questions} right`, tone: 'win' });
}
