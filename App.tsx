
import React, { useState, useEffect, useMemo } from 'react';
import LeadSearchForm from './components/LeadSearchForm';
import LeadCardContainer from './components/LeadCardContainer';
import AnalysisView from './components/AnalysisView';
import BulkOutreach from './components/BulkOutreach';
import { geminiService } from './services/geminiService';
import { LeadSearchResult, Lead, LeadStatus, LeadPriorityTag, BusinessCategory } from './types';

// Define the AIStudio interface as expected by the environment to ensure type compatibility.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Property must use the named AIStudio interface and include the optionality modifier
    // to align with environmental declarations and avoid "identical modifiers" errors.
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [results, setResults] = useState<LeadSearchResult | null>(null);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'scan' | 'crm' | 'bulk'>('scan');
  const [displayMode, setDisplayMode] = useState<'grid' | 'map'>('grid');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Filters
  const [filterTag, setFilterTag] = useState<LeadPriorityTag | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<BusinessCategory | 'ALL'>('ALL');

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } catch (e) {
          console.error("Error checking API key status:", e);
        }
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('rizqbook_crm');
    if (stored) {
      try { setSavedLeads(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rizqbook_crm', JSON.stringify(savedLeads));
  }, [savedLeads]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true); // Assume success per race condition instructions
        setError(null);
      } catch (e) {
        console.error("Error opening key selector:", e);
      }
    }
  };

  const handleSearch = async (city: string, radius: number, categories: string[]) => {
    if (!hasApiKey && window.aistudio) {
      await handleSelectKey();
      // Even after selection, we proceed. If it still fails, the error handler will catch it.
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await geminiService.fetchLeads(city, radius, categories);
      setResults(data);
      setActiveView('scan');
      
      const merged = [...savedLeads];
      data.leads.forEach(l => {
        if (!merged.find(m => m.id === l.id)) merged.push(l);
      });
      setSavedLeads(merged);
    } catch (err: any) {
      const errMsg = err.message || "Search failed.";
      setError(errMsg);
      
      // Specifically handle the case where the key might be invalid or missing despite selection
      if (
        (errMsg.includes("Requested entity was not found") || 
         errMsg.includes("API Key must be set") || 
         errMsg.includes("API_KEY_INVALID")) && 
        window.aistudio
      ) {
        setHasApiKey(false);
        setError("API key issue detected. Please select a valid key from a paid GCP project.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const source = activeView === 'scan' ? (results?.leads || []) : savedLeads;
    return source.filter(l => {
      const tagMatch = filterTag === 'ALL' || l.priorityTag === filterTag;
      const catMatch = filterCategory === 'ALL' || l.category === filterCategory;
      return tagMatch && catMatch;
    });
  }, [activeView, results, savedLeads, filterTag, filterCategory]);

  const updateLead = (updated: Lead) => {
    setSavedLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    if (results) {
      setResults({ ...results, leads: results.leads.map(l => l.id === updated.id ? updated : l) });
    }
  };

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Business", "Category", "Phone", "Status", "Score", "City"];
    const rows = filteredLeads.map(l => [`"${l.businessName}"`, `"${l.category}"`, `"${l.phoneNumber || 'N/A'}"`, l.status, l.leadScore, `"${l.city}"`]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `rizqbook_leads_export.csv`;
    link.click();
  };

  // Best Time Widget Logic (Dhaka Time is UTC+6)
  const isOptimalTime = useMemo(() => {
    const dhakaHour = (new Date().getUTCHours() + 6) % 24;
    return dhakaHour >= 10 && dhakaHour <= 18;
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 transform rotate-2">
              <span className="text-white font-black text-xl">R</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">Sales Intel <span className="text-blue-500">v3</span></h1>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5">Elite Research Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {!hasApiKey && window.aistudio && (
              <div className="flex items-center gap-3">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  className="hidden md:block text-[9px] font-black uppercase text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Billing Docs
                </a>
                <button 
                  onClick={handleSelectKey}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse transition-all shadow-lg shadow-amber-900/20"
                >
                  Configure API Key
                </button>
              </div>
            )}
            <nav className="hidden lg:flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setActiveView('scan')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'scan' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Discovery</button>
              <button onClick={() => setActiveView('bulk')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'bulk' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Bulk Outreach</button>
              <button onClick={() => setActiveView('crm')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'crm' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>CRM ({savedLeads.length})</button>
            </nav>
            <div className="h-8 w-px bg-slate-800"></div>
            <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700">Export</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-12 pb-32">
        {/* Dynamic Timing Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between px-8 transition-all ${isOptimalTime ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
           <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isOptimalTime ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <p className="text-[10px] font-black uppercase tracking-widest">
                {isOptimalTime ? 'Market Hot: Optimal hours for outreach in Bangladesh' : 'After Hours: Best for research, avoid cold calls now'}
              </p>
           </div>
           <p className="text-[10px] font-black uppercase">Current BD Time: {((new Date().getUTCHours() + 6) % 24)}:00</p>
        </div>

        {activeView === 'scan' && (
          <div className="bg-[#0f172a] p-1 rounded-[2.5rem] border border-slate-800 shadow-2xl">
             <LeadSearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        )}

        {/* Filters & View Switcher */}
        {(results || activeView === 'crm') && activeView !== 'bulk' && (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              <select 
                value={filterTag} 
                onChange={(e) => setFilterTag(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-[10px] font-black uppercase text-slate-400 px-4 py-2 rounded-xl outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="HOT">HOT Only</option>
                <option value="WARM">WARM Only</option>
                <option value="COLD">COLD Only</option>
              </select>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-[10px] font-black uppercase text-slate-400 px-4 py-2 rounded-xl outline-none"
              >
                <option value="ALL">All Verticals</option>
                {Object.values(BusinessCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
               <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg transition-all ${displayMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-600'}`}>
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
               </button>
               <button onClick={() => setDisplayMode('map')} className={`p-2 rounded-lg transition-all ${displayMode === 'map' ? 'bg-slate-800 text-blue-400' : 'text-slate-600'}`}>
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
               </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-96 bg-slate-900 rounded-[2rem] border border-slate-800"></div>)}
          </div>
        ) : (
          <div className="space-y-16">
            {activeView === 'bulk' ? (
               <BulkOutreach leads={activeView === 'bulk' && results ? results.leads : savedLeads} />
            ) : displayMode === 'grid' ? (
              <>
                {activeView === 'scan' && results && <AnalysisView analysis={results.analysis} sources={results.sources} />}
                <LeadCardContainer leads={filteredLeads} onUpdateLead={updateLead} />
              </>
            ) : (
              <div className="relative h-[600px] bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                 <div className="relative z-10 text-center p-8">
                   <h3 className="text-2xl font-black text-white mb-4">Discovery Radar Layer</h3>
                   <p className="text-slate-500 text-sm max-w-sm mx-auto">Interactive opportunity mapping for {results?.leads.length || filteredLeads.length} leads in the target area.</p>
                   <div className="mt-8 flex flex-wrap justify-center gap-4">
                      {filteredLeads.slice(0, 15).map((l, i) => (
                        <div 
                          key={i} 
                          className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-[10px] cursor-pointer hover:scale-125 transition-all shadow-xl ${l.priorityTag === LeadPriorityTag.HOT ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                          title={l.businessName}
                          style={{ 
                            position: 'absolute', 
                            left: `${(l.longitude % 1) * 800 + 100}px`, 
                            top: `${(l.latitude % 1) * 400 + 100}px` 
                          }}
                        >
                          {l.businessName.charAt(0)}
                        </div>
                      ))}
                   </div>
                 </div>
                 <div className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   Bangladesh Opportunity Density Map
                 </div>
              </div>
            )}
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl z-[100] backdrop-blur-md max-w-lg text-center">
           <p className="text-xs font-black uppercase tracking-widest mb-1">System Notice</p>
           <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;