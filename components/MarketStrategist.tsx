import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Lead, LeadAnalysis } from '../types';

interface MarketStrategistProps {
  leads: Lead[];
  analysis: LeadAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

const MarketStrategist: React.FC<MarketStrategistProps> = ({ leads, analysis, isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I am your RizqBook Market Strategist. I've analyzed your current scan results. How can I help you dominate this local market?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !analysis) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await geminiService.chatWithMarket(userMsg, leads, analysis);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Forgive me, my neural circuits are slightly overloaded. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const QuickAction = ({ label, prompt }: { label: string, prompt: string }) => (
    <button 
      onClick={() => { setInput(prompt); }}
      className="text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-700 transition-all"
    >
      {label}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#020617]/95 backdrop-blur-2xl border-l border-slate-800 z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/40">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Market Strategist</h3>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex flex-wrap gap-2">
          <QuickAction label="Summarize" prompt="Summarize the top 3 biggest opportunities in this dataset." />
          <QuickAction label="Risk Analysis" prompt="Identify leads that are at high risk of losing customers due to poor booking systems." />
          <QuickAction label="Campaign" prompt="Draft a 30-day marketing campaign for these leads." />
        </div>
        <div className="relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your strategist..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-purple-600 pr-12"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1.5 p-1.5 text-purple-500 hover:text-purple-400 disabled:text-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketStrategist;