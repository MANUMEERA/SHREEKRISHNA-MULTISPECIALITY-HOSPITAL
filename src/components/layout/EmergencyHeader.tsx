import React from 'react';
import { Phone, Ambulance, ShieldCheck } from 'lucide-react';

export const EmergencyHeader: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        {/* Contact Hotline Info */}
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              <Phone className="w-3.5 h-3.5" /> Appointment & Emergency:
            </span>
            <a href="tel:+919099057219" className="hover:text-emerald-300 transition-colors font-bold text-white">+91 90990 57219</a>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-rose-300 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/80">
            <Ambulance className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> 24x7 Emergency Services | Silvassa
          </div>
          <div className="hidden lg:flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> NABH Accredited Hospital
          </div>
        </div>
      </div>
    </div>
  );
};
