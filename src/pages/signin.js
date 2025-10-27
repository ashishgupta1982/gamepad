import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useTeamsContext } from '../hooks/useTeamsContext';

export default function SignIn() {
  const router = useRouter();
  const { isTeams, teamsContext, isLoading: teamsLoading } = useTeamsContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Auto-login when in Teams environment
  useEffect(() => {
    if (!teamsLoading && isTeams && !isAuthenticating && !authSuccess) {
      handleTeamsAutoLogin();
    }
  }, [teamsLoading, isTeams, isAuthenticating, authSuccess, handleTeamsAutoLogin]);

  const handleTeamsAutoLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Get Teams SSO token automatically
      const token = await window.microsoftTeams.authentication.getAuthToken({
        resources: [process.env.NEXT_PUBLIC_APP_ID_URI],
      });

      // Send token to our backend for verification and session creation
      const response = await fetch('/api/auth/teams-sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();

      // Success! Mark as authenticated
      setAuthSuccess(true);
      setAuthError(null);

      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error) {
      console.error('Teams auto-login error:', error);
      setAuthError(error.message || 'Failed to authenticate with Teams');
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Aspiro Consulting</title>
        <meta name="description" content="Sign in to Aspiro Consulting AI platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Sign In
              </h1>
              {isTeams && isAuthenticating ? (
                <p className="text-blue-600 font-medium">
                  Authenticating with Microsoft Teams...
                </p>
              ) : authSuccess ? (
                <p className="text-green-600 font-medium">
                  Successfully authenticated! Redirecting...
                </p>
              ) : authError ? (
                <p className="text-red-600 font-medium">
                  {authError}
                </p>
              ) : (
                <p className="text-slate-600">
                  Choose your preferred sign-in method
                </p>
              )}
            </div>

            {/* Sign In Card */}
            <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <div className="space-y-6">

              {/* Google Sign In */}
              <Button
                onClick={() => signIn('google', { prompt: 'select_account', callbackUrl: '/' })}
                variant="outline"
                size="lg"
                className="w-full h-14 flex items-center justify-center gap-3 text-lg"
                disabled={isAuthenticating || authSuccess}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              {/* Microsoft Teams Sign In */}
              <Button
                onClick={() => signIn('azure-ad', { prompt: 'select_account', callbackUrl: '/' })}
                variant="outline"
                size="lg"
                className="w-full h-14 flex items-center justify-center gap-3 text-lg"
                disabled={isAuthenticating || authSuccess}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#00BCF2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Continue with Microsoft Teams
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Guest Access */}
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full h-12 border-slate-300 text-slate-600 hover:bg-slate-50"
                disabled={isAuthenticating || authSuccess}
              >
                Continue as Guest
              </Button>
              </div>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
