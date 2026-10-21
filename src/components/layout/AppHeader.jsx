import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccountMenu from './AccountMenu';
import { cn } from '@/lib/cn';

// The one header. Replaces Header.js and ProfessionalHeader.js, which were
// near-identical copies that had already drifted apart in height, avatar size
// and what they showed — /signin and /settings got one, every other page the
// other, and nobody could have told you why.
//
// Three things changed beyond merging them:
//
// 1. The account menu is a bottom SHEET, not a hover-positioned dropdown. This
//    phone gets handed across a table; a dropdown anchored under the cursor is
//    meaningless on touch, and its options sat out of thumb reach at the top of
//    the screen.
// 2. The email address is gone from the bar. It was rendered in plain sight on
//    every screen of a device that gets passed to other people.
// 3. py-2 not py-4, and a 36px avatar not 40px. The old bar spent ~72px of a
//    ~650px viewport on a logo and an avatar, on every single screen.
export default function AppHeader({
  showBack = false,
  onBack,
  title,
  // Something a game puts beside the account button, such as Egypt Explorer's
  // "who is playing" switch.
  aside,
  className,
}) {
  const router = useRouter();

  const handleBack = () => (onBack ? onBack() : router.back());

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-sm pt-safe',
          className,
        )}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-1">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="press -ml-2 flex min-h-touch min-w-touch items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <Link href="/" className="press flex min-h-touch items-center gap-2 rounded-lg pr-2">
                <img
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8 shrink-0 rounded-lg"
                />
                <span className="font-display text-lg font-semibold text-foreground">GamePad</span>
              </Link>
            )}

            {title && (
              <h1 className="truncate font-display text-lg font-semibold text-foreground">
                {title}
              </h1>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {aside}
            <AccountMenu />
          </div>
        </div>
      </nav>

    </>
  );
}
