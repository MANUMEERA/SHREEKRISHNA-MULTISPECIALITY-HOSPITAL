import React from 'react';
import { Calendar, PhoneCall, Stethoscope, FileUp, ArrowRight } from 'lucide-react';

interface QuickActionCardsProps {
  setActiveTab: (tab: string) => void;
}

export const QuickActionCards: React.FC<QuickActionCardsProps> = ({ setActiveTab }) => {
  const actions = [
    {
      id: 'booking',
      title: 'Book Appointment',
      desc: 'Select preferred doctor, date & time slot for zero-wait OPD consultation.',
      icon: Calendar,
      bg: 'bg-emerald-600',
      text: 'text-emerald-700',
      border: 'hover:border-emerald-500'
    },
    {
      id: 'emergency',
      title: '24x7 Emergency & Ambulance',
      desc: 'Instant dispatch cardiac ambulance & Level-1 trauma response team.',
      icon: PhoneCall,
      bg: 'bg-rose-600',
      text: 'text-rose-700',
      border: 'hover:border-rose-500',
      isEmergency: true
    },
    {
      id: 'doctors',
      title: 'Specialist Doctors',
      desc: 'Browse profiles, qualifications, and patient reviews of 85+ senior consultants.',
      icon: Stethoscope,
      bg: 'bg-teal-600',
      text: 'text-teal-700',
      border: 'hover:border-teal-500'
    },
    {
      id: 'dashboard',
      title: 'Patient Portal & Reports',
      desc: 'Upload lab reports, view doctor notes, and track appointment history.',
      icon: FileUp,
      bg: 'bg-slate-800',
      text: 'text-slate-800',
      border: 'hover:border-slate-500'
    }
  ];

  return (
    <div className="relative -mt-10 z-20 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              onClick={() => {
                if (act.isEmergency) {
                  window.location.href = 'tel:+919876543210';
                } else {
                  setActiveTab(act.id);
                }
              }}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xl hover:shadow-2xl transition-all cursor-pointer group ${act.border} transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${act.bg} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                {act.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {act.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
