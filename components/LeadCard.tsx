import React from 'react';
import { Lead, LeadPriorityTag, LeadStatus } from '../types';

interface LeadCardProps {
  lead: Lead;
  onAction: (lead: Lead) => void;
  onStatusChange?: (id: string, status: LeadStatus) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onAction, onStatusChange }) => {
  const getTagStyle = (tag: LeadPriorityTag) => {
    switch (tag) {
      case LeadPriorityTag.HOT: return 'bg-red-600 text-white ring-red-900/30';
      case LeadPriorityTag.WARM: return 'bg-orange-600 text-white ring-orange-900/30';
      case LeadPriorityTag.COLD: return 'bg-slate-700 text-slate-300 ring-slate-900/30';
    }
  };

  const scoreColor = lead.leadScore >= 80 ? 'text-blue-400' : lead.leadScore >= 50 ? 'text-orange-400' : 'text-slate-500';

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] p-6 hover:border-blue-500/50 transition-all group flex flex-col shadow-2xl relative overflow-hidden h-full">
      {/* Background Glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] transition-opacity duration-700 ${lead.priorityTag === LeadPriorityTag.HOT ? 'bg-red-500/10' : 'bg-blue-500/5'}`}></div>

      <div className="flex justify-between items-start mb-6 z-10">
        <div className="flex flex-col gap-2 flex-grow pr-4">
           <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ring-4 ${getTagStyle(lead.priorityTag)}`}>
                {lead.priorityTag}
              </span>
              {lead.sourceUri && (
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Verified
                </span>
              )}
           </div>
           <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight line-clamp-2 mt-1">
            {lead.businessName}
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{lead.category}</p>
        </div>

        <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
           <div className="text-center">
              <p className={`text-lg font-black ${scoreColor}`}>{lead.leadScore}</p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Score</p>
           </div>
           <svg className="absolute inset-0 w-full h-full -rotate-90">
             <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
             <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="150" strokeDashoffset={150 - (150 * lead.leadScore / 100)} className={scoreColor} />
           </svg>
        </div>
      </div>

      <div className="space-y-4 flex-grow z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
             <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">Booking Detection</p>
             <p className="text-xs font-bold text-blue-100 flex items-center gap-1.5 truncate">
               {lead.isManualBooking ? (
                 <><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Manual</>
               ) : (
                 <><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {lead.bookingSystemName}</>
               )}
             </p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
             <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">Pain Score</p>
             <p className="text-xs font-bold text-white">{lead.bookingPainScore}/100</p>
          </div>
        </div>

        <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Primary Opportunity</p>
          <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-2">"{lead.whyNeedsRizqBook}"</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
           <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${lead.isClaimed ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
             <span className="text-[9px] font-bold text-slate-500 uppercase">{lead.isClaimed ? 'Claimed' : 'Unclaimed'}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase">{lead.totalReviews} Reviews</span>
           </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2 z-10">
        <button 
          onClick={() => onAction(lead)}
          className="flex-grow py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95"
          aria-label={`View full details for ${lead.businessName}`}
        >
          View Full Insight
        </button>
        {lead.sourceUri && (
           <a 
            href={lead.sourceUri}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-all"
            title="View on Google Maps"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
           </a>
        )}
        {lead.phoneNumber && (
           <a 
            href={`tel:${lead.phoneNumber}`}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-all"
            title="Call business"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
           </a>
        )}
      </div>
    </div>
  );
};

export default LeadCard;