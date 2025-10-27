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
        <section className="pt-20 pb-12 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                🎮 Gamepad
              </h1>
              <p className="text-2xl text-slate-700 font-medium">
                Fun Games for the Whole Family!
              </p>
            </div>

            {session ? (
              <p className="text-lg text-slate-600 mb-12">
                Welcome back, {session.user.name}! Your game progress is saved automatically.
              </p>
            ) : (
              <div className="mb-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto border border-purple-200">
                <p className="text-lg text-slate-700 mb-3">
                  👋 Sign in to save your game progress!
                </p>
                <p className="text-slate-600">
                  Play as a guest or sign in to keep your scores and resume games later.
                </p>
              </div>
            )}

            {/* Game Selection Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => game.available && handleGameClick(game.id)}
                  className={`
                    relative overflow-hidden rounded-3xl p-8
                    transform transition-all duration-300
                    ${game.available
                      ? 'cursor-pointer hover:scale-105 hover:shadow-2xl'
                      : 'opacity-60 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`}></div>

                  <div className="relative z-10 text-white">
                    <div className="text-6xl mb-4">{game.icon}</div>
                    <h3 className="text-2xl font-bold mb-3">{game.name}</h3>
                    <p className="text-white/90 leading-relaxed">
                      {game.description}
                    </p>

                    {game.available && (
                      <div className="mt-6">
                        <span className="inline-block bg-white text-purple-600 font-semibold px-6 py-2 rounded-full">
                          Play Now →
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
        <footer className="py-8 px-6 bg-slate-900 text-white mt-20">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-slate-400">
              © 2024 Gamepad. Have fun playing! 🎉
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
