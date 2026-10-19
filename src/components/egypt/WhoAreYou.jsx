import { Users } from 'lucide-react';
import { HIERO_STYLE } from './fonts';
import GuestNotice from '@/components/game/GuestNotice';
import { PlayerList } from './PlayerSwitch';
import { SIGN_IN } from './PlayerSetup';

// "Who's playing on this phone?" Asked once per phone, after the family is
// set up. Each phone remembers its own answer; the header changes it later.
export default function WhoAreYou({ players, onPick, onEditFamily }) {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-3xl leading-none text-gold" style={HIERO_STYLE} aria-hidden="true">𓀀𓁐𓀔</span>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground">Who’s playing on this phone?</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Everything you do counts for you: your answers, your photo quests, your stamps. Handing the phone over?
          Switch with the name at the top.
        </p>
      </div>

      <GuestNotice signInHref={SIGN_IN} action="Sign in">
        Not signed in, so your scores stay on this phone. To play with the family on other phones, sign in to the family account.
      </GuestNotice>

      <PlayerList players={players} me={null} onPick={onPick} />

      <button
        type="button"
        onClick={onEditFamily}
        className="press flex min-h-touch w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-lapis hover:bg-muted"
      >
        <Users className="h-4 w-4" aria-hidden="true" /> Not on the list? Edit the family
      </button>
    </div>
  );
}
