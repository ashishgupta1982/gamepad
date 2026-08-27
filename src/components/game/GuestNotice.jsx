import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

// "This isn't being saved" — said once, up front.
//
// The save contract was already implemented in the code (Scrabble and Quiz keep
// a local `_id: 'guest'` game and skip every write) but it was never *stated*.
// A guest played a full game and only discovered it had not been kept when they
// came back and it was gone. Telling them before the game starts costs one line;
// telling them afterwards costs the game.
//
// Renders nothing at all for a signed-in user, and nothing while the session is
// still loading — a notice that flashes "not saved" at someone whose session is
// half a second from resolving is worse than no notice.
export default function GuestNotice({ className, children }) {
  const { status } = useSession();

  if (status !== 'unauthenticated') return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-border bg-muted/60 px-3 py-2.5',
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {children || 'Playing as a guest — this game won’t be saved.'}{' '}
        <Link href="/signin" className="font-semibold text-brand underline-offset-2 hover:underline">
          Sign in to keep it
        </Link>
      </p>
    </div>
  );
}
