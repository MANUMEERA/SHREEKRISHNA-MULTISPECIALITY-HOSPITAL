import React from 'react';
import { PhoneCall, Ambulance, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EmergencyBannerProps {
  setActiveTab: (tab: string) => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ setActiveTab }) => {
  return (
    <section className="py-12 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative overflow-hidden border-y border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" /> 24/7 Cardiac & Trauma Emergency Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Need Immediate Emergency Assistance or Ambulance?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 max-w-2xl">
            Our Level-1 Trauma team and cardiac catheterization lab are active 24/7 with zero waiting time.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="tel:+919876543210"
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2.5 transform hover:scale-105"
          >
            <PhoneCall className="w-5 h-5" /> Call Helpline: +91 98765 43210
          </a>

          <button
            onClick={() => setActiveTab('booking')}
            className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-emerald-400" /> Book Priority OPD
          </button>
        </div>

      </div>
    </section>
  );
};
