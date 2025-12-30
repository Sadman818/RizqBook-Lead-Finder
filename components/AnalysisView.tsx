import React from 'react';
import { LeadAnalysis, LeadSearchResult } from '../types';

interface AnalysisViewProps {
  analysis: LeadAnalysis;
  sources?: { title: string; uri: string }[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, sources }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="space-y-12">
        <div className="flex items-start justify-between">
           <div>
              <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.25em] mb-6">Market Intel Dashboard</h4>
              <div className="flex items-center gap-16">
                <div>
                  <p className="text-6xl font-black text-white leading-none">{analysis.totalLeads}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase mt-3 tracking-widest">Opportunities</p>
                </div>
                <div className="w-px h-16 bg-slate-800"></div>
                <div>
                  <p className="text-6xl font-black text-red-500 leading-none">{analysis.hotLeadsCount}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase mt-3 tracking-widest">Hot Leads</p>
                </div>
              </div>
           </div>

           <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center relative group">
              <p className="text-2xl font-black text-blue-400 leading-none">{analysis.averagePainScore}%</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-1">Avg Pain</p>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-800" />
                 <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="251" strokeDashoffset={251 - (251 * (analysis.averagePainScore || 0) / 100)} className="text-blue-600" />
              </svg>
           </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Category Distribution</h4>
          <div className="space-y-4">
             {(Object.entries(analysis.categoryDistribution || {}) as [string, number][]).map(([cat, count]) => (
               <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{cat}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${(count / (analysis.totalLeads || 1)) * 100}%` }}
                    ></div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-blue-600 p-10 rounded-[3rem] shadow-2xl shadow-blue-900/40 transform -rotate-1">
          <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-6 border-b border-blue-400/30 pb-4">Global Conversion Strategy</h4>
          <p className="text-white text-2xl font-black leading-tight">
            "{analysis.suggestedOutreachStrategy}"
          </p>
          
          {sources && sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-400/30">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">Verified Sources (Maps)</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((src, i) => (
                  <a 
                    key={i} 
                    href={src.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                  >
                    {src.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4 text-blue-200 text-[10px] font-black uppercase tracking-widest">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-400"></div>)}
             </div>
             Active Scan Verified
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <p className="text-[9px] font-black text-slate-600 uppercase mb-2">Regional Insights</p>
              <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-3">"{analysis.marketInsights}"</p>
           </div>
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center flex flex-col justify-center">
              <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Target Persona</p>
              <p className="text-sm font-black text-white">Owner-Operator</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;