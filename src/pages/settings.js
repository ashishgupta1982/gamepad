import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import AppHeader from '@/components/layout/AppHeader';
import SettingsPage from '../components/settings/SettingsPage';

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/signin');
  };

  const handleSignOut = () => {
    signOut();
  };

  // Back to wherever you came from; the games room only when opened directly.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <>
      <Head>
        <title>Settings — GamePad</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
        <AppHeader showBack onBack={handleBack} title="Settings" />
        
        <SettingsPage 
          session={session}
          isGuest={!session}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />
      </main>
    </>
  );
}
