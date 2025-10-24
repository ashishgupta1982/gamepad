import { Card } from '../ui/card';

export default function ExploreApps({ onTryChat, onViewProfile }) {
  return (
    <section id="explore-apps" className="pt-20 pb-12 px-6 bg-gradient-to-br from-white to-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Cutting-Edge AI Solutions
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Discover the innovative applications we've built across education, productivity, and lifestyle
          </p>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Explore Our Apps</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Vocabulary Builder */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">EdTech</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Vocabulary Builder</h3>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Interactive vocabulary learning platform for students with progress tracking and gamified learning experiences.
            </p>
            <div className="flex justify-end">
              <a 
                href="https://vocabulary.ashishgupta.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-semibold text-sm transition-colors group-hover:translate-x-1 transform duration-300"
              >
                Visit App →
              </a>
            </div>
          </Card>

          {/* Tutor App */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">EdTech</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Tutor App</h3>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Comprehensive tutoring platform for maths, creative writing, and comprehension with AI-powered assistance.
            </p>
            <div className="flex justify-end">
              <a 
                href="https://tutor.ashishgupta.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group-hover:translate-x-1 transform duration-300"
              >
                Visit App →
              </a>
            </div>
          </Card>

          {/* Timetable Organiser */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Productivity</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Timetable Organiser</h3>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Smart timetable creator for kids with desktop and mobile-friendly scheduling and organization tools.
            </p>
            <div className="flex justify-end">
              <a 
                href="https://timetable.ashishgupta.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors group-hover:translate-x-1 transform duration-300"
              >
                Visit App →
              </a>
            </div>
          </Card>

          {/* AI Tennis Coach */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Lifestyle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Tennis Coach</h3>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              AI-powered tennis coaching app providing personalized feedback based on photo analysis and technique assessment.
            </p>
            <div className="flex justify-end">
              <div className="text-orange-600 font-semibold text-sm">
                Coming Soon
              </div>
            </div>
          </Card>

          {/* Personalized AI Assistants */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">Productivity</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Personalized AI Assistants</h3>
            <p className="text-slate-600 leading-relaxed text-sm mb-4">
              Custom AI assistants tailored to your specific business needs and use cases.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onTryChat}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors group-hover:translate-x-1 transform duration-300"
              >
                Try Demo →
              </button>
            </div>
          </Card>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Interested in our Custom AI Solutions?
            </h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Ready to try any of these solutions? Contact us to discuss how we can help you get started.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={onViewProfile}
                className="bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black px-8 py-4 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Get in Touch
              </button>
              <button
                onClick={onViewProfile}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-8 py-4 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                See My Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
