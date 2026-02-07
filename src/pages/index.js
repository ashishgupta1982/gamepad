import Head from 'next/head';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '../components/ProfessionalHeader';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const games = [
    {
      id: 'scrabble-scorer',
      name: 'Scrabble Scorer',
      description: 'Track scores for up to 4 players with fun awards and achievements!',
      icon: '🎲',
      color: 'from-purple-500 to-pink-500',
      available: true
    },
    {
      id: 'quiz',
      name: 'Quiz Game',
      description: 'Test your knowledge with customizable categories and questions!',
      icon: '🧠',
      color: 'from-blue-500 to-indigo-500',
      available: true
    },
    {
      id: 'coming-soon-1',
      name: 'More Games Coming Soon!',
      description: 'Check back later for more exciting games',
      icon: '🎮',
      color: 'from-gray-400 to-gray-500',
      available: false
    }
  ];

  const handleGameClick = (gameId) => {
    if (gameId === 'scrabble-scorer') {
      router.push('/games/scrabble-scorer');
    } else if (gameId === 'quiz') {
      router.push('/games/quiz');
    }
  };

  return (
    <>
      <Head>
        <title>Gamepad - Fun Games for the Family</title>
        <meta name="description" content="Play fun games with family and friends. Track scores, compete, and have fun!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <ProfessionalHeader />

        {/* Hero Section */}
        <section className="pt-16 pb-6 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Fun Games for the Family
            </h1>
            <p className="text-base text-slate-500 font-medium">
              Pick a game and start playing!
            </p>

            {session ? (
              <p className="text-sm text-slate-500 mt-3">
                Welcome back, {session.user.name}!
              </p>
            ) : (
              <div className="mt-4 mb-2 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl max-w-md mx-auto border border-purple-100 flex items-center gap-2">
                <span className="text-sm">👋</span>
                <p className="text-sm text-slate-600">
                  Sign in to save progress, or play as guest.
                </p>
              </div>
            )}

            {/* Game Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto mt-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => game.available && handleGameClick(game.id)}
                  className={`
                    relative overflow-hidden rounded-xl p-4 md:p-5
                    transform transition-all duration-200
                    ${game.available
                      ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]'
                      : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`}></div>

                  <div className="relative z-10 text-white text-center">
                    <div className="text-3xl md:text-4xl mb-2">{game.icon}</div>
                    <h3 className="text-sm md:text-base font-bold mb-1">{game.name}</h3>
                    <p className="text-white/80 text-xs leading-snug hidden md:block">
                      {game.description}
                    </p>

                    {game.available && (
                      <div className="mt-3">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white font-semibold text-xs px-3 py-1.5 rounded-full border border-white/30">
                          Play Now
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-4 px-4 bg-slate-900 text-white mt-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-slate-400">
              &copy; 2024 Gamepad
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
