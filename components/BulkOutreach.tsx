import React from 'react';
import { Lead, LeadPriorityTag } from '../types';

interface BulkOutreachProps {
  leads: Lead[];
}

const BulkOutreach: React.FC<BulkOutreachProps> = ({ leads }) => {
  const hotLeads = leads.filter(l => l.priorityTag === LeadPriorityTag.HOT);

  if (hotLeads.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
        <p className="text-slate-500 font-bold">No "HOT" leads available for bulk outreach. Run a scan first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Rapid Response Console</h2>
          <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-2">Prioritizing {hotLeads.length} Hot Opportunities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {hotLeads.map((lead) => (
          <div key={lead.id} className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 flex flex-col lg:flex-row gap-8 items-center group hover:border-red-500/30 transition-all">
            <div className="lg:w-1/4">
              <span className="text-[9px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-1 rounded mb-2 inline-block">HOT LEAD</span>
              <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{lead.businessName}</h3>
              <p className="text-xs text-slate-500 mt-1">{lead.category} • {lead.city}</p>
              <div className="mt-4 flex items-center gap-2">
                 <span className="text-lg font-black text-white">{lead.leadScore}</span>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Score</span>
              </div>
            </div>

            <div className="lg:w-2/4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 relative">
               <div className="absolute top-4 right-4 text-[8px] font-black text-slate-600 uppercase">Personalized Script</div>
               <p className="text-slate-300 text-sm leading-relaxed italic">"{lead.outreachScripts.whatsappBangla}"</p>
            </div>

            <div className="lg:w-1/4 flex flex-col gap-3 w-full">
               <a 
                 href={`https://wa.me/${lead.whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(lead.outreachScripts.whatsappBangla)}`}
                 target="_blank"
                 className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-green-900/20 transition-all"
               >
                 Open WhatsApp
               </a>
               <button 
                 onClick={() => { navigator.clipboard.writeText(lead.outreachScripts.whatsappBangla); alert("Copied!"); }}
                 className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
               >
                 Copy Script
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkOutreach;