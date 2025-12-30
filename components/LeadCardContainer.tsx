
import React, { useState } from 'react';
import { Lead, LeadStatus, LeadPriorityTag } from '../types';
import LeadCard from './LeadCard';

interface LeadCardContainerProps {
  leads: Lead[];
  onUpdateLead?: (lead: Lead) => void;
}

const LeadCardContainer: React.FC<LeadCardContainerProps> = ({ leads, onUpdateLead }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'outreach' | 'admin'>('insights');

  const updateStatus = (status: LeadStatus) => {
    if (!selectedLead || !onUpdateLead) return;
    const updated = { ...selectedLead, status };
    setSelectedLead(updated);
    onUpdateLead(updated);
  };

  const ScoreBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
        <span className="text-slate-500">{label}</span>
        <span className={color}>{value}/25</span>
      </div>
      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
        <div className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: `${(value/25)*100}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {leads.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/10">
          <p className="text-slate-500 font-bold">No leads found matching current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onAction={(l) => { setSelectedLead(l); setActiveTab('insights'); }} />
          ))}
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-20">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 transform -rotate-2">
                    <span className="text-white font-black text-2xl">{selectedLead.businessName.charAt(0)}</span>
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none">{selectedLead.businessName}</h3>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2">{selectedLead.category} • {selectedLead.city}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Navigation */}
            <div className="flex bg-slate-900/20 px-8 border-b border-slate-800">
               {['insights', 'outreach', 'admin'].map((t) => (
                 <button 
                  key={t} 
                  onClick={() => setActiveTab(t as any)} 
                  className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest relative ${activeTab === t ? 'text-blue-500' : 'text-slate-500'}`}
                 >
                   {t}
                   {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                 </button>
               ))}
            </div>

            <div className="flex-grow overflow-y-auto p-10">
              {activeTab === 'insights' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Score Breakdown</h4>
                         <div className="space-y-6 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800">
                            <ScoreBar label="No Booking Tech" value={selectedLead.scoreBreakdown?.noBookingSystem || 0} color="text-blue-400" />
                            <ScoreBar label="High Review Manual" value={selectedLead.scoreBreakdown?.highReviewManual || 0} color="text-red-400" />
                            <ScoreBar label="WhatsApp Dependency" value={selectedLead.scoreBreakdown?.whatsappDependency || 0} color="text-green-400" />
                            <ScoreBar label="Market Maturity" value={selectedLead.scoreBreakdown?.marketMaturity || 0} color="text-amber-400" />
                         </div>
                      </div>
                      <div className="bg-blue-600/5 p-8 rounded-[2rem] border border-blue-500/20">
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Strategic Fit</h4>
                         <p className="text-lg font-medium text-blue-100 leading-relaxed italic">"{selectedLead.whyNeedsRizqBook}"</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {selectedLead.topPainPoints.map((p, i) => (
                        <div key={i} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-4">
                           <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-500 font-black">{i+1}</span>
                           <span className="text-xs font-bold text-slate-300 leading-tight">{p}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'outreach' && (
                <div className="space-y-8">
                   <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/20">
                      <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 block">Power Opener (Cold Call)</label>
                      <p className="text-xl font-bold text-white leading-snug">"{selectedLead.outreachScripts.coldCallScript}"</p>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4 block">WhatsApp (Bangla)</label>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">{selectedLead.outreachScripts.whatsappBangla}</p>
                        <button onClick={() => { navigator.clipboard.writeText(selectedLead.outreachScripts.whatsappBangla); alert("Copied!"); }} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Copy Translation</button>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 block">WhatsApp (English)</label>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">{selectedLead.outreachScripts.whatsappEnglish}</p>
                        <button onClick={() => { navigator.clipboard.writeText(selectedLead.outreachScripts.whatsappEnglish); alert("Copied!"); }} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Copy Script</button>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-8">
                   <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Pipeline Lifecycle</h4>
                      <div className="flex flex-wrap gap-3">
                         {Object.values(LeadStatus).map((s) => (
                           <button 
                            key={s} 
                            onClick={() => updateStatus(s)} 
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLead.status === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                           >
                             {s}
                           </button>
                         ))}
                      </div>
                   </div>
                   <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-slate-300 min-h-[150px] outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Capture meeting notes, owner personality, or follow-up dates..."
                    value={selectedLead.notes}
                    onChange={(e) => onUpdateLead && onUpdateLead({ ...selectedLead, notes: e.target.value })}
                   />
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-900/80 border-t border-slate-800 flex gap-4">
               {selectedLead.whatsappNumber && (
                 <a 
                  href={`https://wa.me/${selectedLead.whatsappNumber.replace(/\D/g, '')}`} 
                  target="_blank" 
                  className="flex-grow py-5 bg-[#25D366] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-center shadow-xl shadow-green-900/20 hover:scale-[1.02] transition-all"
                 >
                   Launch WhatsApp Thread
                 </a>
               )}
               <button onClick={() => setSelectedLead(null)} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCardContainer;
