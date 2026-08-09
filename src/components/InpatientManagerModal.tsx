import React, { useState, useEffect } from 'react';
import { AdmittedPatientRecord, IPDDailyRoutineCheckup, IPDDailyDose, IPDSurgeryRecord, Appointment } from '../types';
import { api } from '../lib/api';
import { X, BedDouble, Plus, Trash2, Printer, Download, HeartPulse, Activity, Syringe, Pill, Stethoscope, FileText, CheckCircle2, ShieldCheck, Lock, DollarSign, Calendar, User, UserCheck, AlertCircle } from 'lucide-react';

interface InpatientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreFillAppointment?: Appointment | null;
  onOpenBillingReceipt?: (ipd: AdmittedPatientRecord) => void;
}

export const InpatientManagerModal: React.FC<InpatientManagerModalProps> = ({
  isOpen,
  onClose,
  initialPreFillAppointment,
  onOpenBillingReceipt
}) => {
  if (!isOpen) return null;

  const [ipdList, setIpdList] = useState<AdmittedPatientRecord[]>([]);
  const [selectedIpd, setSelectedIpd] = useState<AdmittedPatientRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'discharge_summary'>('list');

  // Available Ward Types & Rates Master
  const WARD_OPTIONS = [
    { label: 'General Ward Bed', value: 'General Ward', charge: 1000 },
    { label: 'Semi-Private Room', value: 'Semi-Private Room', charge: 1800 },
    { label: 'Deluxe AC Ward Room', value: 'Deluxe Ward', charge: 2500 },
    { label: 'Super Deluxe Suite', value: 'Super Deluxe Suite', charge: 4500 },
    { label: 'ICU Critical Care Unit', value: 'ICU Critical Care', charge: 6000 }
  ];

  const EXTRA_SERVICE_OPTIONS = [
    { name: 'Diet & Nutrition Meal Service', daily_charge: 350 },
    { name: 'Continuous Nursing Care Level', daily_charge: 500 },
    { name: 'Oxygen Line Support', daily_charge: 800 },
    { name: 'Attendant Sofa Bedding & Couch', daily_charge: 300 }
  ];

  // New Admission Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(!!initialPreFillAppointment);
  const [newIpdForm, setNewIpdForm] = useState({
    patient_name: initialPreFillAppointment?.user_name || '',
    patient_code: initialPreFillAppointment?.patient_code || `SKMH-${new Date().getFullYear()}-PAT-${Math.floor(100 + Math.random() * 900)}`,
    phone: initialPreFillAppointment?.user_phone || '',
    doctor_name: initialPreFillAppointment?.doctor_name || 'Dr. Tushar Patel',
    doctor_specialty: initialPreFillAppointment?.department ? `${initialPreFillAppointment.department} Specialist` : 'Senior Medical Consultant',
    department: initialPreFillAppointment?.department || 'Orthopedics',
    ward_type: (initialPreFillAppointment?.recommended_ward || 'Deluxe Ward') as 'Deluxe Ward' | 'Super Deluxe Suite' | 'General Ward' | 'ICU Critical Care' | 'Semi-Private Room',
    bed_number: `Bed ${initialPreFillAppointment?.recommended_ward ? initialPreFillAppointment.recommended_ward.substr(0, 2).toUpperCase() : 'DLX'}-${Math.floor(100 + Math.random() * 899)}`,
    diagnosis_at_admission: initialPreFillAppointment?.diagnosis || initialPreFillAppointment?.admission_reason || 'Observation required for continuous medical management.',
    daily_bed_charge: 2500,
    selected_extra_services: [] as { name: string; daily_charge: number }[],
    advance_paid: 5000
  });

  // Daily log inputs for Doctor Treatment Sheet
  const [checkupBp, setCheckupBp] = useState('120/80 mmHg');
  const [checkupPulse, setCheckupPulse] = useState('72 bpm');
  const [checkupTemp, setCheckupTemp] = useState('98.6 °F');
  const [checkupSugar, setCheckupSugar] = useState('110 mg/dL');
  const [checkupNotes, setCheckupNotes] = useState('Patient comfortable, vitals stable.');

  const [doseMedName, setDoseMedName] = useState('Saline Normal Saline 500ml');
  const [doseAmount, setDoseAmount] = useState('1 Pack');
  const [doseType, setDoseType] = useState<'Medicine' | 'Saline' | 'Injection' | 'Drop'>('Saline');

  const [surgeryName, setSurgeryName] = useState('');
  const [surgeryCharge, setSurgeryCharge] = useState('');

  useEffect(() => {
    loadIpdRecords();
  }, []);

  useEffect(() => {
    if (initialPreFillAppointment) {
      setShowAddModal(true);
      const matchedWard = WARD_OPTIONS.find(w => w.value === initialPreFillAppointment.recommended_ward) || WARD_OPTIONS[2];
      setNewIpdForm({
        patient_name: initialPreFillAppointment.user_name || '',
        patient_code: initialPreFillAppointment.patient_code || `SKMH-${new Date().getFullYear()}-PAT-${Math.floor(100 + Math.random() * 900)}`,
        phone: initialPreFillAppointment.user_phone || '',
        doctor_name: initialPreFillAppointment.doctor_name || 'Dr. Tushar Patel',
        doctor_specialty: `${initialPreFillAppointment.department} Specialist`,
        department: initialPreFillAppointment.department || 'Orthopedics',
        ward_type: matchedWard.value as any,
        bed_number: `Bed ${matchedWard.value.substr(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`,
        diagnosis_at_admission: initialPreFillAppointment.diagnosis || initialPreFillAppointment.admission_reason || 'Inpatient admission advised by consulting doctor.',
        daily_bed_charge: matchedWard.charge,
        selected_extra_services: [EXTRA_SERVICE_OPTIONS[0], EXTRA_SERVICE_OPTIONS[1]],
        advance_paid: 5000
      });
    }
  }, [initialPreFillAppointment]);

  const loadIpdRecords = async () => {
    try {
      const records = await api.getAdmittedPatients();
      setIpdList(records);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWardSelectChange = (wardVal: string) => {
    const found = WARD_OPTIONS.find(w => w.value === wardVal);
    if (found) {
      setNewIpdForm(prev => ({
        ...prev,
        ward_type: found.value as any,
        daily_bed_charge: found.charge,
        bed_number: `Bed ${found.value.substr(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`
      }));
    }
  };

  const handleToggleExtraService = (service: { name: string; daily_charge: number }) => {
    setNewIpdForm(prev => {
      const exists = prev.selected_extra_services.some(s => s.name === service.name);
      if (exists) {
        return { ...prev, selected_extra_services: prev.selected_extra_services.filter(s => s.name !== service.name) };
      } else {
        return { ...prev, selected_extra_services: [...prev.selected_extra_services, service] };
      }
    });
  };

  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpdForm.patient_name.trim()) return;

    try {
      const created = await api.addAdmittedPatient({
        patient_id: `pat-${Date.now()}`,
        patient_name: newIpdForm.patient_name.trim(),
        patient_code: newIpdForm.patient_code,
        phone: newIpdForm.phone || '+91 98000 11111',
        doctor_id: 'doc-1',
        doctor_name: newIpdForm.doctor_name,
        doctor_specialty: newIpdForm.doctor_specialty,
        department: newIpdForm.department,
        ward_type: newIpdForm.ward_type,
        bed_number: newIpdForm.bed_number,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'Admitted',
        diagnosis_at_admission: newIpdForm.diagnosis_at_admission,
        daily_bed_charge: newIpdForm.daily_bed_charge,
        extra_services: newIpdForm.selected_extra_services,
        is_locked: true, // LOCKED POST-ADMISSION (No edits permissible)
        appointment_id: initialPreFillAppointment?.id,
        daily_routine_checkups: [],
        daily_doses: [],
        surgeries_performed: [],
        total_paid_amount: newIpdForm.advance_paid
      });

      setIpdList(prev => [created, ...prev]);
      setShowAddModal(false);
      setSelectedIpd(created);
      setViewMode('details');
    } catch (err) {
      console.error(err);
      alert('Error creating admission record.');
    }
  };

  const handleDischargePatient = async () => {
    if (!selectedIpd) return;
    if (!confirm(`Are you sure doctor has cleared patient ${selectedIpd.patient_name} for discharge & completed treatment?`)) return;

    const today = new Date().toISOString().split('T')[0];
    const updated: AdmittedPatientRecord = {
      ...selectedIpd,
      status: 'Discharged',
      discharge_date: today
    };

    await api.updateAdmittedPatient(updated);
    setSelectedIpd(updated);
    loadIpdRecords();
    alert(`Patient ${selectedIpd.patient_name} successfully discharged by Doctor! Receptionist can now raise final billing.`);
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
      given_by: selectedIpd.doctor_name
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
                Receptionist Admission Processing, Locked Ward Room Details, Doctor Treatment Sheets & Final Discharges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'list' ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> New Receptionist Admission Form
              </button>
            ) : (
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ← Back to IPD Patients List
              </button>
            )}

            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
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
                const extraDailyTotal = (ipd.extra_services || []).reduce((acc, s) => acc + s.daily_charge, 0) * days;
                const surgTotal = ipd.surgeries_performed.reduce((acc, s) => acc + s.charge, 0);
                const grandTotal = bedTotal + extraDailyTotal + surgTotal;

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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        ipd.status === 'Discharged' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ipd.ward_type} • {ipd.bed_number}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{ipd.patient_code}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                          {ipd.patient_name}
                        </h3>
                        {ipd.status === 'Discharged' ? (
                          <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-extrabold px-2 py-0.5 rounded-full">
                            Discharged
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full">
                            Under Treatment
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Doctor: <strong>{ipd.doctor_name}</strong> ({ipd.department})</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">"{ipd.diagnosis_at_admission}"</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Admitted Stay</span>
                        <strong className="text-slate-800 font-extrabold">{days} Days ({ipd.admission_date})</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Est. Charges</span>
                        <strong className="text-emerald-700 font-black text-sm">₹{grandTotal.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: SELECTED IPD DETAILS & DOCTOR TREATMENT SHEET */}
        {viewMode === 'details' && selectedIpd && (
          <div className="space-y-6">
            
            {/* Patient Header & Doctor Details Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-400/30">
                      {selectedIpd.ward_type} • {selectedIpd.bed_number}
                    </span>
                    <span className="text-xs font-mono text-slate-300">{selectedIpd.patient_code}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-mono flex items-center gap-1 border border-slate-700">
                      <Lock className="w-3 h-3 text-amber-400" /> Room Facilities Locked
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{selectedIpd.patient_name}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Attending Doctor: <strong className="text-emerald-400">{selectedIpd.doctor_name}</strong> ({selectedIpd.department}) • Phone: {selectedIpd.phone}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedIpd.status === 'Admitted' && (
                    <button
                      type="button"
                      onClick={handleDischargePatient}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                      title="Doctor Discharge Action - Clear Patient & Complete Treatment"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" /> Complete Treatment & Discharge
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBillingReceipt) {
                        onOpenBillingReceipt(selectedIpd);
                      } else {
                        setViewMode('discharge_summary');
                      }
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <FileText className="w-4 h-4" /> Raise Final IPD Bill & Receipt
                  </button>
                </div>
              </div>

              {/* Locked Ward Details Info Pill */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Room Facility Dropdown Locked:</strong> {selectedIpd.ward_type} (Rate: ₹{selectedIpd.daily_bed_charge}/day) • Admitted On: {selectedIpd.admission_date} ({calculateDaysAdmitted(selectedIpd.admission_date)} Days Stay).
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider hidden sm:inline">Post-Admission Locked</span>
              </div>
            </div>

            {/* DOCTOR TREATMENT SHEET - DAY BASIS DIAGNOSIS & DAILY DOSES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Routine Daily Checkups & Day-Basis Diagnosis */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-600" /> Day-Basis Diagnosis & Daily Vitals Log
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">Doctor Treatment Sheet</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input type="text" placeholder="BP (120/80 mmHg)" value={checkupBp} onChange={(e) => setCheckupBp(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold" />
                  <input type="text" placeholder="Pulse (72 bpm)" value={checkupPulse} onChange={(e) => setCheckupPulse(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold" />
                  <input type="text" placeholder="Temp (98.6 °F)" value={checkupTemp} onChange={(e) => setCheckupTemp(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold" />
                  <input type="text" placeholder="Sugar (110 mg/dL)" value={checkupSugar} onChange={(e) => setCheckupSugar(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold" />
                </div>

                <div className="flex gap-2">
                  <input type="text" placeholder="Day Diagnosis / Clinical Notes (e.g. Fever reduced, patient recovering)" value={checkupNotes} onChange={(e) => setCheckupNotes(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium" />
                  <button onClick={handleAddCheckup} className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow">
                    <Plus className="w-3.5 h-3.5" /> Log Day Checkup
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pt-2 border-t border-slate-200">
                  {selectedIpd.daily_routine_checkups.map((chk) => (
                    <div key={chk.id} className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{chk.date} ({chk.time})</span>
                        <span className="text-emerald-700">BP: {chk.bp} • Temp: {chk.temp}</span>
                      </div>
                      <p className="text-slate-700 font-semibold italic">"{chk.notes}"</p>
                      <p className="text-[10px] text-slate-400">Recorded by: {chk.doctor_or_nurse}</p>
                    </div>
                  ))}
                  {selectedIpd.daily_routine_checkups.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No daily checkups logged yet.</p>
                  )}
                </div>
              </div>

              {/* Medication, Saline & Injection Doses */}
              <div className="space-y-3 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                    <Syringe className="w-4 h-4 text-emerald-700" /> Administered Dose Details (Saline / Rx / Injections)
                  </h3>
                  <span className="text-[10px] text-emerald-800 font-bold">Daily Dose Sheet</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input type="text" placeholder="Medicine / Saline Name" value={doseMedName} onChange={(e) => setDoseMedName(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-bold" />
                  <input type="text" placeholder="Amount (e.g. 1 Pack / 500ml)" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 bg-white font-semibold" />
                </div>

                <div className="flex gap-2">
                  <select value={doseType} onChange={(e) => setDoseType(e.target.value as any)} className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800">
                    <option value="Saline">Saline</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Injection">Injection</option>
                    <option value="Drop">Drop</option>
                  </select>
                  <button onClick={handleAddDose} className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow">
                    <Plus className="w-3.5 h-3.5" /> Log Given Dose
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pt-2 border-t border-emerald-200">
                  {selectedIpd.daily_doses.map((d) => (
                    <div key={d.id} className="bg-white p-3 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{d.medicine_name} ({d.dose_amount})</span>
                        <span className="text-[10px] text-slate-500">{d.date} at {d.time} • Prescribed by: {d.given_by}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                        {d.type}
                      </span>
                    </div>
                  ))}
                  {selectedIpd.daily_doses.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No daily doses logged yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Surgery & OT Log */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> Surgical Operations & OT Procedures
              </h3>

              <div className="flex gap-2">
                <input type="text" placeholder="Surgery Procedure Name (e.g. Arthroscopic Knee Surgery)" value={surgeryName} onChange={(e) => setSurgeryName(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium" />
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
                  <strong className="text-sm font-extrabold text-emerald-700">{selectedIpd.discharge_date || new Date().toISOString().split('T')[0]}</strong>
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

        {/* MODAL: RECEPTIONIST ADMISSION FORM WITH ROOM FACILITY DROPDOWN */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
              
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Receptionist IPD Desk
                  </span>
                  <h3 className="font-black text-slate-900 text-base mt-0.5">Fill Inpatient Admission Form</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmission} className="space-y-4 text-xs">
                
                {/* Doctor Details (Read-Only / Display) */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase">Doctor In-Charge</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">{newIpdForm.department}</span>
                  </div>
                  <h4 className="text-sm font-black text-white">{newIpdForm.doctor_name}</h4>
                  <p className="text-[11px] text-slate-300">{newIpdForm.doctor_specialty}</p>
                </div>

                {/* Patient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newIpdForm.patient_name}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, patient_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98000 11111"
                      value={newIpdForm.phone}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* ROOM FACILITY OPTION (DROPDOWN - LOCKED AFTER ADMISSION) */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block font-black text-emerald-950 uppercase tracking-wider text-xs">
                      Select Room / Ward Facility *
                    </label>
                    <span className="text-[10px] text-emerald-800 font-bold">Rate / Day</span>
                  </div>

                  <select
                    value={newIpdForm.ward_type}
                    onChange={(e) => handleWardSelectChange(e.target.value)}
                    className="w-full p-3 rounded-xl border border-emerald-300 font-black text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm"
                  >
                    {WARD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — ₹{opt.charge.toLocaleString()} / Day
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Assigned Bed No</span>
                      <input
                        type="text"
                        value={newIpdForm.bed_number}
                        onChange={(e) => setNewIpdForm({ ...newIpdForm, bed_number: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Daily Room Charge</span>
                      <div className="p-2 rounded-xl border border-emerald-300 bg-white font-black text-emerald-800">
                        ₹{newIpdForm.daily_bed_charge.toLocaleString()} / Day
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-emerald-900 italic font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> Note: Room facility selection becomes strictly locked after admission confirmation.
                  </p>
                </div>

                {/* ADDITIONAL SERVICES & AMENITIES */}
                <div className="space-y-2">
                  <label className="block font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                    Additional Ward Services & Amenities
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXTRA_SERVICE_OPTIONS.map((srv) => {
                      const isSelected = newIpdForm.selected_extra_services.some(s => s.name === srv.name);
                      return (
                        <button
                          type="button"
                          key={srv.name}
                          onClick={() => handleToggleExtraService(srv)}
                          className={`p-2.5 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <p className="text-[11px] font-bold">{srv.name}</p>
                            <span className="text-[9px] opacity-80">+₹{srv.daily_charge}/day</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DIAGNOSIS & ADVANCE DEPOSIT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">Clinical Reason for Admission</label>
                    <input
                      type="text"
                      placeholder="Primary Clinical Reason"
                      value={newIpdForm.diagnosis_at_admission}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, diagnosis_at_admission: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      value={newIpdForm.advance_paid}
                      onChange={(e) => setNewIpdForm({ ...newIpdForm, advance_paid: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-emerald-700"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer">
                    <BedDouble className="w-4 h-4" /> Confirm Admission & Lock Room
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
