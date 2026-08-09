import React, { useState, useEffect } from 'react';
import { Doctor } from '../../types';
import { api } from '../../lib/api';
import { Star, Calendar, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface TopDoctorsProps {
  setActiveTab: (tab: string) => void;
  onSelectDoctor?: (doc: Doctor) => void;
}

export const TopDoctors: React.FC<TopDoctorsProps> = ({ setActiveTab, onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState<'all' | 'resident' | 'on_call'>('all');

  useEffect(() => {
    api.getDoctors().then(setDoctors);
  }, []);

  const displayedDoctors = doctors.filter(doc => {
    if (filter === 'resident') return !doc.is_on_call;
    if (filter === 'on_call') return doc.is_on_call;
    return true;
  });

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              Expert Clinical Leadership
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Meet Our Consultants & Doctors On-Call
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({doctors.length})
              </button>
              <button
                onClick={() => setFilter('resident')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'resident'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resident ({doctors.filter(d => !d.is_on_call).length})
              </button>
              <button
                onClick={() => setFilter('on_call')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'on_call'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                On-Call ({doctors.filter(d => d.is_on_call).length})
              </button>
            </div>

            <button
              onClick={() => setActiveTab('doctors')}
              className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              All Doctors <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Avatar & Badges */}
                <div className="relative mb-4">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={doc.photo_url}
                      alt={doc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {doc.rating} <span className="text-[10px] text-slate-400">({doc.reviews_count})</span>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    {doc.is_on_call ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/95 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        Doctor On-Call
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600/95 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        Resident Doctor
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      {doc.department.split('&')[0]}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs ${
                      doc.availability_status === 'In OPD' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      doc.availability_status === 'In OT / Surgery' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      doc.availability_status === 'On Leave' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      doc.availability_status === 'Off Duty' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {doc.availability_status === 'In OPD' && '🔵 In OPD'}
                      {doc.availability_status === 'In OT / Surgery' && '🔴 In OT / Surgery'}
                      {doc.availability_status === 'On Leave' && '🟡 On Leave'}
                      {doc.availability_status === 'Off Duty' && '⚪ Off Duty'}
                      {(doc.availability_status === 'Available' || !doc.availability_status) && '🟢 Available'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                    {doc.specialization}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {doc.qualification} • <span className="font-semibold text-slate-700">{doc.experience_years} Yrs Exp</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Consultation Fee</span>
                    <span className="font-extrabold text-slate-900">₹{doc.consultation_fee}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Schedule</span>
                    <span className="font-semibold text-emerald-700 text-[11px] flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" /> {doc.opd_timings || 'Mon - Sat'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onSelectDoctor) onSelectDoctor(doc);
                  setActiveTab('booking');
                }}
                className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
