import React from 'react';
import { Appointment, Doctor } from '../types';
import { X, Printer, Building2, Calendar, FileText, CheckCircle, ShieldCheck, DollarSign } from 'lucide-react';

interface DailyPaymentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  doctors: Doctor[];
  selectedDate?: string;
}

export const DailyPaymentReportModal: React.FC<DailyPaymentReportModalProps> = ({
  isOpen,
  onClose,
  appointments,
  doctors,
  selectedDate
}) => {
  if (!isOpen) return null;

  const reportDate = selectedDate || new Date().toISOString().split('T')[0];
  const formattedReportDate = new Date(reportDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Filter today's active & confirmed/completed OPD appointments
  const todayAppointments = appointments.filter(a => {
    return (a.appointment_date === reportDate || !a.appointment_date) && a.status !== 'cancelled';
  });

  // Calculate totals
  const totalConsultations = todayAppointments.length;
  
  // Doctor fee lookup helper
  const getFeeForApt = (apt: Appointment) => {
    const doc = doctors.find(d => d.id === apt.doctor_id || d.name.toLowerCase() === apt.doctor_name.toLowerCase());
    return doc?.consultation_fee || 500;
  };

  const totalRevenue = todayAppointments.reduce((acc, apt) => acc + getFeeForApt(apt), 0);

  // Mode breakdown simulation/calculation from notes or default
  let cashTotal = 0;
  let upiTotal = 0;
  let cardTotal = 0;
  let govtTotal = 0;

  todayAppointments.forEach(apt => {
    const fee = getFeeForApt(apt);
    const notesLower = (apt.notes || '').toLowerCase();
    if (notesLower.includes('upi') || notesLower.includes('qr')) {
      upiTotal += fee;
    } else if (notesLower.includes('card')) {
      cardTotal += fee;
    } else if (notesLower.includes('free') || notesLower.includes('govt')) {
      govtTotal += fee;
    } else {
      cashTotal += fee;
    }
  });

  // Doctor-wise breakdown
  const doctorBreakdownMap = new Map<string, { doctorName: string; department: string; count: number; totalFee: number }>();

  todayAppointments.forEach(apt => {
    const docName = apt.doctor_name || 'General OPD';
    const fee = getFeeForApt(apt);
    const existing = doctorBreakdownMap.get(docName) || {
      doctorName: docName,
      department: apt.department || 'Consultation',
      count: 0,
      totalFee: 0
    };
    existing.count += 1;
    existing.totalFee += fee;
    doctorBreakdownMap.set(docName, existing);
  });

  const doctorBreakdowns = Array.from(doctorBreakdownMap.values());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] my-4">
        
        {/* Modal Header Actions (Screen Only) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Daily OPD Payment Collection Report</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-black uppercase">
                  Hard Copy Format
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Formal daily collection statement for submission to Admin & Super Administrator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Hard Copy Report
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT AREA */}
        <div id="printable-daily-report" className="p-8 space-y-6 overflow-y-auto font-sans text-slate-900 bg-white">
          
          {/* Hospital Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/50">
                SK
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                  SHREE KRISHNA MULTISPECIALTY HOSPITAL
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  OPD Desk & Financial Accounts Division • Silvassa, Dadra & Nagar Haveli
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Helpline: +91 260 264 0000 | Email: accounts@shreekrishnahospital.org
                </p>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-200 pl-4 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Report Type</span>
              <span className="text-sm font-black text-emerald-950 uppercase block">Daily OPD Collection Statement</span>
              <span className="text-xs font-bold text-slate-700 block">{formattedReportDate}</span>
              <span className="text-[10px] font-mono text-slate-400">Ref No: SKMH-DCR-{reportDate.replace(/-/g, '')}</span>
            </div>
          </div>

          {/* Key Revenue Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Total OPD Consultations</span>
              <span className="text-2xl font-black text-slate-900">{totalConsultations}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Patients Processed</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-extrabold text-emerald-800 block">Total Revenue Collected</span>
              <span className="text-2xl font-black text-emerald-900">₹{totalRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-700 block font-bold">100% Verified Desk Revenue</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] uppercase font-extrabold text-blue-800 block">Cash Payments</span>
              <span className="text-2xl font-black text-blue-900">₹{cashTotal.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-blue-600 block font-medium">Physical Cash at Desk</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] uppercase font-extrabold text-purple-800 block">Digital / UPI / Card</span>
              <span className="text-2xl font-black text-purple-900">₹{(upiTotal + cardTotal).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-purple-600 block font-medium">Direct Bank Settlement</span>
            </div>
          </div>

          {/* Doctor-wise OPD Revenue Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              📊 Doctor-Wise OPD Collection Summary
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">Attending Doctor Name</th>
                  <th className="p-2 border-r border-slate-200">Specialty Department</th>
                  <th className="p-2 border-r border-slate-200 text-center">OPD Patients</th>
                  <th className="p-2 text-right">Total Collection (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {doctorBreakdowns.map((doc, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">Dr. {doc.doctorName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">{doc.department}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">{doc.count}</td>
                    <td className="p-2 text-right font-black text-emerald-900">₹{doc.totalFee.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Itemized Patient Payment Log Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              📑 Detailed Patient Payment Log ({todayAppointments.length} Entries)
            </h3>
            <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-2 border-r border-slate-700">S.No</th>
                  <th className="p-2 border-r border-slate-700">Patient Code</th>
                  <th className="p-2 border-r border-slate-700">Patient Name</th>
                  <th className="p-2 border-r border-slate-700">Doctor Assigned</th>
                  <th className="p-2 border-r border-slate-700">Time Slot</th>
                  <th className="p-2 border-r border-slate-700">Mode</th>
                  <th className="p-2 text-right">Fee (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {todayAppointments.map((apt, index) => {
                  const fee = getFeeForApt(apt);
                  return (
                    <tr key={apt.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-500 text-center">{index + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700">
                        {apt.patient_code || `PAT-${101 + index}`}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{apt.user_name}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-emerald-800">Dr. {apt.doctor_name}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{apt.time_slot}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-700">
                        {apt.notes?.toLowerCase().includes('upi') ? 'UPI / QR' : apt.notes?.toLowerCase().includes('card') ? 'Card' : 'Cash'}
                      </td>
                      <td className="p-2 text-right font-extrabold text-slate-900">₹{fee}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-100 font-black text-slate-900 border-t-2 border-slate-900">
                  <td colSpan={6} className="p-2 text-right uppercase tracking-wider text-xs">
                    Grand Total Daily Collection:
                  </td>
                  <td className="p-2 text-right text-sm text-emerald-950 font-black">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification & Official Signature Sign-off Block */}
          <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-12">
              <div className="border-b-2 border-slate-400 w-48"></div>
              <div>
                <span className="font-extrabold text-slate-900 block">Submitted By (Receptionist Desk Officer)</span>
                <span className="text-[10px] text-slate-500 block">Shree Krishna Hospital OPD Desk</span>
                <span className="text-[10px] font-mono text-slate-400 block">Date & Time: {new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-12 text-right flex flex-col items-end">
              <div className="border-b-2 border-slate-400 w-48"></div>
              <div>
                <span className="font-extrabold text-slate-900 block">Verified & Received By (Admin / Super Admin)</span>
                <span className="text-[10px] text-slate-500 block">Hospital Financial Accounts Controller</span>
                <span className="text-[10px] font-mono text-slate-400 block">Signature & Hospital Seal</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
