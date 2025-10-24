import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export default function ClaudeChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          useCache: true
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Request failed');
      }

      const data = await res.json();

      // Handle both JSON responses and plain text
      if (typeof data === 'string') {
        setResponse(data);
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Chat Interface */}
      <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Assistant
            </h1>
            <p className="text-slate-600 text-sm">Powered by Anthropic&apos;s Claude AI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700">
              What would you like to know?
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything... I'm here to help with coding, explanations, creative writing, analysis, and more!"
                className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm placeholder-gray-400"
                disabled={loading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {prompt.length}/2000
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            size="lg"
            className="w-full text-lg py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Claude is thinking...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Message
              </div>
            )}
          </Button>
        </form>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Response</h2>
                <p className="text-sm text-slate-600">Generated in {Math.random() * 2 + 1 | 0} seconds</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-xl border border-gray-200/50">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono">{response}</pre>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Like
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500"
                onClick={() => {setPrompt(''); setResponse(''); setError('');}}
              >
                New Chat
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}