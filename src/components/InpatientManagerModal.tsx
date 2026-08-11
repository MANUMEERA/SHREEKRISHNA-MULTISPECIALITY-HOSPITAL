import React, { useState, useEffect } from 'react';
import { AdmittedPatientRecord, IPDDailyRoutineCheckup, IPDDailyDose, IPDSurgeryRecord, Appointment } from '../types';
import { api } from '../lib/api';
import { WardRoomChargesManagerSection } from './WardRoomChargesManagerSection';
import { X, BedDouble, Plus, Trash2, Printer, Download, HeartPulse, Activity, Syringe, Pill, Stethoscope, FileText, CheckCircle2, ShieldCheck, Lock, DollarSign, Calendar, User, UserCheck, AlertCircle, Settings } from 'lucide-react';

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
  const [showChargesManagerModal, setShowChargesManagerModal] = useState<boolean>(false);

  // Available Ward Types & Rates Master
  const [wardOptionsList, setWardOptionsList] = useState<Array<{ label: string; value: string; charge: number }>>([
    { label: 'General Ward Bed', value: 'General Ward', charge: 1000 },
    { label: 'Semi-Private Room', value: 'Semi-Private Room', charge: 1800 },
    { label: 'Deluxe AC Ward Room', value: 'Deluxe Ward', charge: 2500 },
    { label: 'Super Deluxe Suite', value: 'Super Deluxe Suite', charge: 4500 },
    { label: 'ICU Critical Care Unit', value: 'ICU Critical Care', charge: 6000 }
  ]);

  // Additional Ward Services & Amenities Options List
  const [extraServiceOptionsList, setExtraServiceOptionsList] = useState<Array<{ name: string; daily_charge: number }>>([
    { name: 'Diet & Nutrition Meal Service', daily_charge: 350 },
    { name: 'Continuous Nursing Care Level', daily_charge: 500 },
    { name: 'Oxygen Line Support', daily_charge: 800 },
    { name: 'Attendant Sofa Bedding & Couch', daily_charge: 300 }
  ]);

  // Custom Amenity Modal State
  const [showAddCustomAmenityModal, setShowAddCustomAmenityModal] = useState(false);
  const [customAmenityName, setCustomAmenityName] = useState('');
  const [customAmenityCharge, setCustomAmenityCharge] = useState('');

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

  const loadWardRates = async () => {
    try {
      const categories = await api.getChargeCategories();
      const wardCategories = categories.filter(c => 
        c.category_name === 'Ward Stay' || 
        c.category_name === 'ICU Stay' || 
        c.department === 'Inpatient (IPD)' || 
        c.department === 'Critical Care' ||
        c.service_name.toLowerCase().includes('ward') ||
        c.service_name.toLowerCase().includes('room') ||
        c.service_name.toLowerCase().includes('suite') ||
        c.service_name.toLowerCase().includes('icu')
      );
      if (wardCategories.length > 0) {
        setWardOptionsList(wardCategories.map(c => ({
          label: `${c.service_name}`,
          value: c.service_name,
          charge: c.charge_amount
        })));
      }

      const amenityCategories = categories.filter(c =>
        c.category_name === 'Amenities & Services' ||
        c.category_name === 'Nursing / Care' ||
        c.category_name === 'Other'
      );
      if (amenityCategories.length > 0) {
        const loadedAmenities = amenityCategories.map(c => ({
          name: c.service_name,
          daily_charge: c.charge_amount
        }));
        setExtraServiceOptionsList(prev => {
          const combined = [...prev];
          loadedAmenities.forEach(item => {
            if (!combined.some(c => c.name.toLowerCase() === item.name.toLowerCase())) {
              combined.push(item);
            }
          });
          return combined;
        });
      }
    } catch (err) {
      console.error('Failed to load ward rates and amenities', err);
    }
  };

  const handleCreateCustomAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmenityName.trim() || !customAmenityCharge) return;
    const chargeVal = parseFloat(customAmenityCharge) || 0;
    const newAmenity = { name: customAmenityName.trim(), daily_charge: chargeVal };

    setExtraServiceOptionsList(prev => [...prev, newAmenity]);
    setNewIpdForm(prev => ({
      ...prev,
      selected_extra_services: [...prev.selected_extra_services, newAmenity]
    }));

    if (selectedIpd) {
      const current = selectedIpd.extra_services || [];
      const updatedExtra = [...current, newAmenity];
      const updatedIpd = { ...selectedIpd, extra_services: updatedExtra };
      await api.updateAdmittedPatient(updatedIpd);
      setSelectedIpd(updatedIpd);
      loadIpdRecords();
    }

    try {
      await api.addChargeCategory({
        service_name: newAmenity.name,
        category_name: 'Amenities & Services',
        charge_amount: newAmenity.daily_charge,
        department: 'Inpatient (IPD)',
        description: 'Custom ward service amenity'
      });
    } catch (err) {
      console.error(err);
    }

    setCustomAmenityName('');
    setCustomAmenityCharge('');
    setShowAddCustomAmenityModal(false);
  };

  const handleDeleteAmenityOption = async (amenityName: string) => {
    if (!confirm(`Delete "${amenityName}" from additional services options?`)) return;
    setExtraServiceOptionsList(prev => prev.filter(s => s.name !== amenityName));
    setNewIpdForm(prev => ({
      ...prev,
      selected_extra_services: prev.selected_extra_services.filter(s => s.name !== amenityName)
    }));
  };

  const handleToggleSelectedIpdExtraService = async (service: { name: string; daily_charge: number }) => {
    if (!selectedIpd) return;
    const current = selectedIpd.extra_services || [];
    const exists = current.some(s => s.name === service.name);
    const updatedServices = exists
      ? current.filter(s => s.name !== service.name)
      : [...current, service];

    const updatedIpd = {
      ...selectedIpd,
      extra_services: updatedServices
    };

    await api.updateAdmittedPatient(updatedIpd);
    setSelectedIpd(updatedIpd);
    loadIpdRecords();
  };

  useEffect(() => {
    loadIpdRecords();
    loadWardRates();
  }, []);

  useEffect(() => {
    if (initialPreFillAppointment) {
      setShowAddModal(true);
      const matchedWard = wardOptionsList.find(w => w.value === initialPreFillAppointment.recommended_ward || w.label === initialPreFillAppointment.recommended_ward) || wardOptionsList[2] || wardOptionsList[0];
      setNewIpdForm({
        patient_name: initialPreFillAppointment.user_name || '',
        patient_code: initialPreFillAppointment.patient_code || `SKMH-${new Date().getFullYear()}-PAT-${Math.floor(100 + Math.random() * 900)}`,
        phone: initialPreFillAppointment.user_phone || '',
        doctor_name: initialPreFillAppointment.doctor_name || 'Dr. Tushar Patel',
        doctor_specialty: `${initialPreFillAppointment.department} Specialist`,
        department: initialPreFillAppointment.department || 'Orthopedics',
        ward_type: matchedWard ? matchedWard.value as any : 'Deluxe Ward',
        bed_number: `Bed ${matchedWard ? matchedWard.value.substr(0, 2).toUpperCase() : 'DLX'}-${Math.floor(100 + Math.random() * 899)}`,
        diagnosis_at_admission: initialPreFillAppointment.diagnosis || initialPreFillAppointment.admission_reason || 'Inpatient admission advised by consulting doctor.',
        daily_bed_charge: matchedWard ? matchedWard.charge : 2500,
        selected_extra_services: extraServiceOptionsList.slice(0, 2),
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
    const found = wardOptionsList.find(w => w.value === wardVal || w.label === wardVal);
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-7xl w-full shadow-2xl my-auto print:shadow-none print:m-0 print:w-full print:max-w-none print:p-4 border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
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
            <button
              type="button"
              onClick={() => setShowChargesManagerModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all border border-slate-700"
              title="Manage Ward Room Rates & Hospital Charges Master (Add, Edit, Delete)"
            >
              <BedDouble className="w-4 h-4 text-emerald-400" />
              <span>⚙️ Room & Ward Charges Master</span>
            </button>

            {viewMode === 'list' ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> New Receptionist Admission Form
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ← Back to IPD Patients List
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0">

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

            {/* ADDITIONAL WARD SERVICES & AMENITIES ASSIGNED TO ACTIVE PATIENT */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 shadow-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Assigned Additional Ward Services & Amenities
                  </h3>
                  <p className="text-[10px] text-slate-400">Toggle or add amenities to assign daily service charges to this patient</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomAmenityModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Custom Amenity
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {extraServiceOptionsList.map((srv) => {
                  const isAssigned = (selectedIpd.extra_services || []).some(s => s.name === srv.name);
                  return (
                    <button
                      type="button"
                      key={srv.name}
                      onClick={() => handleToggleSelectedIpdExtraService(srv)}
                      className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                        isAssigned
                          ? 'bg-emerald-950 text-white border-emerald-500/60 font-bold shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">{srv.name}</p>
                        <span className={`text-[10px] font-mono ${isAssigned ? 'text-emerald-300' : 'text-slate-400'}`}>
                          +₹{srv.daily_charge.toLocaleString()} / day
                        </span>
                      </div>
                      {isAssigned ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 hover:text-white">
                          + Assign
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* MODE 3: PRINTABLE DISCHARGE SUMMARY & ITEMIZED FINANCIAL BILL */}
        {viewMode === 'discharge_summary' && selectedIpd && (() => {
          const days = calculateDaysAdmitted(selectedIpd.admission_date);
          const roomSubtotal = days * selectedIpd.daily_bed_charge;
          const extraServicesList = selectedIpd.extra_services || [];
          const extraSubtotal = extraServicesList.reduce((acc, s) => acc + (s.daily_charge * days), 0);
          const surgerySubtotal = selectedIpd.surgeries_performed.reduce((acc, s) => acc + s.charge, 0);
          const grossTotal = roomSubtotal + extraSubtotal + surgerySubtotal;
          const advancePaid = selectedIpd.advance_paid || selectedIpd.total_paid_amount || 0;
          const netPayable = grossTotal - advancePaid;

          return (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-slate-600">Official Hospital Discharge Summary & Final Financial Bill Statement</span>
                <button
                  onClick={handlePrint}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" /> Print / Export PDF Discharge Summary & Bill
                </button>
              </div>

              <div className="border-2 border-slate-900 p-8 rounded-3xl space-y-6 bg-white text-slate-900">
                
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">SHREE KRISHNA MULTISPECIALITY HOSPITAL</h1>
                    <p className="text-xs font-bold text-slate-700">Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230 (UT) • 24x7 Critical Care & OT Unit</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider">
                      DISCHARGE SUMMARY & BILL
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

                {/* FINANCIAL IPD BILL & HOSPITAL CHARGES BREAKDOWN */}
                <div className="space-y-3 pt-4 border-t-2 border-slate-900">
                  <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-2xl">
                    <h4 className="font-extrabold uppercase text-xs tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Itemized Hospital IPD Financial Bill Statement
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      Bill Ref: IPD-INV-{selectedIpd.patient_code}
                    </span>
                  </div>

                  {/* SECTION 1: WARD ROOM & BED CHARGES */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 font-black text-[11px] uppercase text-slate-800 border-b border-slate-300">
                      SECTION 1: Ward & Room Bed Stay Charges
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="p-2.5">Room / Ward Facility</th>
                          <th className="p-2.5">Bed No</th>
                          <th className="p-2.5">Daily Rate</th>
                          <th className="p-2.5">Days Stayed</th>
                          <th className="p-2.5 text-right">Subtotal (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200 font-semibold">
                          <td className="p-2.5 font-bold">{selectedIpd.ward_type}</td>
                          <td className="p-2.5 font-mono">{selectedIpd.bed_number}</td>
                          <td className="p-2.5 font-mono">₹{selectedIpd.daily_bed_charge.toLocaleString()} / day</td>
                          <td className="p-2.5 font-bold">{days} Days</td>
                          <td className="p-2.5 text-right font-black text-slate-900">₹{roomSubtotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* SECTION 2: ADDITIONAL WARD SERVICES & AMENITIES */}
                  <div className="border border-slate-300 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 font-black text-[11px] uppercase text-slate-800 border-b border-slate-300 flex justify-between items-center">
                      <span>SECTION 2: Additional Ward Services & Amenities Breakdown</span>
                      <span className="text-[10px] text-slate-600 font-mono">({extraServicesList.length} Services Selected)</span>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="p-2.5">Service / Amenity Name</th>
                          <th className="p-2.5">Daily Charge Rate</th>
                          <th className="p-2.5">Days Stayed</th>
                          <th className="p-2.5 text-right">Subtotal Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraServicesList.length > 0 ? (
                          extraServicesList.map((srv, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-900">• {srv.name}</td>
                              <td className="p-2.5 font-mono text-slate-700">₹{srv.daily_charge.toLocaleString()} / day</td>
                              <td className="p-2.5 font-bold">{days} Days</td>
                              <td className="p-2.5 text-right font-black text-slate-900">
                                ₹{(srv.daily_charge * days).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-3 text-slate-500 italic text-center">
                              No additional ward amenities subscribed for this stay.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {extraServicesList.length > 0 && (
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-xs">
                          <tr>
                            <td colSpan={3} className="p-2.5 text-right font-extrabold uppercase">
                              Total Additional Services Subtotal:
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900">
                              ₹{extraSubtotal.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* SECTION 3: SURGICAL PROCEDURES & OT CHARGES */}
                  {selectedIpd.surgeries_performed.length > 0 && (
                    <div className="border border-slate-300 rounded-2xl overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 font-black text-[11px] uppercase text-slate-800 border-b border-slate-300">
                        SECTION 3: Surgical Procedures & OT Operations
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                          <tr>
                            <th className="p-2.5">Procedure Name</th>
                            <th className="p-2.5">Surgeon</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5 text-right">OT Fee (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedIpd.surgeries_performed.map((s) => (
                            <tr key={s.id} className="border-b border-slate-200 font-semibold">
                              <td className="p-2.5 font-bold text-slate-900">{s.surgery_name}</td>
                              <td className="p-2.5 text-slate-700">{s.surgeon_name}</td>
                              <td className="p-2.5 font-mono">{s.date}</td>
                              <td className="p-2.5 text-right font-black text-slate-900">₹{s.charge.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* GRAND TOTAL SUMMARY & NET PAYABLE BOX */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Room & Ward Stay Subtotal:</span>
                      <span className="font-mono font-bold text-white">₹{roomSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Additional Services & Amenities Subtotal:</span>
                      <span className="font-mono font-bold text-white">₹{extraSubtotal.toLocaleString()}</span>
                    </div>
                    {surgerySubtotal > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">Surgical & OT Operations Subtotal:</span>
                        <span className="font-mono font-bold text-white">₹{surgerySubtotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-700">
                      <span className="text-slate-300 font-bold uppercase">Gross Hospital Bill Amount:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">₹{grossTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-300 font-bold uppercase">Less Advance Deposit Paid:</span>
                      <span className="font-mono font-bold text-amber-300">- ₹{advancePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t-2 border-emerald-500 bg-emerald-950/60 p-3 rounded-xl">
                      <div>
                        <span className="font-black text-white uppercase tracking-wider block">NET AMOUNT PAYABLE BY PATIENT</span>
                        <span className="text-[10px] text-emerald-300 font-medium">Final Discharged Settlement</span>
                      </div>
                      <strong className="text-xl font-black text-emerald-400 font-mono">
                        ₹{Math.max(0, netPayable).toLocaleString()}
                      </strong>
                    </div>
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
          );
        })()}
        </div>

        {/* MODAL: RECEPTIONIST ADMISSION FORM WITH ROOM FACILITY DROPDOWN */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
              
              {/* Dark Slate Top Header Bar with Close Icon (X) */}
              <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
                    <BedDouble className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                        Receptionist IPD Desk
                      </span>
                    </div>
                    <h3 className="font-black text-white text-base mt-0.5">Fill Inpatient Admission Form</h3>
                    <p className="text-xs text-slate-400">Assign ward bed, daily room rates, and additional patient amenities</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-sm"
                  title="Close Admission Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body with Padding */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                <form onSubmit={handleCreateAdmission} className="space-y-5 text-xs">
                  
                  {/* Doctor Details (Read-Only / Display) */}
                  <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-1 shadow-inner border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">Doctor In-Charge</span>
                      <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-slate-700">{newIpdForm.department}</span>
                    </div>
                    <h4 className="text-sm font-black text-white">{newIpdForm.doctor_name}</h4>
                    <p className="text-[11px] text-slate-300">{newIpdForm.doctor_specialty}</p>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={newIpdForm.patient_name}
                        onChange={(e) => setNewIpdForm({ ...newIpdForm, patient_name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
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
                        className="w-full p-3 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                      />
                    </div>
                  </div>

                  {/* ROOM FACILITY OPTION (DROPDOWN - LOCKED AFTER ADMISSION) */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block font-black text-emerald-950 uppercase tracking-wider text-xs">
                        Select Room / Ward Facility *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowChargesManagerModal(true)}
                        className="text-[10px] text-emerald-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className="w-3 h-3" /> Add / Edit Room Charges
                      </button>
                    </div>

                    <select
                      value={newIpdForm.ward_type}
                      onChange={(e) => handleWardSelectChange(e.target.value)}
                      className="w-full p-3 rounded-xl border border-emerald-300 font-black text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm"
                    >
                      {wardOptionsList.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — ₹{opt.charge.toLocaleString()} / Day
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Bed No</span>
                        <input
                          type="text"
                          value={newIpdForm.bed_number}
                          onChange={(e) => setNewIpdForm({ ...newIpdForm, bed_number: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Daily Room Charge</span>
                        <div className="p-2.5 rounded-xl border border-emerald-300 bg-white font-black text-emerald-800 text-xs">
                          ₹{newIpdForm.daily_bed_charge.toLocaleString()} / Day
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-emerald-900 italic font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" /> Note: Room facility selection becomes strictly locked after admission confirmation.
                    </p>
                  </div>

                  {/* ADDITIONAL WARD SERVICES & AMENITIES */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block font-black text-slate-900 uppercase tracking-wider text-xs">
                          Additional Ward Services & Amenities
                        </label>
                        <p className="text-[10px] text-slate-500">Selected services are added as individual sections in final bill</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomAmenityModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Custom Amenity
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {extraServiceOptionsList.map((srv) => {
                        const isSelected = newIpdForm.selected_extra_services.some(s => s.name === srv.name);
                        return (
                          <div
                            key={srv.name}
                            className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleExtraService(srv)}
                              className="flex-1 text-left cursor-pointer pr-2"
                            >
                              <p className="text-xs font-extrabold">{srv.name}</p>
                              <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-bold'}`}>
                                +₹{srv.daily_charge.toLocaleString()}/day
                              </span>
                            </button>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAmenityOption(srv.name);
                                }}
                                className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Amenity Option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
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
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer">
                      <BedDouble className="w-4 h-4" /> Confirm Admission & Lock Room
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: ADD CUSTOM AMENITY / SERVICE DIALOG */}
        {showAddCustomAmenityModal && (
          <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Add New Additional Ward Service / Amenity</h3>
                </div>
                <button onClick={() => setShowAddCustomAmenityModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomAmenity} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amenity / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxygen Support, Special Physiotherapy, Continuous Monitor"
                    value={customAmenityName}
                    onChange={(e) => setCustomAmenityName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Charge Rate (₹ / day) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    placeholder="e.g. 500"
                    value={customAmenityCharge}
                    onChange={(e) => setCustomAmenityCharge(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomAmenityModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                  >
                    Add Service & Select
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

                {/* ROOM & WARD CHARGES MASTER MANAGEMENT SUB-MODAL */}
        {showChargesManagerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Hospital Room, Ward & Service Charges Master</h3>
                    <p className="text-[11px] text-slate-400">Add, Edit, and Delete per-day ward bed rates and service charges.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChargesManagerModal(false);
                    loadWardRates();
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <WardRoomChargesManagerSection onChargesUpdated={loadWardRates} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
