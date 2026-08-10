import React from 'react';

export interface FacilityBrochureItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

export const AvailableFacilitiesBrochure: React.FC = () => {
  const facilities: FacilityBrochureItem[] = [
    {
      id: 'f1',
      title: 'Orthopaedic surgeon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 14C22 18 28 22 28 28C28 34 20 40 20 50" />
          <path d="M38 14C38 18 32 22 32 28C32 34 40 40 40 50" />
          <circle cx="20" cy="14" r="5" />
          <circle cx="38" cy="14" r="5" />
          <circle cx="20" cy="50" r="5" />
          <circle cx="40" cy="50" r="5" />
          <path d="M48 30H58M53 25V35" stroke="#0284c7" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'f2',
      title: 'Obs & Gynae, infertility specialist',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 16C24 12 28 8 34 8C40 8 44 12 44 18C44 26 30 26 30 32C30 38 46 36 46 48C46 56 36 58 28 58C20 58 14 52 14 44" />
          <circle cx="34" cy="14" r="3" fill="currentColor" />
          <path d="M36 28C40 28 44 32 44 38C44 42 40 46 36 46" stroke="#0284c7" strokeWidth="2.5" />
        </svg>
      )
    },
    {
      id: 'f3',
      title: 'Urologist',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12C14 12 10 18 10 26C10 36 22 42 22 42V54" />
          <path d="M44 12C50 12 54 18 54 26C54 36 42 42 42 42V54" />
          <path d="M22 54H42" />
          <path d="M26 22C26 22 28 28 22 30" />
          <path d="M38 22C38 22 36 28 42 30" />
        </svg>
      )
    },
    {
      id: 'f4',
      title: '3D & 4D Sonography',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="12" width="30" height="24" rx="4" />
          <path d="M14 24Q23 16 32 24T50 24" stroke="#0284c7" />
          <path d="M23 36V48M14 48H32" />
          <path d="M44 16C48 16 52 20 52 26L48 38H40L36 26C36 20 40 16 44 16Z" fill="#0284c7" fillOpacity="0.1" />
          <path d="M44 38V52" />
        </svg>
      )
    },
    {
      id: 'f5',
      title: 'General & Laparoscopic surgeon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="18" r="8" />
          <path d="M18 42C18 34 24 30 32 30C40 30 46 34 46 42V52H18V42Z" />
          <path d="M44 24L56 12M52 12H56V16" stroke="#0284c7" strokeWidth="2.5" />
          <circle cx="48" cy="28" r="4" stroke="#0284c7" />
          <circle cx="56" cy="20" r="4" stroke="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f6',
      title: 'Plastic surgeon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12C20 12 24 6 32 6C40 6 44 12 44 12C50 22 48 38 44 48C40 54 32 58 32 58C32 58 24 54 20 48C16 38 14 22 20 12Z" />
          <path d="M24 24H28M36 24H40" />
          <path d="M28 38C30 40 34 40 36 38" stroke="#0284c7" />
          <path d="M20 20L14 18M44 20L50 18M20 32L14 32M44 32L50 32" strokeDasharray="2 2" stroke="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f7',
      title: 'Physiotherapist',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="38" width="44" height="8" rx="2" />
          <circle cx="20" cy="28" r="5" />
          <path d="M24 33L36 22L48 28L54 38" />
          <path d="M28 20L34 14" stroke="#0284c7" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'f8',
      title: 'Laparoscopy',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20C16 20 22 36 32 36C42 36 48 20 48 20" />
          <path d="M22 10L28 26M42 10L36 26" stroke="#0284c7" strokeWidth="3" />
          <path d="M32 36V52M26 44H38" stroke="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f9',
      title: 'General Physician',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="18" r="8" />
          <path d="M16 48C16 38 22 32 32 32C42 32 48 38 48 48" />
          <path d="M26 38V48C26 54 38 54 38 48V38" stroke="#0284c7" />
          <circle cx="32" cy="54" r="3" fill="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f10',
      title: 'Operation theatre',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 44H56M16 44V54M48 44V54" />
          <path d="M18 16L28 26M46 16L36 26" stroke="#0284c7" strokeWidth="3" />
          <path d="M24 26H40" stroke="#0284c7" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'f11',
      title: 'Neurosurgeon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 10C20 10 12 18 12 30C12 38 18 44 24 48C28 50 32 54 32 54C32 54 36 50 40 48C46 44 52 38 52 30C52 18 44 10 32 10Z" />
          <path d="M22 28C22 22 28 20 32 24C36 20 42 22 42 28C42 34 36 38 32 38C28 38 22 34 22 28Z" stroke="#0284c7" />
          <path d="M46 22H56M51 17V27" stroke="#0284c7" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'f12',
      title: 'Spine surgeon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="24" y="10" width="16" height="8" rx="2" />
          <rect x="22" y="22" width="20" height="8" rx="2" />
          <rect x="24" y="34" width="16" height="8" rx="2" />
          <rect x="22" y="46" width="20" height="8" rx="2" />
          <path d="M32 6V58" stroke="#0284c7" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      )
    },
    {
      id: 'f13',
      title: 'Pathology',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="20" r="10" stroke="#0284c7" />
          <path d="M31 27L46 42" stroke="#0284c7" strokeWidth="4" />
          <path d="M14 46C14 40 20 38 26 38" />
          <path d="M20 54H48" strokeWidth="3" />
          <circle cx="24" cy="20" r="3" fill="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f14',
      title: 'Labour room',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 42H56M14 42V54M50 42V54" />
          <path d="M14 34C14 26 22 22 30 22H42V42H14V34Z" />
          <circle cx="48" cy="24" r="5" fill="#0284c7" />
          <path d="M36 28C36 28 42 30 42 36" stroke="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f15',
      title: 'Surgical ICU',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="38" width="44" height="8" rx="2" />
          <path d="M12 38V52M44 38V52" />
          <path d="M14 32C14 26 20 24 28 24H38V38H14V32Z" />
          <path d="M52 12V48M46 18H58" stroke="#0284c7" strokeWidth="3" />
          <circle cx="52" cy="24" r="4" fill="#0284c7" />
        </svg>
      )
    },
    {
      id: 'f16',
      title: '24*7 DIGITAL XRAY',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="10" width="36" height="44" rx="4" />
          <path d="M22 20C22 20 26 28 26 34" stroke="#0284c7" />
          <path d="M42 20C42 20 38 28 38 34" stroke="#0284c7" />
          <path d="M22 40H42" stroke="#0284c7" strokeWidth="3" />
          <circle cx="32" cy="18" r="3" />
        </svg>
      )
    },
    {
      id: 'f17',
      title: '24*7 pharmacy',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20" stroke="#0284c7" />
          <path d="M18 18L46 46" stroke="#0284c7" strokeWidth="3" />
          <rect x="22" y="22" width="20" height="20" rx="4" transform="rotate(45 32 32)" />
        </svg>
      )
    },
    {
      id: 'f18',
      title: '24*7 emergency services',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 28C16 18 24 10 34 10C44 10 50 18 50 28V36C50 44 42 50 32 50" />
          <circle cx="32" cy="50" r="4" fill="#0284c7" />
          <path d="M8 28H18M48 28H58" stroke="#0284c7" strokeWidth="3" />
          <text x="20" y="32" fontSize="11" fontWeight="900" fill="#0284c7" stroke="none">24 HOUR</text>
        </svg>
      )
    },
    {
      id: 'f19',
      title: 'Cashless facilities',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 stroke-slate-800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="24" y="10" width="28" height="44" rx="4" />
          <path d="M32 16H44" />
          <path d="M12 36L20 28L28 36" stroke="#0284c7" strokeWidth="3" />
          <path d="M10 44H24" stroke="#0284c7" strokeWidth="3" />
          <text x="30" y="36" fontSize="8" fontWeight="900" fill="#0284c7" stroke="none">PAY</text>
        </svg>
      )
    }
  ];

  return (
    <div className="bg-amber-50/40 py-12 px-4 sm:px-8 border-y border-amber-200/60 my-10 rounded-3xl shadow-sm fade-up">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Pill Matching Brochure */}
        <div className="flex items-center justify-center gap-4 mb-10 fade-up">
          <div className="hidden sm:block h-0.5 w-24 bg-gradient-to-r from-transparent to-slate-800" />
          <div className="bg-slate-900 text-white px-8 py-2.5 rounded-full shadow-lg border border-slate-800 text-center">
            <h3 className="text-xl sm:text-2xl font-black tracking-wide font-sans">
              Available Facilities
            </h3>
          </div>
          <div className="hidden sm:block h-0.5 w-24 bg-gradient-to-l from-transparent to-slate-800" />
        </div>

        {/* 5-Column Grid with Distinct Teal Vertical Dividers (Exact Replica of Printed Brochure) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-2">
          {facilities.map((item, idx) => (
            <div
              key={item.id}
              style={{ animationDelay: `${(idx % 10) * 50}ms` }}
              className="flex flex-col items-center text-center px-3 relative group fade-up"
            >
              {/* Vertical Teal Divider Line on Right side (except last column on desktop) */}
              <div className="hidden lg:block absolute right-0 top-2 bottom-2 w-0.5 bg-teal-600/70" />

              {/* Icon Container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center p-2 rounded-2xl bg-white shadow-md border border-slate-200/80 group-hover:scale-105 group-hover:shadow-xl group-hover:border-teal-500 transition-all duration-300">
                {item.icon}
              </div>

              {/* Label */}
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug tracking-tight group-hover:text-teal-700 transition-colors">
                {item.title}
              </h4>
            </div>
          ))}
        </div>

        {/* Bottom Hospital Tag */}
        <div className="mt-12 text-center border-t border-slate-200 pt-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            24x7 Emergency Services • Cashless Mediclaim Facility • Silvassa, Dadra & Nagar Haveli
          </p>
        </div>

      </div>
    </div>
  );
};
