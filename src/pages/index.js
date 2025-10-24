import Head from 'next/head';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import ClaudeChat from '../components/ClaudeChat';
import SettingsPage from '../components/settings/SettingsPage';
import ProfessionalHeader from '../components/ProfessionalHeader';
import StrategyConsulting from '../components/sections/StrategyConsulting';
import AIChat from '../components/sections/AIChat';
import ExploreApps from '../components/sections/ExploreApps';
import ProfilePage from '../components/ProfilePage';

export default function Home() {
  const { data: session } = useSession();
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);


  if (showSettings) {
    return (
      <>
        <Head>
          <title>Settings - Aspiro Consulting</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <ProfessionalHeader showBackButton={true} onBackClick={() => setShowSettings(false)} />
          <div className="max-w-4xl mx-auto p-6">
            <SettingsPage
              session={session}
              isGuest={!session}
              onSignIn={() => signIn('google')}
              onSignOut={() => signOut()}
            />
          </div>
        </main>
      </>
    );
  }

  if (showProfile) {
    return (
      <>
        <Head>
          <title>Profile - Ashish Gupta | Aspiro Consulting</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <ProfessionalHeader showBackButton={true} onBackClick={() => setShowProfile(false)} />
          <ProfilePage />
        </main>
      </>
    );
  }

  if (showChat) {
    return (
      <>
        <Head>
          <title>AI Assistant - Aspiro Consulting</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <ProfessionalHeader showBackButton={true} onBackClick={() => setShowChat(false)} />
          <div className="max-w-4xl mx-auto p-6">
            <ClaudeChat />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Aspiro Consulting - Strategic Advisory & AI Solutions</title>
        <meta name="description" content="Professional strategy consulting services including product strategy, platform strategy, fundraising, M&A, and AI strategy. Expert board-level advisory for strategic decision making." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-white">
        <ProfessionalHeader />

        {/* Hero Section with Services */}
        <section id="strategy-consulting" className="pt-20 pb-12 px-6 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Strategy Consulting for Board Leadership
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Supporting boards and executives with comprehensive strategic consulting including fundraising, M&A, 
                product strategy, platform development, and cutting-edge AI strategy implementation.
              </p>
            </div>
            
            <StrategyConsulting onViewProfile={() => setShowProfile(true)} />
          </div>
        </section>

        {/* Explore Apps Section */}
        <ExploreApps onTryChat={() => setShowChat(true)} onViewProfile={() => setShowProfile(true)} />

        {/* Footer */}
        <footer className="py-16 px-6 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Aspiro Consulting</h3>
                    <p className="text-slate-400 text-sm">Strategic Advisory</p>
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed max-w-md">
                  Empowering organizations with strategic excellence through comprehensive consulting services 
                  and cutting-edge AI solutions for modern leadership challenges.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Consulting Services</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Board Advisory</li>
                  <li>Strategy Consulting</li>
                  <li>Product Strategy</li>
                  <li>Platform Strategy</li>
                  <li>Fundraising</li>
                  <li>M&A Advisory</li>
                  <li>AI Strategy</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">AI Solutions</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Educational Apps</li>
                  <li>Productivity Apps</li>
                  <li>Custom AI Apps</li>
                  <li>AI Chat Assistant</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 text-center">
              <p className="text-slate-400">
                © 2024 Aspiro Consulting. All rights reserved. Strategic Advisory & AI Solutions.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}