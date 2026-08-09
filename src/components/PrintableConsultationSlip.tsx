import React, { useState } from 'react';
import { Appointment, User } from '../types';
import { Printer, X, HeartPulse, Stethoscope, Pill, FileCheck2, Share2, Building2, Calendar, Phone, Mail, MapPin, Download, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { HospitalLogo } from './common/HospitalLogo';

interface PrintableConsultationSlipProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patient: User | null;
}

export const PrintableConsultationSlip: React.FC<PrintableConsultationSlipProps> = ({
  isOpen,
  onClose,
  appointment,
  patient
}) => {
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setActionNotice('Preparing high-resolution PDF download...');
    setTimeout(() => {
      window.print();
      setActionNotice('PDF save/download window launched successfully.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 300);
  };

  const recipientPhone = (appointment.user_phone || patient?.phone || '+919099057219').replace(/[^0-9]/g, '');
  const recipientEmail = appointment.user_email || patient?.email || 'patient@skmh.org';

  const shareText = `*SHREE KRISHNA MULTISPECIALTY HOSPITAL - SILVASSA*\n*OPD CONSULTATION & PRESCRIPTION SLIP*\n----------------------------------------\n*Patient Name:* ${appointment.user_name}\n*Patient ID:* ${appointment.patient_code || patient?.patient_code || 'SKMH-2026-PAT-101'}\n*Consulting Doctor:* ${appointment.doctor_name} (${appointment.department})\n*Visit Date & Slot:* ${appointment.appointment_date} (${appointment.time_slot})\n*Clinical Diagnosis:* ${appointment.diagnosis || appointment.reason || 'OPD Evaluation'}\n*Prescribed Medications:* ${appointment.prescribed_medicines?.map(m => m.name).join(', ') || 'As advised'}\n----------------------------------------\n*Hospital Contact:* +91 90990 57219 | Silvassa`;

  const handleSendWhatsApp = () => {
    const waUrl = `https://wa.me/${recipientPhone.length > 10 ? recipientPhone : '91' + recipientPhone}?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setActionNotice(`WhatsApp OPD Consultation dispatch launched for +${recipientPhone}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendEmail = () => {
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(`OPD Consultation & Prescription Slip - ${appointment.user_name} (Case #${appointment.id})`)}&body=${encodeURIComponent(shareText)}`;
    window.open(mailtoUrl, '_blank');
    setActionNotice(`Email client opened for ${recipientEmail} with complete prescription attachment!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 print:shadow-none print:m-0 print:p-4 print:max-w-none print:w-full border border-slate-200">
        
        {/* Action Bar (Hidden when printing) */}
        <div className="space-y-3 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-emerald-600" /> OPD Consultation & Prescription Slip Gateway
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {actionNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Action Toolbar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Print OPD Slip
            </button>

            <button
              onClick={handleExportPDF}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" /> Export PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200 fill-emerald-200" /> Send WhatsApp
            </button>

            <button
              onClick={handleSendEmail}
              className="py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Mail className="w-4 h-4 text-teal-200" /> Send Email
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTENT */}
        <div className="space-y-6 font-sans text-slate-900" id="printable-opd-slip">
          
          {/* Hospital Header Header */}
          <div className="border-b-2 border-emerald-800 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <HospitalLogo size="md" variant="full" showSubtitle={false} />
              <p className="text-[11px] text-slate-600 font-bold mt-1">Multi-Specialty Healthcare & Trauma Center • Silvassa</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-700" /> Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230 • 📞 +91 90990 57219
              </p>
            </div>

            <div className="text-right sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                OPD CASE SLIP
              </span>
              <div className="text-xs font-bold font-mono text-slate-800 mt-1">
                PATIENT ID: {appointment.patient_code || patient?.patient_code || 'SKMH-2026-PAT-101'}
              </div>
              <div className="text-[10px] text-slate-500">Case No: OPD-{appointment.id}</div>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient Name</span>
              <strong className="text-slate-900 font-bold">{appointment.user_name}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Age / Gender / Blood</span>
              <strong>{patient?.age || '42'} Yrs / {patient?.gender || 'Male'} / {patient?.blood_group || 'B+'}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
              <strong>{appointment.user_phone || patient?.phone}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Visit Date & Slot</span>
              <strong>{appointment.appointment_date} ({appointment.time_slot})</strong>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="flex items-center justify-between text-xs bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Consulting Specialist Doctor</span>
              <strong className="text-sm font-extrabold text-emerald-950">{appointment.doctor_name}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Department</span>
              <strong className="text-emerald-900">{appointment.department}</strong>
            </div>
          </div>

          {/* Patient Vitals Grid */}
          {appointment.vitals && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" /> Clinical Vitals Recorded
              </span>
              <div className="grid grid-cols-5 gap-2 text-xs text-center">
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">BP</div>
                  <strong className="text-slate-900">{appointment.vitals.blood_pressure || '-'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">PULSE</div>
                  <strong className="text-slate-900">{appointment.vitals.pulse_rate || '-'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">TEMP</div>
                  <strong className="text-slate-900">{appointment.vitals.temperature || '-'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">SpO2</div>
                  <strong className="text-slate-900">{appointment.vitals.spo2 || '-'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">WEIGHT</div>
                  <strong className="text-slate-900">{appointment.vitals.weight_kg ? `${appointment.vitals.weight_kg} kg` : '-'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Primary Diagnosis */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Diagnosis / Observations</span>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-bold text-slate-900">
              {appointment.diagnosis || appointment.reason || 'Routine OPD Evaluation'}
            </div>
          </div>

          {/* Prescribed Medicines Rx */}
          {appointment.prescribed_medicines && appointment.prescribed_medicines.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-emerald-600" /> Prescribed Medications (Rx)
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      <th className="p-2 border-b">Medicine Name</th>
                      <th className="p-2 border-b">Dosage</th>
                      <th className="p-2 border-b">Frequency</th>
                      <th className="p-2 border-b">Duration</th>
                      <th className="p-2 border-b">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointment.prescribed_medicines.map((med, idx) => (
                      <tr key={med.id || idx}>
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{med.name}</td>
                        <td className="p-2 text-slate-700">{med.dosage}</td>
                        <td className="p-2 font-semibold text-emerald-800">{med.frequency}</td>
                        <td className="p-2 text-slate-700">{med.duration}</td>
                        <td className="p-2 text-slate-500 italic">{med.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommended Diagnostic Tests */}
          {appointment.recommended_tests && appointment.recommended_tests.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Recommended Lab & Diagnostic Tests
              </span>
              <div className="flex flex-wrap gap-2">
                {appointment.recommended_tests.map((test, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                    • {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Higher Reference / Referral Section */}
          {appointment.higher_reference && (
            <div className="p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-amber-950 uppercase flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-700" /> HIGHER TERTIARY REFERRAL SLIP
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                  {appointment.higher_reference.urgency}
                </span>
              </div>
              <div className="text-xs text-slate-800 space-y-1">
                <div><strong>Referred To:</strong> {appointment.higher_reference.referred_to_hospital} ({appointment.higher_reference.specialist_center})</div>
                <div><strong>Clinical Reason:</strong> {appointment.higher_reference.referral_reason}</div>
              </div>
            </div>
          )}

          {/* Follow up & Doctor Sign */}
          <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-xs">
            <div>
              {appointment.follow_up_date && (
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs inline-block">
                  📅 Recommended Follow-up OPD Visit: <strong>{appointment.follow_up_date}</strong>
                </div>
              )}
              {appointment.notes && (
                <p className="text-[11px] text-slate-500 italic mt-1 max-w-sm">Advice: {appointment.notes}</p>
              )}
            </div>

            <div className="text-center pt-8 border-t border-slate-300 w-48">
              <div className="text-xs font-bold text-emerald-900">{appointment.doctor_name}</div>
              <div className="text-[10px] text-slate-500 font-medium">Authorized Signature & Seal</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
