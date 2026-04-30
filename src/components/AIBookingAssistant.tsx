'use client';

import { useState } from 'react';

export default function AIBookingAssistant({ tenantId }: { tenantId: string }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/ai/booking-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          query,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Prepáčte, niečo sa pokazilo. Skúste to prosím znova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        <h2 className="text-xl font-semibold text-zinc-100">AI Booking Assistant</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Napr.: Aké služby ponúkate a kedy máte voľno tento piatok?"
          className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-gold focus:border-transparent outline-none transition-all resize-none h-32"
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full py-4 bg-gold text-black font-bold rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
          disabled={loading}
        >
          {loading ? 'AI premýšľa...' : 'Spýtať sa asistenta'}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-4 bg-zinc-800/50 border border-gold/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-bold text-gold mb-2 uppercase tracking-wider">Odpoveď asistenta:</p>
          <p className="text-zinc-300 leading-relaxed">{response}</p>
        </div>
      )}
    </div>
  );
}
