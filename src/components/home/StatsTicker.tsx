import React from 'react';
import { Users, Stethoscope, Building2, Smile, Award } from 'lucide-react';

export const StatsTicker: React.FC = () => {
  const stats = [
    { label: 'Happy Patients Treated', value: '50,000+', icon: Users, desc: 'Across India & Abroad' },
    { label: 'Senior Specialists', value: '85+', icon: Stethoscope, desc: 'MD, DM, M.Ch Doctors' },
    { label: 'Medical Specialties', value: '25+', icon: Building2, desc: 'Multispecialty Centers' },
    { label: 'Patient Satisfaction Rate', value: '99.4%', icon: Smile, desc: 'Verified Feedback' }
  ];

  return (
    <section className="py-12 bg-emerald-950 text-white border-y border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-800 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-0.5">
                    {s.value}
                  </div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-0.5">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
