import React, { useState, useEffect } from 'react';
import { Doctor, Department } from '../types';
import { api } from '../lib/api';
import { Search, Filter, Star, Clock, Calendar, Phone, Mail, Award, CheckCircle2, X } from 'lucide-react';

interface DoctorsPageProps {
  setActiveTab: (tab: string) => void;
  onSelectDoctor: (doc: Doctor) => void;
  initialSearchQuery?: string;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({ setActiveTab, onSelectDoctor, initialSearchQuery = '' }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'resident' | 'on_call'>('all');
  const [selectedDocForModal, setSelectedDocForModal] = useState<Doctor | null>(null);

  useEffect(() => {
    api.getDoctors().then(setDoctors);
    api.getDepartments().then(setDepartments);
  }, []);

  const departmentsList = ['all', ...Array.from(new Set([
    ...departments.map(d => d.name),
    ...doctors.map(d => d.department)
  ]))];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.department.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'all' || doc.department === selectedDept;

    const matchesType = 
      typeFilter === 'all' ||
      (typeFilter === 'resident' && !doc.is_on_call) ||
      (typeFilter === 'on_call' && doc.is_on_call);

    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Clinical Team
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3 mb-3">
            Find & Book Specialist Doctors
          </h1>
          <p className="text-sm text-slate-600">
            Select from 85+ highly skilled MD, DM, and M.Ch senior consultants across 25 multispecialty departments.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm mb-10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by Doctor Name, Specialty, or Treatment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Department Dropdown */}
            <div className="md:col-span-5 relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 appearance-none bg-white font-medium text-slate-700"
              >
                <option value="all">All Specialties ({doctors.length} Doctors)</option>
                {departmentsList.filter(d => d !== 'all').map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Category Tabs */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 mr-2 flex-shrink-0">Category:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Doctors ({doctors.length})
            </button>
            <button
              onClick={() => setTypeFilter('resident')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                typeFilter === 'resident'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Resident Consultants ({doctors.filter(d => !d.is_on_call).length})
            </button>
            <button
              onClick={() => setTypeFilter('on_call')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                typeFilter === 'on_call'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Doctors On-Call ({doctors.filter(d => d.is_on_call).length})
            </button>
          </div>
        </div>

        {/* Doctor Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-sm">
              No doctors found matching your search criteria.
            </div>
          ) : (
            filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <img
                        src={doc.photo_url}
                        alt={doc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          {doc.department.split('&')[0]}
                        </span>
                        {doc.is_on_call ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[9px] uppercase tracking-wider">
                            On-Call
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider">
                            Resident
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          doc.availability_status === 'In OPD' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          doc.availability_status === 'In OT / Surgery' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          doc.availability_status === 'On Leave' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          doc.availability_status === 'Off Duty' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {doc.availability_status === 'In OPD' && '🔵 In OPD'}
                          {doc.availability_status === 'In OT / Surgery' && '🔴 In OT'}
                          {doc.availability_status === 'On Leave' && '🟡 Leave'}
                          {doc.availability_status === 'Off Duty' && '⚪ Off Duty'}
                          {(doc.availability_status === 'Available' || !doc.availability_status) && '🟢 Available'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-1">
                        {doc.specialization}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-800">{doc.rating}</span>
                        <span>({doc.reviews_count} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {doc.bio}
                  </p>

                  <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 text-[11px]">Qualification:</span>
                      <span className="font-semibold text-[11px] truncate max-w-[180px]">{doc.qualification}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 text-[11px]">Schedule:</span>
                      <span className="font-bold text-emerald-800 text-[11px]">{doc.opd_timings || 'Mon - Sat'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 text-[11px]">OPD Fee:</span>
                      <span className="font-extrabold text-slate-900 text-xs">₹{doc.consultation_fee}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDocForModal(doc)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      onSelectDoctor(doc);
                      setActiveTab('booking');
                    }}
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book Consultation
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Doctor Full Profile Modal */}
      {selectedDocForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedDocForModal.photo_url}
                  alt={selectedDocForModal.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{selectedDocForModal.department}</span>
                    {selectedDocForModal.is_on_call ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[9px] uppercase tracking-wider">
                        Doctor On-Call
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase tracking-wider">
                        Resident
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{selectedDocForModal.name}</h2>
                  <p className="text-xs text-slate-600 font-medium">{selectedDocForModal.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wider text-emerald-800">Biography</h4>
                <p className="text-slate-600 leading-relaxed text-xs">{selectedDocForModal.bio}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Qualification</span>
                  <span className="font-bold text-slate-800">{selectedDocForModal.qualification}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">OPD Schedule</span>
                  <span className="font-extrabold text-emerald-800 text-xs">{selectedDocForModal.opd_timings || 'Mon - Sat (Sunday-Only Emergency)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">OPD Consultation Fee</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{selectedDocForModal.consultation_fee}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Rating</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {selectedDocForModal.rating} / 5.0
                  </span>
                </div>
              </div>

              {selectedDocForModal.education && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-emerald-800">Education & Training</h4>
                  <ul className="space-y-1 text-slate-700">
                    {selectedDocForModal.education.map((edu, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider text-emerald-800">Weekly Availability Days</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocForModal.availability_days.map((day, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectDoctor(selectedDocForModal);
                  setSelectedDocForModal(null);
                  setActiveTab('booking');
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Book Appointment
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
