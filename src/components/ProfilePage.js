import { Card } from './ui/card';
import { Button } from './ui/button';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-white font-bold text-4xl">AG</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Ashish Gupta</h1>
          <p className="text-xl text-slate-600 mb-4">Consultant | AI & Tech Strategy | Investor | Former Managing Director at UBS</p>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Senior executive with over 20 years of experience in financial services and technology transformation. 
            Expert in board-level advisory services covering derivatives trading, platform strategy, and business transformation across multiple asset classes.
          </p>
        </div>

        {/* Contact Information */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-0">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-700">ashish@ashishgupta.co.uk</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-700">London, England, United Kingdom</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <span className="text-slate-700">linkedin.com/in/ashishguptame</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-slate-700">aspiro-consulting.com</span>
            </div>
          </div>
        </Card>

        {/* Professional Summary */}
        <Card className="p-6 border-0 bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Professional Summary</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Senior executive with over 20 years of experience in financial services and technology transformation. 
            Track record of scaling global platforms and leading global trading businesses and digital transformation 
            initiatives at UBS. Combines traditional banking expertise with innovative technologies including AI, DeFi, and Confidential Computing.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Active startup investor and board advisor with a focus on transforming financial services through technology innovation. 
            Expert in board-level advisory services covering derivatives trading, platform strategy, and business transformation across multiple asset classes.
          </p>
        </Card>

        {/* Core Competencies */}
        <Card className="p-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Core Competencies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Management & Strategy</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Management Consulting</li>
                <li>• Business transformation</li>
                <li>• Platform scaling & growth</li>
                <li>• Board-level advisory</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Investment & Advisory</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Startup investment</li>
                <li>• Board advisory services</li>
                <li>• Fundraising & M&A</li>
                <li>• Strategic partnerships</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Technology & AI</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Artificial Intelligence (AI)</li>
                <li>• Digital platform strategy</li>
                <li>• API-first architecture</li>
                <li>• Blockchain & DeFi</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Trading & Derivatives</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Cross-asset derivatives trading</li>
                <li>• Structured products & solutions</li>
                <li>• Commodities & AMC trading</li>
                <li>• Risk management & hedging</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Experience Highlights */}
        <Card className="p-6 border-0 bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Key Achievements</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-slate-800">Aspiro Consulting</h3>
              <p className="text-slate-600 text-sm mb-2">Founder & Strategy Consultant (Aug 2024 - Present)</p>
              <p className="text-slate-700">
                Board-level advisor specializing in AI strategy, business transformation, and technology-driven growth across enterprises, 
                fintechs, and government bodies. Focus on business transformation, fundraising, acquisitions, product innovation, and scalable AI adoption.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-slate-800">UBS Digital Transformation</h3>
              <p className="text-slate-600 text-sm mb-2">21 years at UBS, Managing Director</p>
              <p className="text-slate-700">
                Led global digital platforms for derivatives, managing cross-asset product teams and 500-person technology division. 
                Successfully reorganized teams including Credit Suisse integration, resulting in 250% growth in client AUM on electronic channels and 60% reduction in time to market for new products.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-slate-800">Trading Excellence</h3>
              <p className="text-slate-600 text-sm mb-2">Global Head of AMC Trading & Commodities</p>
              <p className="text-slate-700">
                Grew AMC trading business AUM by 300% over 4 years and transformed platform into globally recognized solution. 
                Managed global commodities franchise trading index products, structured products, and vanilla options, growing Commodity ETC and ETF AUM into one of the largest globally.
              </p>
            </div>
          </div>
        </Card>

        {/* Education & Certifications */}
        <Card className="p-6 border-0 bg-gradient-to-br from-slate-50 to-gray-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Education & Certifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Education</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-700">MEng, Engineering, Economics and Management</p>
                  <p className="text-slate-600 text-sm">University of Oxford, Keble College (2000-2004)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Eton College</p>
                  <p className="text-slate-600 text-sm">(1995-2000)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Diploma in Law</p>
                  <p className="text-slate-600 text-sm">BPP Law School (2007-2009)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">M&A Course</p>
                  <p className="text-slate-600 text-sm">London Business School</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Certifications</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-700">Oxford Blockchain Strategy Programme</p>
                  <p className="text-slate-600 text-sm">Saïd Business School, University of Oxford (2019)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Data Analyst Level 4, Data Science</p>
                  <p className="text-slate-600 text-sm">BCS, The Chartered Institute for IT (2019-2021)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">How to Use Generative AI: Building an AI-First Mindset</p>
                  <p className="text-slate-600 text-sm">Professional Certification</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Strategy?</h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Let's discuss how I can help your organization achieve its strategic objectives 
              and drive sustainable growth through innovative consulting solutions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 font-medium"
              >
                Schedule Consultation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-3 font-medium"
              >
                Download CV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
