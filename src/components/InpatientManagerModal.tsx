import React, { useState, useEffect } from 'react';
import { AdmittedPatientRecord, IPDDailyRoutineCheckup, IPDDailyDose, IPDSurgeryRecord } from '../types';
import { api } from '../lib/api';
import { X, BedDouble, Plus, Trash2, Printer, Download, HeartPulse, Activity, Syringe, Pill, Stethoscope, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InpatientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InpatientManagerModal: React.FC<InpatientManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [ipdList, setIpdList] = useState<AdmittedPatientRecord[]>([]);
  const [selectedIpd, setSelectedIpd] = useState<AdmittedPatientRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'discharge_summary'>('list');

  // New Admission Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIpdForm, setNewIpdForm] = useState({
    patient_name: '',
    patient_code: 'SKMH-2026-PAT-105',
    phone: '',
    doctor_name: 'Dr. Tushar Patel',
    department: 'Orthopedics',
    ward_type: 'Super Deluxe Suite' as 'Deluxe Ward' | 'Super Deluxe Suite' | 'General Ward' | 'ICU Critical Care',
    bed_number: 'Bed SD-305',
    diagnosis_at_admission: 'Acute Knee Injury & Meniscal Tear',
    daily_bed_charge: 4500
  });

  // Daily log inputs
  const [checkupBp, setCheckupBp] = useState('120/80');
  const [checkupPulse, setCheckupPulse] = useState('72 bpm');
  const [checkupTemp, setCheckupTemp] = useState('98.6 °F');
  const [checkupSugar, setCheckupSugar] = useState('110 mg/dL');
  const [checkupNotes, setCheckupNotes] = useState('Patient comfortable.');

  const [doseMedName, setDoseMedName] = useState('Saline Normal Saline 500ml');
  const [doseAmount, setDoseAmount] = useState('1 Pack');
  const [doseType, setDoseType] = useState<'Medicine' | 'Saline' | 'Injection' | 'Drop'>('Saline');

  const [surgeryName, setSurgeryName] = useState('');
  const [surgeryCharge, setSurgeryCharge] = useState('');

  useEffect(() => {
    loadIpdRecords();
  }, []);

  const loadIpdRecords = async () => {
    try {
      const records = await api.getAdmittedPatients();
      setIpdList(records);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpdForm.patient_name) return;

    try {
      const created = await api.addAdmittedPatient({
        patient_id: `pat-${Date.now()}`,
        patient_name: newIpdForm.patient_name,
        patient_code: newIpdForm.patient_code,
        phone: newIpdForm.phone || '+91 98000 11111',
        doctor_id: 'doc-1',
        doctor_name: newIpdForm.doctor_name,
        department: newIpdForm.department,
        ward_type: newIpdForm.ward_type,
        bed_number: newIpdForm.bed_number,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        diagnosis_at_admission: newIpdForm.diagnosis_at_admission,
        daily_bed_charge: newIpdForm.daily_bed_charge,
        daily_routine_checkups: [],
        daily_doses: [],
        surgeries_performed: [],
        total_paid_amount: 10000
      });

      setIpdList(prev => [created, ...prev]);
      setShowAddModal(false);
      setSelectedIpd(created);
      setViewMode('details');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCheckup = async () => {
    if (!selectedIpd) return;
    const newCheckup: IPDDailyRoutineCheckup = {
      id: `chk-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bp: checkupBp,
      pulse: checkupPulse,
      temp: checkupTemp,
      sugar: checkupSugar,
      notes: checkupNotes,
      doctor_or_nurse: selectedIpd.doctor_name
    };

    const updated: AdmittedPatientRecord = {
      ...selectedIpd,
      daily_routine_checkups: [newCheckup, ...selectedIpd.daily_routine_checkups]
    };

    await api.updateAdmittedPatient(updated);
    setSelectedIpd(updated);
    loadIpdRecords();
  };

  const handleAddDose = async () => {
    if (!selectedIpd || !doseMedName) return;
    const newDose: IPDDailyDose = {
      id: `dose-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      medicine_name: doseMedName,
      dose_amount: doseAmount,
      type: doseType,
      given_by: 'Ward Nurse'
    };

    const updated: AdmittedPatientRecord = {
      ...selectedIpd,
      daily_doses: [newDose, ...selectedIpd.daily_doses]
    };

    await api.updateAdmittedPatient(updated);
    setSelectedIpd(updated);
    loadIpdRecords();
  };

  const handleAddSurgery = async () => {
    if (!selectedIpd || !surgeryName) return;
    const newSurg: IPDSurgeryRecord = {
      id: `surg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      surgery_name: surgeryName,
      surgeon_name: selectedIpd.doctor_name,
      charge: parseFloat(surgeryCharge) || 15000
    };

    const updated: AdmittedPatientRecord = {
      ...selectedIpd,
      surgeries_performed: [newSurg, ...selectedIpd.surgeries_performed]
    };

    await api.updateAdmittedPatient(updated);
    setSelectedIpd(updated);
    loadIpdRecords();
    setSurgeryName('');
    setSurgeryCharge('');
  };

  const calculateDaysAdmitted = (admissionDate: string) => {
    const start = new Date(admissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 print:shadow-none print:m-0 print:w-full print:max-w-none print:p-4 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 font-bold flex items-center justify-center shadow-lg">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Inpatient Admissions & Ward Bed Management (IPD)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Track Admitted Patients, Daily Vitals, Medication Doses, Surgeries, and Discharge Summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'list' ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Patient Admission
              </button>
            ) : (
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                ← Back to IPD Patients List
              </button>
            )}

            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE 1: IPD PATIENT LIST */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ipdList.map((ipd) => {
                const days = calculateDaysAdmitted(ipd.admission_date);
                const bedTotal = days * ipd.daily_bed_charge;
                const surgTotal = ipd.surgeries_performed.reduce((acc, s) => acc + s.charge, 0);
                const grandTotal = bedTotal + surgTotal;

                return (
                  <div
                    key={ipd.id}
                    className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xl transition-all space-y-3 cursor-pointer group"
                    onClick={() => {
                      setSelectedIpd(ipd);
                      setViewMode('details');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {ipd.ward_type} • {ipd.bed_number}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{ipd.patient_code}</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                        {ipd.patient_name}
                      </h3>
                      <p className="text-xs text-slate-500">Doctor: <strong>{ipd.doctor_name}</strong> ({ipd.department})</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">"{ipd.diagnosis_at_admission}"</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Admitted For</span>
                        <strong className="text-slate-800 font-extrabold">{days} Days ({ipd.admission_date})</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Total Charges</span>
                        <strong className="text-emerald-700 font-black text-sm">₹{grandTotal.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: SELECTED IPD DETAILS & DAILY LOGS */}
        {viewMode === 'details' && selectedIpd && (
          <div className="space-y-6">
            
            {/* Patient Header Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-400/30">
                    {selectedIpd.ward_type} • {selectedIpd.bed_number}
                  </span>
                  <span className="text-xs font-mono text-slate-300">{selectedIpd.patient_code}</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">{selectedIpd.patient_name}</h2>
                <p className="text-xs text-slate-300">
                  Doctor: <strong>{selectedIpd.doctor_name}</strong> • Admitted: {selectedIpd.admission_date} ({calculateDaysAdmitted(selectedIpd.admission_date)} Days Stay)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('discharge_summary')}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Generate Discharge Summary & Bill
              </button>
            </div>

            {/* Grid of Daily Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Routine Daily Checkups Vitals */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-600" /> Daily Vitals & Ward Routine Checkups
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input type="text" placeholder="BP (120/80)" value={checkupBp} onChange={(e) => setCheckupBp(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white" />
                  <input type="text" placeholder="Pulse (72 bpm)" value={checkupPulse} onChange={(e) => setCheckupPulse(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white" />
                  <input type="text" placeholder="Temp (98.6 °F)" value={checkupTemp} onChange={(e) => setCheckupTemp(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white" />
                  <input type="text" placeholder="Sugar (110 mg/dL)" value={checkupSugar} onChange={(e) => setCheckupSugar(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white" />
                </div>

                <div className="flex gap-2">
                  <input type="text" placeholder="Notes (e.g. Patient comfortable)" value={checkupNotes} onChange={(e) => setCheckupNotes(e.target.value)} className="flex-1 p-2 rounded-xl border border-slate-200 text-xs bg-white" />
                  <button onClick={handleAddCheckup} className="px-3 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Log
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-slate-200">
                  {selectedIpd.daily_routine_checkups.map((chk) => (
                    <div key={chk.id} className="bg-white p-2.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{chk.date} ({chk.time})</span>
                        <span className="text-emerald-700">BP: {chk.bp} • Temp: {chk.temp}</span>
                      </div>
                      <p className="text-slate-600 italic">{chk.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication, Saline & Injection Doses */}
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                <h3 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                  <Syringe className="w-4 h-4 text-emerald-700" /> Administered Doses (Meds / Saline / Injections)
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input type="text" placeholder="Medicine / Saline Name" value={doseMedName} onChange={(e) => setDoseMedName(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white font-semibold" />
                  <input type="text" placeholder="Amount (e.g. 1 Pack / 1 Vial)" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white" />
                </div>

                <div className="flex gap-2">
                  <select value={doseType} onChange={(e) => setDoseType(e.target.value as any)} className="p-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800">
                    <option value="Saline">Saline</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Injection">Injection</option>
                    <option value="Drop">Drop</option>
                  </select>
                  <button onClick={handleAddDose} className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Log Dose
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-emerald-200">
                  {selectedIpd.daily_doses.map((d) => (
                    <div key={d.id} className="bg-white p-2.5 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{d.medicine_name} ({d.dose_amount})</span>
                        <span className="text-[10px] text-slate-500">{d.date} at {d.time} • Given by: {d.given_by}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        {d.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Surgery & Operations Log */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> Surgical Operations & OT Procedures Log
              </h3>

              <div className="flex gap-2">
                <input type="text" placeholder="Surgery Procedure Name (e.g. Arthroscopic Repair)" value={surgeryName} onChange={(e) => setSurgeryName(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-white" />
                <input type="number" placeholder="OT Charge ₹" value={surgeryCharge} onChange={(e) => setSurgeryCharge(e.target.value)} className="w-32 p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold" />
                <button onClick={handleAddSurgery} className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer shrink-0">
                  <Plus className="w-4 h-4" /> Add Surgery
                </button>
              </div>

              <div className="space-y-2">
                {selectedIpd.surgeries_performed.map((s) => (
                  <div key={s.id} className="bg-white p-3 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 text-sm font-extrabold">{s.surgery_name}</strong>
                      <p className="text-slate-500">Surgeon: {s.surgeon_name} • Date: {s.date}</p>
                    </div>
                    <span className="text-emerald-700 font-black text-sm">₹{s.charge.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MODE 3: PRINTABLE DISCHARGE SUMMARY */}
        {viewMode === 'discharge_summary' && selectedIpd && (
          <div className="space-y-6">
            
            <div className="flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-slate-600">Official Hospital Discharge Summary & Medical Clearance Slip</span>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print / Export PDF Discharge Summary
              </button>
            </div>

            <div className="border-2 border-slate-900 p-8 rounded-3xl space-y-6 bg-white text-slate-900">
              
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">SHREE KRISHNA MULTISPECIALTY HOSPITAL</h1>
                  <p className="text-xs font-bold text-slate-700">Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230 (UT) • 24x7 Critical Care & OT Unit</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider">
                    DISCHARGE SUMMARY
                  </span>
                  <p className="text-xs font-mono font-bold mt-1">{selectedIpd.patient_code}</p>
                </div>
              </div>

              {/* Patient Profile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Patient Name</span>
                  <strong className="text-sm font-extrabold">{selectedIpd.patient_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Ward / Bed</span>
                  <strong className="text-sm font-extrabold">{selectedIpd.ward_type} ({selectedIpd.bed_number})</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Admission Date</span>
                  <strong className="text-sm font-extrabold">{selectedIpd.admission_date}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px]">Discharge Date</span>
                  <strong className="text-sm font-extrabold text-emerald-700">{new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>

              {/* Diagnosis & Surgeries */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-extrabold uppercase text-slate-900 border-b pb-1">Primary Clinical Diagnosis</h4>
                  <p className="mt-1 font-semibold text-slate-800">{selectedIpd.diagnosis_at_admission}</p>
                </div>

                <div>
                  <h4 className="font-extrabold uppercase text-slate-900 border-b pb-1">Surgical Procedures Performed</h4>
                  {selectedIpd.surgeries_performed.length > 0 ? (
                    selectedIpd.surgeries_performed.map((s) => (
                      <p key={s.id} className="mt-1 font-semibold text-slate-800">• {s.surgery_name} by {s.surgeon_name} on {s.date}</p>
                    ))
                  ) : (
                    <p className="mt-1 text-slate-500 italic">Conservative medical management.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold uppercase text-slate-900 border-b pb-1">Medications Administered During Stay</h4>
                  <p className="mt-1 text-slate-700">
                    {selectedIpd.daily_doses.map(d => `${d.medicine_name} (${d.dose_amount})`).join(', ') || 'Standard IV Fluids & Pain relief'}
                  </p>
                </div>
              </div>

              {/* Doctor Seal */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 italic">Medically Fit For Discharge. Follow-up OPD in 14 days.</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b-2 border-slate-900 mb-1 inline-block"></div>
                  <p className="font-extrabold text-slate-900">{selectedIpd.doctor_name}</p>
                  <p className="text-[10px] text-slate-600">Senior Consulting Specialist</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Modal: Add New Admission */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Admit New Patient to Ward (IPD)</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmission} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Patient Name"
                    value={newIpdForm.patient_name}
                    onChange={(e) => setNewIpdForm({ ...newIpdForm, patient_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Ward Category</label>
                    <select
                      value={newIpdForm.ward_type}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, ward_type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                    >
                      <option value="Super Deluxe Suite">Super Deluxe Suite</option>
                      <option value="Deluxe Ward">Deluxe Ward</option>
                      <option value="General Ward">General Ward</option>
                      <option value="ICU Critical Care">ICU Critical Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Bed Number</label>
                    <input
                      type="text"
                      placeholder="Bed SD-305"
                      value={newIpdForm.bed_number}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, bed_number: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Diagnosis at Admission</label>
                  <input
                    type="text"
                    placeholder="Clinical Reason for Admission"
                    value={newIpdForm.diagnosis_at_admission}
                    onChange={(e) => setNewIpdForm({ ...newIpdForm, diagnosis_at_admission: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow">
                    Confirm Admission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
