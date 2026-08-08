import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { api } from '../lib/api';
import { HeartPulse, Brain, Bone, Baby, Activity, Stethoscope, Users, BedDouble, CheckCircle2, ChevronRight, X, Calendar } from 'lucide-react';

interface DepartmentsPageProps {
  setActiveTab: (tab: string) => void;
  onSelectDepartment?: (deptName: string) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ setActiveTab, onSelectDepartment }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  useEffect(() => {
    api.getDepartments().then(setDepartments);
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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Specialized Care
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-4">
            Centres of Medical Excellence
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Shree Krishna Multispecialty Hospital houses 25+ dedicated medical departments led by renowned senior consultants, backed by cutting-edge robotic and diagnostic infrastructure.
          </p>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map((dept) => {
            const IconComp = getIcon(dept.icon_name);
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    <img
                      src={dept.image_url}
                      alt={dept.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4 p-3 rounded-2xl bg-white/95 text-emerald-700 shadow-lg backdrop-blur">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white font-medium">
                      <span className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full backdrop-blur">
                        <Users className="w-3.5 h-3.5 text-emerald-400" /> {dept.total_doctors} Specialists
                      </span>
                      <span className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full backdrop-blur">
                        <BedDouble className="w-3.5 h-3.5 text-emerald-400" /> {dept.beds_count} Dedicated Beds
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-extrabold text-slate-900 text-xl mb-2 group-hover:text-emerald-700 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                      {dept.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Department Head</span>
                      <span className="font-bold text-slate-800">{dept.lead_doctor}</span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">Key Equipment:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {dept.equipment_highlights.map((eq, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedDept(dept)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Department Info
                  </button>
                  <button
                    onClick={() => {
                      if (onSelectDepartment) onSelectDepartment(dept.name);
                      setActiveTab('booking');
                    }}
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book OPD
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Department Detail Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Department Details</span>
                <h2 className="text-2xl font-black text-slate-900">{selectedDept.name}</h2>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs text-slate-700">
              <p className="text-sm leading-relaxed text-slate-600">{selectedDept.description}</p>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <h4 className="font-bold text-emerald-900 text-xs mb-1">Department Leadership & Capacity</h4>
                <p className="font-semibold text-slate-800">{selectedDept.lead_doctor}</p>
                <p className="text-slate-600 text-[11px] mt-1">• {selectedDept.total_doctors} Senior Consultants • {selectedDept.beds_count} Beds Capacity</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-emerald-800">
                  Treatments & Procedures Offered
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDept.treatments.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 font-medium text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-emerald-800">
                  Common Conditions Treated
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDept.common_conditions.map((c, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDept(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onSelectDepartment) onSelectDepartment(selectedDept.name);
                  setSelectedDept(null);
                  setActiveTab('booking');
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Book Appointment in {selectedDept.name.split(' ')[0]}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
