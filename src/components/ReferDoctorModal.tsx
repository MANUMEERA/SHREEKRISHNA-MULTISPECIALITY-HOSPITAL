import React, { useState } from 'react';
import { Appointment, Doctor } from '../types';
import { X, Send, UserCheck, Stethoscope, AlertTriangle, Building2, HeartPulse } from 'lucide-react';

interface ReferDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  currentDoctor: Doctor | null;
  doctors: Doctor[];
  onSendReferral: (targetDoctor: Doctor, reason: string, urgency: string, notes: string) => Promise<void>;
}

export const ReferDoctorModal: React.FC<ReferDoctorModalProps> = ({
  isOpen,
  onClose,
  appointment,
  currentDoctor,
  doctors,
  onSendReferral
}) => {
  if (!isOpen || !appointment) return null;

  // Exclude current attending doctor
  const availableDoctors = doctors.filter(d => d.id !== currentDoctor?.id);

  const [selectedDocId, setSelectedDocId] = useState<string>(availableDoctors[0]?.id || '');
  const [reason, setReason] = useState<string>('Specialized Clinical Evaluation & Expert Opinion Required');
  const [urgency, setUrgency] = useState<string>('Urgent Consultation');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedTargetDoctor = doctors.find(d => d.id === selectedDocId) || availableDoctors[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetDoctor) return;
    setIsSubmitting(true);
    try {
      await onSendReferral(selectedTargetDoctor, reason, urgency, notes);
      onClose();
    } catch (err) {
      console.error('Failed to send referral:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">
              <Stethoscope className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>↪️ Refer Patient to Doctor</span>
              </h3>
              <p className="text-xs text-emerald-300/90 font-medium">
                Transfer / Request specialist consultation for {appointment.user_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
            title="Close Referral Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Patient Card Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name & Code</span>
              <span className="font-extrabold text-slate-900 text-sm">{appointment.user_name}</span>
              <span className="ml-2 font-mono text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {appointment.patient_code || 'SKMH-OPD'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Attending</span>
              <span className="font-extrabold text-teal-800">Dr. {currentDoctor?.name}</span>
            </div>
          </div>

          {/* Target Doctor Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Select Specialist Doctor to Refer To *
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full p-3 rounded-2xl border-2 border-emerald-600/60 bg-emerald-50/30 text-slate-900 text-xs font-extrabold focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
              required
            >
              {availableDoctors.map(doc => (
                <option key={doc.id} value={doc.id} className="py-1">
                  Dr. {doc.name} — {doc.department} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Doctor Summary Card */}
          {selectedTargetDoctor && (
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center gap-3">
              <img
                src={selectedTargetDoctor.photo_url}
                alt={selectedTargetDoctor.name}
                className="w-12 h-12 rounded-xl object-cover border border-teal-300 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-teal-950 text-sm">Dr. {selectedTargetDoctor.name}</div>
                <div className="text-[11px] text-teal-800 font-semibold">{selectedTargetDoctor.specialization} • {selectedTargetDoctor.department}</div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-emerald-600" /> Status: {selectedTargetDoctor.availability_status || 'Available'}
                </div>
              </div>
            </div>
          )}

          {/* Clinical Reason for Referral */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Clinical Reason for Referral *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Requires expert Orthopedic Joint evaluation, MRI review & surgical opinion..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Urgency Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Referral Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="Routine Consultation">Routine Consultation</option>
                <option value="Urgent Consultation">⚡ Urgent Consultation</option>
                <option value="Emergency ICU / OT Transfer">🚨 Emergency ICU / OT Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Specialty Department
              </label>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{selectedTargetDoctor?.department || 'General OPD'}</span>
              </div>
            </div>
          </div>

          {/* Confidential Doctor Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Additional Clinical Notes for Dr. {selectedTargetDoctor?.name || 'Doctor'} (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Patient has severe knee pain, Vitals stable, X-Ray attached."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Submitting this referral will instantly trigger a <strong>Live Notification</strong> in Dr. {selectedTargetDoctor?.name}'s Doctor Panel and update the <strong>Receptionist OPD Queue</strong>.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedTargetDoctor}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending Referral...' : 'Send Referral & Notify Doctor'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
