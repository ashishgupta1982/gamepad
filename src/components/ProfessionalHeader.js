import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { useTeamsContext } from '../hooks/useTeamsContext';

export default function ProfessionalHeader({ showBackButton = false, onBackClick, hideProfileAndSettings = false }) {
  const { data: session } = useSession();
  const { isTeams } = useTeamsContext();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [teamsUser, setTeamsUser] = useState(null);

  // Fetch Teams user session on mount (client-side)
  useEffect(() => {
    if (isTeams) {
      fetch('/api/user')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setTeamsUser(data.user);
          }
        })
        .catch(() => {
          setTeamsUser(null);
        });
    }
  }, [isTeams]);

  const user = session?.user || teamsUser;
  const isAuthenticated = !!(session || teamsUser);

  const handleSignOut = async () => {
    if (isTeams && teamsUser) {
      await fetch('/api/auth/teams-signout', { method: 'POST' });
      setTeamsUser(null);
      router.push('/signin');
    } else {
      signOut();
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="backdrop-blur-md bg-white/90 border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-4xl">🎮</div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Gamepad
              </h1>
            </div>
          </button>

          {/* Right side - User & Actions */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={onBackClick}
                className="text-sm border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </Button>
            )}

            {!hideProfileAndSettings && (
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.email || 'demo@example.com'}
                    </p>
                  </div>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name || 'Guest User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email || 'demo@example.com'}
                        </p>
                      </div>

                      <button
                        onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      {isAuthenticated ? (
                        <button
                          onClick={() => { handleSignOut(); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      ) : (
                        <button
                          onClick={() => { router.push('/signin'); setDropdownOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
