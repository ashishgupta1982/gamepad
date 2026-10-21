import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Settings, LogOut, LogIn, User } from 'lucide-react';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

// The round account button and the bottom sheet it opens. Lifted out of
// AppHeader so the games room on the home page can put the same button in its
// corner without the header bar.
//
// `onSignIn`, when given, is what the guest's "Sign in" does instead of going
// to /signin: the home page opens its own SignInDialog.
export default function AccountMenu({ className, onSignIn }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user;
  const isAuthenticated = !!session;
  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'G';

  const rowClass =
    'press flex min-h-touch items-center gap-3 rounded-lg px-3 text-base font-medium text-foreground transition-colors hover:bg-muted';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isAuthenticated ? 'Account menu' : 'Menu'}
        className={cn(
          'press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground',
          className,
        )}
      >
        {initial}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={isAuthenticated ? user?.name || 'Your account' : 'Not signed in'}>
          {/* The email lives here — one tap away, on a surface the owner opened
              deliberately — rather than on every screen of a shared device. */}
          {isAuthenticated ? (
            <p className="-mt-3 truncate text-sm text-muted-foreground">{user?.email}</p>
          ) : (
            <p className="-mt-3 text-sm leading-relaxed text-muted-foreground">
              Every game works without an account. Sign in and your scores start saving.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-1">
            <SheetClose asChild>
              <Link href="/settings" className={rowClass}>
                <Settings className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                Settings
              </Link>
            </SheetClose>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className={rowClass}
              >
                <LogOut className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                Sign out
              </button>
            ) : onSignIn ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignIn();
                }}
                className={cn(rowClass, 'font-semibold text-brand hover:bg-brand-soft')}
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Sign in
              </button>
            ) : (
              <SheetClose asChild>
                <Link href="/signin" className={cn(rowClass, 'font-semibold text-brand hover:bg-brand-soft')}>
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Sign in
                </Link>
              </SheetClose>
            )}
          </div>

          {!isAuthenticated && (
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              Playing as a guest
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
