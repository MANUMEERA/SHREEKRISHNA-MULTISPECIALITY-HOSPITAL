import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { api } from '../../lib/api';
import { HeartPulse, Brain, Bone, Baby, Activity, Stethoscope, ArrowRight, BedDouble, Users } from 'lucide-react';

interface FeaturedDepartmentsProps {
  setActiveTab: (tab: string) => void;
  onSelectDepartment?: (deptName: string) => void;
}

export const FeaturedDepartments: React.FC<FeaturedDepartmentsProps> = ({ setActiveTab, onSelectDepartment }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = () => {
    setError(null);
    api.getDepartments().then(setDepartments).catch(err => {
      setError(err?.message || 'Failed to fetch departments from database');
    });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse': return HeartPulse;
      case 'Brain': return Brain;
      case 'Bone': return Bone;
      case 'Baby': return Baby;
      case 'Activity': return Activity;
      default: return Stethoscope;
    }
  };

  return (
    <section className="py-20 bg-slate-50 fade-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 fade-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              Specialized Care
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Centres of Clinical Excellence
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('departments')}
            className="px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            View All Departments <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.slice(0, 6).map((dept, idx) => {
            const IconComponent = getIcon(dept.icon_name);
            return (
              <div
                key={dept.id}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between fade-up"
              >
                <div>
                  {/* Department Banner Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={dept.image_url}
                      alt={dept.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/95 text-emerald-700 shadow-md backdrop-blur">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white font-medium">
                      <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur">
                        <Users className="w-3.5 h-3.5 text-emerald-400" /> {dept.total_doctors} Doctors
                      </span>
                      <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur">
                        <BedDouble className="w-3.5 h-3.5 text-emerald-400" /> {dept.beds_count} Beds
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {dept.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 mb-4">
                      <span className="font-semibold text-emerald-800">Chief Doctor:</span> {dept.lead_doctor}
                    </div>

                    {/* Equipment Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dept.equipment_highlights.slice(0, 2).map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-100">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => {
                      if (onSelectDepartment) onSelectDepartment(dept.name);
                      setActiveTab('booking');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Book Doctor in {dept.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
