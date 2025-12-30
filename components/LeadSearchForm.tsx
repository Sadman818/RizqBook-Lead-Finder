import React, { useState } from 'react';
import { BusinessCategory } from '../types';

interface LeadSearchFormProps {
  onSearch: (city: string, radius: number, categories: string[]) => void;
  isLoading: boolean;
}

const LeadSearchForm: React.FC<LeadSearchFormProps> = ({ onSearch, isLoading }) => {
  const [city, setCity] = useState('Dhanmondi & Gulshan, Dhaka');
  const [radius, setRadius] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    BusinessCategory.SALON,
    BusinessCategory.CLINIC,
    BusinessCategory.GYM
  ]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || selectedCategories.length === 0) return;
    onSearch(city, radius, selectedCategories);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0f172a] rounded-[1.8rem] p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        <div className="lg:col-span-5">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
            Target Areas <span>Supports Batch (e.g. Area A, Area B)</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Uttara, Banani, Dhaka"
            className="w-full bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        
        <div className="lg:col-span-3">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
            Search Radius <span>{radius}km</span>
          </label>
          <div className="px-2 py-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center">
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        <div className="lg:col-span-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
              isLoading 
                ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Analyzing Market...
              </>
            ) : "Scan Opportunity Map"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Market Verticals</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.values(BusinessCategory).map((cat) => (
            <label 
              key={cat} 
              className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                selectedCategories.includes(cat) 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span className="text-[11px] font-bold uppercase tracking-tight">{cat}</span>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
};

export default LeadSearchForm;