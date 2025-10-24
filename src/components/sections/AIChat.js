import { Button } from '../ui/button';
import { Card } from '../ui/card';

export default function AIChat({ onTryChat }) {
  return (
    <section id="ai-chat" className="py-12 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Personalized AI Assistants
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Creating personalized AI assistants that are tailored to your specific use case and business needs
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Features */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Custom AI Solutions</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Build AI assistants tailored to your specific industry, processes, and business requirements.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Industry-Specific Training</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Train AI models on your proprietary data, industry knowledge, and specific use cases for maximum relevance.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Seamless Integration</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Deploy AI assistants that integrate seamlessly with your existing systems and workflows.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right side - CTA */}
          <div className="text-center lg:text-left">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Build Your Custom AI Assistant
              </h3>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                Create AI assistants specifically designed for your business needs. From customer service to 
                internal operations, we build solutions that understand your unique requirements.
              </p>

              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={onTryChat}
                  className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Try Demo Assistant
                </Button>
                
                <p className="text-sm text-slate-500">
                  See how personalized AI can transform your business
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
