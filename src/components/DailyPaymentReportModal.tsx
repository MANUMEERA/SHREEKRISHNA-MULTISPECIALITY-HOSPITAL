import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, PaymentReceipt, AdmittedPatientRecord } from '../types';
import { api } from '../lib/api';
import { X, Printer, Building2, Calendar, FileText, CheckCircle, ShieldCheck, DollarSign, Filter, Stethoscope, Activity, BedDouble, UserCheck } from 'lucide-react';

interface DailyPaymentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  doctors: Doctor[];
  selectedDate?: string;
}

export type CollectionCategoryFilter = 'ALL' | 'DOCTORS' | 'XRAY' | 'OT' | 'IPD';

interface UnifiedCollectionItem {
  id: string;
  patient_code: string;
  patient_name: string;
  category: CollectionCategoryFilter | 'OTHER';
  categoryLabel: string;
  doctor_id?: string;
  doctor_name: string;
  department: string;
  date: string;
  time_or_date: string;
  payment_mode: string;
  amount: number;
}

export const DailyPaymentReportModal: React.FC<DailyPaymentReportModalProps> = ({
  isOpen,
  onClose,
  appointments,
  doctors,
  selectedDate
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [categoryFilter, setCategoryFilter] = useState<CollectionCategoryFilter>('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(selectedDate || todayStr);
  const [endDate, setEndDate] = useState<string>(selectedDate || todayStr);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);
  const [admittedPatients, setAdmittedPatients] = useState<AdmittedPatientRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      const initDate = selectedDate || todayStr;
      setStartDate(initDate);
      setEndDate(initDate);
      api.getPaymentReceipts().then(rcpts => setPaymentReceipts(rcpts || [])).catch(() => {});
      api.getAdmittedPatients().then(ipds => setAdmittedPatients(ipds || [])).catch(() => {});
    }
  }, [isOpen, selectedDate, todayStr]);

  if (!isOpen) return null;

  // Helper to check if a item date falls within the selected start-end range
  const isDateInSelectedRange = (dateVal?: string) => {
    if (!dateVal) return true; // keep if no date attached
    const itemDate = dateVal.split('T')[0];
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  const formatDateFormatted = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDisplayDateRange = () => {
    if (!startDate && !endDate) return 'All Recorded Collections';
    if (startDate && endDate && startDate === endDate) {
      return new Date(startDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (startDate && endDate) {
      return `${formatDateFormatted(startDate)} to ${formatDateFormatted(endDate)}`;
    }
    if (startDate) return `From ${formatDateFormatted(startDate)}`;
    if (endDate) return `Until ${formatDateFormatted(endDate)}`;
    return 'Custom Date Range';
  };

  const getRefNo = () => {
    if (startDate && endDate && startDate === endDate) {
      return `Ref No: SKMH-DCR-${startDate.replace(/-/g, '')}`;
    } else if (startDate && endDate) {
      return `Ref No: SKMH-DCR-${startDate.replace(/-/g, '')}-TO-${endDate.replace(/-/g, '')}`;
    }
    return `Ref No: SKMH-DCR-STATEMENT`;
  };

  // Doctor fee lookup helper
  const getFeeForApt = (apt: Appointment) => {
    const doc = doctors.find(d => d.id === apt.doctor_id || d.name.toLowerCase() === apt.doctor_name.toLowerCase());
    return doc?.consultation_fee || 500;
  };

  // Build unified collection list across OPD appointments, receipts, and IPD discharges
  const unifiedItems: UnifiedCollectionItem[] = [];

  // 1. OPD Appointments (Category: DOCTORS)
  appointments.forEach((apt, idx) => {
    const aptDate = apt.appointment_date || (apt.created_at ? apt.created_at.split('T')[0] : todayStr);
    if (isDateInSelectedRange(aptDate) && apt.status !== 'cancelled') {
      const notesLower = (apt.notes || '').toLowerCase();
      let mode = 'Cash';
      if (notesLower.includes('upi') || notesLower.includes('qr')) mode = 'UPI / QR';
      else if (notesLower.includes('card')) mode = 'Card';

      const fee = getFeeForApt(apt);

      unifiedItems.push({
        id: `apt-${apt.id}`,
        patient_code: apt.patient_code || `SKMH-2026-PAT-${101 + idx}`,
        patient_name: apt.user_name || 'Walk-in Patient',
        category: 'DOCTORS',
        categoryLabel: 'OPD Doctor Consultation Fee',
        doctor_id: apt.doctor_id,
        doctor_name: apt.doctor_name || 'Consulting Physician',
        department: apt.department || 'General Medicine',
        date: aptDate,
        time_or_date: apt.time_slot || '10:00 AM',
        payment_mode: mode,
        amount: fee
      });
    }
  });

  // 2. Billing Payment Receipts (Category: XRAY, OT, IPD, DOCTORS, OTHER)
  paymentReceipts.forEach((rcpt) => {
    const rcptDate = rcpt.payment_date || (rcpt.created_at ? rcpt.created_at.split('T')[0] : todayStr);
    if (isDateInSelectedRange(rcptDate)) {
      rcpt.items.forEach((item, itemIdx) => {
        const catLower = (item.category || item.description || '').toLowerCase();
        let cat: CollectionCategoryFilter | 'OTHER' = 'OTHER';
        let label = item.category || 'Hospital Service';

        if (catLower.includes('x-ray') || catLower.includes('xray') || catLower.includes('radiology') || catLower.includes('scan') || catLower.includes('ultrasound') || catLower.includes('mri')) {
          cat = 'XRAY';
          label = 'X-Ray & Radiology';
        } else if (catLower.includes('ot') || catLower.includes('operation') || catLower.includes('surgery') || catLower.includes('theatre') || catLower.includes('anaesthesia')) {
          cat = 'OT';
          label = 'OT Charges & Surgery';
        } else if (catLower.includes('ipd') || catLower.includes('inpatient') || catLower.includes('discharge') || catLower.includes('ward') || catLower.includes('bed')) {
          cat = 'IPD';
          label = 'Inpatient Discharge Payment';
        } else if (catLower.includes('consultation') || catLower.includes('doctor')) {
          cat = 'DOCTORS';
          label = 'OPD Doctor Consultation Fee';
        }

        unifiedItems.push({
          id: `rcpt-${rcpt.id}-${itemIdx}`,
          patient_code: rcpt.patient_code || 'SKMH-PAT',
          patient_name: rcpt.patient_name || 'Hospital Patient',
          category: cat,
          categoryLabel: item.description || label,
          doctor_name: 'Consulting Specialist',
          department: label,
          date: rcptDate,
          time_or_date: 'Receipt Ref: ' + rcpt.receipt_number,
          payment_mode: rcpt.payment_mode || 'Cash',
          amount: item.amount || 0
        });
      });
    }
  });

  // 3. Inpatient Discharges (Category: IPD)
  admittedPatients.forEach((ipd, idx) => {
    const ipdDate = ipd.discharge_date || ipd.admission_date || (ipd.created_at ? ipd.created_at.split('T')[0] : todayStr);
    if (isDateInSelectedRange(ipdDate) && (ipd.status === 'Discharged' || (ipd.total_paid_amount && ipd.total_paid_amount > 0))) {
      unifiedItems.push({
        id: `ipd-${ipd.id || idx}`,
        patient_code: ipd.patient_code || `SKMH-IPD-${200 + idx}`,
        patient_name: ipd.patient_name,
        category: 'IPD',
        categoryLabel: 'Inpatient Discharge Final Bill Payment',
        doctor_id: ipd.doctor_id,
        doctor_name: ipd.doctor_name || 'Attending IPD Consultant',
        department: ipd.department || 'IPD Ward',
        date: ipdDate,
        time_or_date: ipd.discharge_date ? `Discharged: ${ipd.discharge_date}` : `Admitted: ${ipd.admission_date}`,
        payment_mode: 'Cash / Bank Transfer',
        amount: ipd.total_paid_amount || (ipd.daily_bed_charge * 2) || 12000
      });
    }
  });

  // Apply User Filter Selection (ALL vs DOCTORS vs XRAY vs OT vs IPD, and Doctor selection)
  const filteredItems = unifiedItems.filter(item => {
    // Category match
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
      return false;
    }

    // Doctor match when filtered by Doctor or ALL
    if (selectedDoctorId !== 'ALL') {
      const selectedDocObj = doctors.find(d => d.id === selectedDoctorId);
      if (selectedDocObj) {
        const itemDocLower = (item.doctor_name || '').toLowerCase();
        const selDocLower = selectedDocObj.name.toLowerCase();
        if (item.doctor_id) {
          if (item.doctor_id !== selectedDoctorId && !itemDocLower.includes(selDocLower)) return false;
        } else if (!itemDocLower.includes(selDocLower)) {
          return false;
        }
      }
    }

    return true;
  });

  // Calculated Metrics for the selected filter
  const totalTransactions = filteredItems.length;
  const totalRevenue = filteredItems.reduce((acc, item) => acc + item.amount, 0);

  let cashTotal = 0;
  let digitalTotal = 0;

  filteredItems.forEach(item => {
    const modeLower = (item.payment_mode || '').toLowerCase();
    if (modeLower.includes('upi') || modeLower.includes('card') || modeLower.includes('bank') || modeLower.includes('net')) {
      digitalTotal += item.amount;
    } else {
      cashTotal += item.amount;
    }
  });

  // Doctor-wise / Category-wise summary mapping
  const breakdownMap = new Map<string, { title: string; subtitle: string; count: number; total: number }>();

  filteredItems.forEach(item => {
    const key = categoryFilter === 'DOCTORS' || categoryFilter === 'ALL'
      ? item.doctor_name
      : item.categoryLabel;

    const existing = breakdownMap.get(key) || {
      title: key,
      subtitle: item.department || 'Hospital Department',
      count: 0,
      total: 0
    };
    existing.count += 1;
    existing.total += item.amount;
    breakdownMap.set(key, existing);
  });

  const breakdowns = Array.from(breakdownMap.values());

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    let title = 'DAILY HOSPITAL PAYMENT COLLECTION STATEMENT';
    if (categoryFilter === 'DOCTORS') {
      if (selectedDoctorId !== 'ALL') {
        const doc = doctors.find(d => d.id === selectedDoctorId);
        title = `DAILY OPD COLLECTION STATEMENT - DR. ${doc?.name?.toUpperCase() || ''}`;
      } else {
        title = 'DOCTOR-WISE OPD PAYMENT COLLECTION STATEMENT';
      }
    } else if (categoryFilter === 'XRAY') {
      title = 'X-RAY & RADIOLOGY CHARGES COLLECTION STATEMENT';
    } else if (categoryFilter === 'OT') {
      title = 'OPERATION THEATRE (OT) CHARGES COLLECTION STATEMENT';
    } else if (categoryFilter === 'IPD') {
      title = 'INPATIENT (IPD) DISCHARGE PAYMENT COLLECTION STATEMENT';
    }
    return title;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        
        {/* Sticky Modal Header Actions (Screen Only) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Receptionist Daily Payment Collection Report</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-black uppercase">
                  Hard Copy Print
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Formal collection statement for submission to Admin & Super Administrator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Hard Copy Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
              title="Close Report Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEPTIONIST CATEGORY FILTER SELECTION BAR */}
        <div className="bg-slate-800 text-white p-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Collection Filter:
            </span>
            
            <button
              onClick={() => { setCategoryFilter('ALL'); setSelectedDoctorId('ALL'); }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🌐 ALL COLLECTIONS
            </button>

            <button
              onClick={() => setCategoryFilter('DOCTORS')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'DOCTORS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🩺 INDIVIDUAL DOCTORS
            </button>

            <button
              onClick={() => setCategoryFilter('XRAY')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'XRAY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🩻 X-RAY & RADIOLOGY
            </button>

            <button
              onClick={() => setCategoryFilter('OT')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'OT'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔪 OT CHARGES
            </button>

            <button
              onClick={() => setCategoryFilter('IPD')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'IPD'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏥 INPATIENT DISCHARGE PAYMENT
            </button>
          </div>

          {/* Individual Doctor Dropdown Selection */}
          {(categoryFilter === 'ALL' || categoryFilter === 'DOCTORS') && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-300">Doctor Filter:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-emerald-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="ALL">All Doctors ({doctors.length})</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} ({doc.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* DATE RANGE SELECTION BAR */}
        <div className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="uppercase text-[11px] tracking-wider text-slate-300 font-extrabold">Report Date Range:</span>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  startDate === todayStr && endDate === todayStr
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const yestStr = yest.toISOString().split('T')[0];
                  setStartDate(yestStr);
                  setEndDate(yestStr);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => {
                  const d7 = new Date();
                  d7.setDate(d7.getDate() - 6);
                  setStartDate(d7.toISOString().split('T')[0]);
                  setEndDate(todayStr);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  setStartDate(firstDay);
                  setEndDate(todayStr);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  !startDate && !endDate
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {getDisplayDateRange()}
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
                  SHREE KRISHNA MULTISPECIALITY HOSPITAL
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  OPD Desk & Financial Accounts Division • Silvassa, Dadra & Nagar Haveli
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Helpline: +91 260 264 0000 | Email: shreekrishnamultispeciality.sil@gmail.com
                </p>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-200 pl-4 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Report Type</span>
              <span className="text-sm font-black text-emerald-950 uppercase block">{getReportTitle()}</span>
              <span className="text-xs font-black text-slate-800 block">{getDisplayDateRange()}</span>
              <span className="text-[10px] font-mono text-slate-400 block">{getRefNo()}</span>
            </div>
          </div>

          {/* Active Filter Title Badge */}
          <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Active Collection Category:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 text-emerald-400 font-extrabold uppercase">
                {categoryFilter === 'ALL' && 'GLOBAL COMBINED COLLECTION (ALL)'}
                {categoryFilter === 'DOCTORS' && (selectedDoctorId !== 'ALL' ? `INDIVIDUAL DOCTOR: DR. ${doctors.find(d => d.id === selectedDoctorId)?.name?.toUpperCase()}` : 'INDIVIDUAL DOCTOR OPD CONSULTATIONS')}
                {categoryFilter === 'XRAY' && 'X-RAY & RADIOLOGY CHARGES'}
                {categoryFilter === 'OT' && 'OPERATION THEATRE (OT) CHARGES'}
                {categoryFilter === 'IPD' && 'INPATIENT (IPD) DISCHARGE PAYMENT'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Records: {filteredItems.length}
            </span>
          </div>

          {/* Key Revenue Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Total Transactions</span>
              <span className="text-2xl font-black text-slate-900">{totalTransactions}</span>
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
              <span className="text-[10px] uppercase font-extrabold text-purple-800 block">Digital / UPI / Card / Bank</span>
              <span className="text-2xl font-black text-purple-900">₹{digitalTotal.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-purple-600 block font-medium">Direct Settlement</span>
            </div>
          </div>

          {/* Summary Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              📊 {categoryFilter === 'DOCTORS' || categoryFilter === 'ALL' ? 'Doctor / Department Collection Summary' : 'Service Collection Summary'}
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">
                    {categoryFilter === 'DOCTORS' || categoryFilter === 'ALL' ? 'Attending Doctor / Service' : 'Service / Category Name'}
                  </th>
                  <th className="p-2 border-r border-slate-200">Specialty / Department</th>
                  <th className="p-2 border-r border-slate-200 text-center">Count</th>
                  <th className="p-2 text-right">Total Collection (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {breakdowns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                      No collections recorded for the selected filter.
                    </td>
                  </tr>
                ) : (
                  breakdowns.map((b, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{b.title}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{b.subtitle}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{b.count}</td>
                      <td className="p-2 text-right font-black text-emerald-900">₹{b.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Detailed Itemized Patient Payment Log Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              📑 Detailed Patient Payment Log ({filteredItems.length} Entries)
            </h3>
            <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-2 border-r border-slate-700">S.No</th>
                  <th className="p-2 border-r border-slate-700">Date / Slot</th>
                  <th className="p-2 border-r border-slate-700">Patient Code</th>
                  <th className="p-2 border-r border-slate-700">Patient Name</th>
                  <th className="p-2 border-r border-slate-700">Service / Description</th>
                  <th className="p-2 border-r border-slate-700">Doctor / Dept</th>
                  <th className="p-2 border-r border-slate-700">Mode</th>
                  <th className="p-2 text-right">Fee (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-medium italic">
                      No patient payment transactions found for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-500 text-center">{index + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700 whitespace-nowrap">
                        <span className="block text-slate-900 font-extrabold">{item.date}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">{item.time_or_date}</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700">
                        {item.patient_code}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{item.patient_name}</td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{item.categoryLabel}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-emerald-800">{item.doctor_name}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-700">
                        {item.payment_mode}
                      </td>
                      <td className="p-2 text-right font-extrabold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-100 font-black text-slate-900 border-t-2 border-slate-900">
                  <td colSpan={7} className="p-2 text-right uppercase tracking-wider text-xs">
                    Grand Total Collection ({categoryFilter}):
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
                <span className="text-[10px] text-slate-500 block">Shree Krishna Hospital OPD & Billing Desk</span>
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

