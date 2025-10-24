import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
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

  const handleBack = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Settings - Aspiro Consulting</title>
        <meta name="description" content="Manage your account settings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header showBackButton={true} onBackClick={handleBack} />
        
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
