import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { useTeamsContext } from '../hooks/useTeamsContext';

export default function Header({ showBackButton = false, onBackClick }) {
  const { data: session } = useSession();
  const { isTeams } = useTeamsContext();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [teamsUser, setTeamsUser] = useState(null);

  // Fetch Teams user session on mount (client-side)
  useEffect(() => {
    if (isTeams) {
      // Check if we have a Teams session by trying to fetch user data
      fetch('/api/user')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setTeamsUser(data.user);
          }
        })
        .catch(() => {
          // No Teams session
          setTeamsUser(null);
        });
    }
  }, [isTeams]);

  // Determine which user session to use
  const user = session?.user || teamsUser;
  const isAuthenticated = !!(session || teamsUser);

  const handleSignOut = async () => {
    if (isTeams && teamsUser) {
      // Sign out from Teams session
      await fetch('/api/auth/teams-signout', { method: 'POST' });
      setTeamsUser(null);
      router.push('/signin');
    } else {
      // Sign out from NextAuth session
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
    <nav className="backdrop-blur-sm bg-white/70 border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Aspiro Consulting
            </h1>
          </button>
          
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

            {/* User Info and Profile Icon */}
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name || 'User'}
                  </p>
                </div>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium transition-all duration-200 hover:shadow-lg"
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'Guest User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email || 'demo@example.com'}
                      </p>
                    </div>

                    <button
                      onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Settings
                    </button>
                    {isAuthenticated ? (
                      <button
                        onClick={() => { handleSignOut(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button
                        onClick={() => { router.push('/signin'); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}