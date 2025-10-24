import { Card } from '../ui/card';
import { Button } from '../ui/button';

export default function StrategyConsulting({ onViewProfile }) {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Board Advisory */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Board Advisory</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Strategic board-level advisory services providing independent guidance on critical business decisions.
            </p>
          </Card>

          {/* Fundraising Strategy */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Fundraising Strategy</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Strategic capital raising guidance, investor relations, and financial planning for growth objectives.
            </p>
          </Card>

          {/* M&A Strategy */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">M&A Strategy</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Strategic merger and acquisition planning, due diligence, and integration strategies for corporate transactions.
            </p>
          </Card>

          {/* Product Strategy */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Product Strategy</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Comprehensive product roadmap development, market positioning, and go-to-market strategies.
            </p>
          </Card>

          {/* Platform Strategy */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Platform Strategy</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Strategic platform architecture and ecosystem development for scalable, integrated solutions.
            </p>
          </Card>

          {/* AI Strategy */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Strategy</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Specialized AI strategy consulting to help organizations harness AI's transformative potential.
            </p>
          </Card>
        </div>

        {/* Call to Action - Integrated */}
        <div className="mt-16">
          <div className="text-center">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 border-2 border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Transform Your Strategy?</h3>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                Let's discuss how our strategic consulting services can help your organization achieve its goals.
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
    </>
  );
}
