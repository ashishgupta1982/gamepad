import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import { useTeamsContext } from '../hooks/useTeamsContext';

export default function ProfessionalHeader({ showBackButton = false, onBackClick }) {
  const { data: session } = useSession();
  const { isTeams } = useTeamsContext();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('strategy-consulting');
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section with the highest intersection ratio
        let maxRatio = 0;
        let activeId = '';
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeId = entry.target.id;
          }
        });
        
        if (activeId) {
          setActiveSection(activeId);
        }
      },
      {
        threshold: [0.1, 0.3, 0.5, 0.7],
        rootMargin: '-100px 0px -40% 0px'
      }
    );

    // Add a small delay to ensure sections are rendered
    const timeoutId = setTimeout(() => {
      const sections = ['strategy-consulting', 'explore-apps'];
      sections.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      const sections = ['strategy-consulting', 'explore-apps'];
      sections.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

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
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-slate-900">
                Aspiro Consulting
              </h1>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
                  <button
                    onClick={() => scrollToSection('strategy-consulting')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeSection === 'strategy-consulting'
                        ? 'text-white bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Strategy Consulting
                  </button>
                  <button
                    onClick={() => scrollToSection('explore-apps')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeSection === 'explore-apps'
                        ? 'text-white bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    AI Solutions
                  </button>
          </div>

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

            {/* User Info and Profile Icon */}
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
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 py-4 border-t border-gray-200">
            <div className="space-y-2">
                    <button
                      onClick={() => scrollToSection('strategy-consulting')}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === 'strategy-consulting'
                          ? 'text-white bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Strategy Consulting
                    </button>
                    <button
                      onClick={() => scrollToSection('explore-apps')}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === 'explore-apps'
                          ? 'text-white bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      AI Solutions
                    </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
