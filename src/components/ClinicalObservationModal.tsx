import React, { useState, useEffect } from 'react';
import { Appointment, PrescribedMedicine, HigherReference, PatientVitals } from '../types';
import { X, Plus, Trash2, Stethoscope, Activity, Pill, FileCheck2, Share2, AlertCircle, Calendar, HeartPulse, User, Lock, Printer, ShieldCheck, BedDouble, Sparkles, Database, Check } from 'lucide-react';
import { api } from '../lib/api';

interface ClinicalObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (aptId: string, observationData: {
    vitals?: PatientVitals;
    diagnosis?: string;
    prescribed_medicines?: PrescribedMedicine[];
    recommended_tests?: string[];
    higher_reference?: HigherReference;
    follow_up_date?: string;
    notes?: string;
    recommend_admission?: boolean;
    admission_reason?: string;
    recommended_ward?: string;
  }) => Promise<void>;
  readOnly?: boolean;
  onOpenPrintSlip?: (apt: Appointment) => void;
}

export const ClinicalObservationModal: React.FC<ClinicalObservationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave,
  readOnly = false,
  onOpenPrintSlip
}) => {
  if (!isOpen || !appointment) return null;

  // Form State
  const [vitals, setVitals] = useState<PatientVitals>({
    blood_pressure: appointment.vitals?.blood_pressure || '120/80 mmHg',
    pulse_rate: appointment.vitals?.pulse_rate || '72 bpm',
    temperature: appointment.vitals?.temperature || '98.6 °F',
    spo2: appointment.vitals?.spo2 || '99%',
    weight_kg: appointment.vitals?.weight_kg || '68',
    fasting_sugar: appointment.vitals?.fasting_sugar || '95 mg/dL',
    pp_sugar: appointment.vitals?.pp_sugar || '135 mg/dL',
    random_sugar: appointment.vitals?.random_sugar || '110 mg/dL'
  });

  const [availableMedicines, setAvailableMedicines] = useState<string[]>([]);
  const [availableTestsMaster, setAvailableTestsMaster] = useState<string[]>([]);

  useEffect(() => {
    api.getMedicines().then(list => {
      setAvailableMedicines(list.map(m => m.name));
    }).catch(console.error);

    api.getDiagnosticTests().then(list => {
      setAvailableTestsMaster(list.map(t => t.test_name));
    }).catch(console.error);
  }, []);

  const [diagnosis, setDiagnosis] = useState<string>(
    appointment.diagnosis || ''
  );

  const [medicines, setMedicines] = useState<PrescribedMedicine[]>(
    appointment.prescribed_medicines || [
      {
        id: `med-${Date.now()}-1`,
        name: 'Tab. Paracetamol (500mg)',
        dosage: '1 Nos',
        frequency: '1-0-1 (Twice Daily)',
        duration: '5 Days',
        instructions: 'After meals'
      }
    ]
  );

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Nos');
  const [newMedFreq, setNewMedFreq] = useState('1-0-1 (Twice Daily)');
  const [newMedDuration, setNewMedDuration] = useState('5 Days');
  const [newMedInstruct, setNewMedInstruct] = useState('After meals');

  const [recommendedTests, setRecommendedTests] = useState<string[]>(
    appointment.recommended_tests || ['Complete Blood Count (CBC)']
  );
  const [newTestInput, setNewTestInput] = useState('');

  // Higher Reference / Tertiary Center Referral State
  const [hasHigherReferral, setHasHigherReferral] = useState<boolean>(
    !!appointment.higher_reference
  );

  const [referralData, setReferralData] = useState<HigherReference>({
    referred_to_hospital: appointment.higher_reference?.referred_to_hospital || 'Civil Hospital Surat / Super Specialty Center',
    specialist_center: appointment.higher_reference?.specialist_center || 'Department of Cardiology & Cardiovascular Surgery',
    referral_reason: appointment.higher_reference?.referral_reason || 'For higher tertiary diagnostic evaluation & intervention',
    urgency: appointment.higher_reference?.urgency || 'Routine',
    reference_date: appointment.higher_reference?.reference_date || new Date().toISOString().split('T')[0],
    doctor_signature_notes: appointment.higher_reference?.doctor_signature_notes || `${appointment.doctor_name} - Senior Medical Specialist`
  });

  const [followUpDate, setFollowUpDate] = useState<string>(
    appointment.follow_up_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [notes, setNotes] = useState<string>(
    appointment.notes || ''
  );

  // Recommend Inpatient Ward Admission (IPD)
  const [recommendAdmission, setRecommendAdmission] = useState<boolean>(
    appointment.recommend_admission || false
  );
  const [admissionReason, setAdmissionReason] = useState<string>(
    appointment.admission_reason || 'Inpatient admission recommended for continuous clinical observation & IV treatment.'
  );
  const [recommendedWard, setRecommendedWard] = useState<string>(
    appointment.recommended_ward || 'Deluxe Ward'
  );

  const [submitting, setSubmitting] = useState(false);

  const [isSavingCustomMed, setIsSavingCustomMed] = useState(false);
  const [customMedSuccessMsg, setCustomMedSuccessMsg] = useState('');

  // Check if typed newMedName is not in master dropdown
  const isMedNotInMaster = newMedName.trim().length > 1 && !availableMedicines.some(
    m => m.toLowerCase().trim() === newMedName.trim().toLowerCase()
  );

  const handleSaveCustomToMaster = async () => {
    const medName = newMedName.trim();
    if (!medName) return;
    setIsSavingCustomMed(true);
    try {
      await api.addMedicine({
        name: medName,
        category: medName.toLowerCase().includes('drop') ? 'Eye/Nasal Drops' : 'Pharmacy General',
        stock_count: 100,
        min_threshold: 10,
        unit: medName.toLowerCase().includes('drop') ? 'Vials/Bottles' : 'Strips/Pack',
        expiry_date: '2028-12-31',
        unit_price: 50,
        location: 'OPD Dispensary'
      });
      if (!availableMedicines.includes(medName)) {
        setAvailableMedicines(prev => [...prev, medName]);
      }
      setCustomMedSuccessMsg(`"${medName}" saved to master inventory!`);
      setTimeout(() => setCustomMedSuccessMsg(''), 3500);
    } catch (e) {
      console.error('Failed to save medicine to master list:', e);
    } finally {
      setIsSavingCustomMed(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedName.trim()) return;
    const medNameFormatted = newMedName.trim();
    const item: PrescribedMedicine = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: medNameFormatted,
      dosage: newMedDosage,
      frequency: newMedFreq,
      duration: newMedDuration,
      instructions: newMedInstruct
    };
    setMedicines(prev => [...prev, item]);

    // Auto-save new medicine to master list if not existing
    const exists = availableMedicines.some(
      m => m.toLowerCase().trim() === medNameFormatted.toLowerCase()
    );
    if (!exists) {
      try {
        await api.addMedicine({
          name: medNameFormatted,
          category: medNameFormatted.toLowerCase().includes('drop') ? 'Eye/Nasal Drops' : 'Pharmacy General',
          stock_count: 100,
          min_threshold: 10,
          unit: medNameFormatted.toLowerCase().includes('drop') ? 'Vials/Bottles' : 'Strips/Pack',
          expiry_date: '2028-12-31',
          unit_price: 50,
          location: 'OPD Dispensary'
        });
        setAvailableMedicines(prev => [...prev, medNameFormatted]);
      } catch (e) {
        console.error('Error auto-storing custom medicine:', e);
      }
    }

    setNewMedName('');
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const handleAddTest = () => {
    if (!newTestInput.trim()) return;
    if (!recommendedTests.includes(newTestInput.trim())) {
      setRecommendedTests(prev => [...prev, newTestInput.trim()]);
    }
    setNewTestInput('');
  };

  const handleRemoveTest = (testName: string) => {
    setRecommendedTests(prev => prev.filter(t => t !== testName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis or primary observation.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(appointment.id, {
        vitals,
        diagnosis,
        prescribed_medicines: medicines,
        recommended_tests: recommendedTests,
        higher_reference: hasHigherReferral ? referralData : undefined,
        follow_up_date: followUpDate,
        notes,
        recommend_admission: recommendAdmission,
        admission_reason: recommendAdmission ? admissionReason : undefined,
        recommended_ward: recommendAdmission ? recommendedWard : undefined
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl my-auto border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                  Doctor Clinical Observation & OPD Slip
                </span>
                {appointment.patient_code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    {appointment.patient_code}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Consultation Record for {appointment.user_name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Doctor: <strong>{appointment.doctor_name}</strong> • Dept: {appointment.department} • Date: {appointment.appointment_date} ({appointment.time_slot})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

        {/* Read Only Notice Banner for Front Desk / Receptionist */}
        {readOnly && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-bold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Digitally Authenticated Doctor Prescription • Read-Only View</span>
            </div>
            {onOpenPrintSlip && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintSlip(appointment);
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" /> Print Consultation Slip
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: PATIENT VITALS & OBSERVATION */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-emerald-600" /> Patient Vitals On Visit
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="120/80 mmHg"
                  value={vitals.blood_pressure}
                  onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                  className={`w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold ${readOnly ? 'bg-slate-100 text-slate-800 font-extrabold cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulse Rate</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="72 bpm"
                  value={vitals.pulse_rate}
                  onChange={(e) => setVitals({ ...vitals, pulse_rate: e.target.value })}
                  className={`w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold ${readOnly ? 'bg-slate-100 text-slate-800 font-extrabold cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Body Temp</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="98.6 °F"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className={`w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold ${readOnly ? 'bg-slate-100 text-slate-800 font-extrabold cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">SpO2 Level</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="99%"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className={`w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold ${readOnly ? 'bg-slate-100 text-slate-800 font-extrabold cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (Kg)</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="68"
                  value={vitals.weight_kg}
                  onChange={(e) => setVitals({ ...vitals, weight_kg: e.target.value })}
                  className={`w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold ${readOnly ? 'bg-slate-100 text-slate-800 font-extrabold cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              {/* Blood Sugar Details */}
              <div className="bg-amber-50/60 p-1.5 rounded-xl border border-amber-200/80">
                <label className="block text-[10px] font-extrabold text-amber-900 uppercase">Fasting Sugar</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="95 mg/dL"
                  value={vitals.fasting_sugar}
                  onChange={(e) => setVitals({ ...vitals, fasting_sugar: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-950 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div className="bg-amber-50/60 p-1.5 rounded-xl border border-amber-200/80">
                <label className="block text-[10px] font-extrabold text-amber-900 uppercase">PP Sugar</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="135 mg/dL"
                  value={vitals.pp_sugar}
                  onChange={(e) => setVitals({ ...vitals, pp_sugar: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-950 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div className="bg-amber-50/60 p-1.5 rounded-xl border border-amber-200/80">
                <label className="block text-[10px] font-extrabold text-amber-900 uppercase">Random Sugar</label>
                <input
                  type="text"
                  disabled={readOnly}
                  placeholder="110 mg/dL"
                  value={vitals.random_sugar}
                  onChange={(e) => setVitals({ ...vitals, random_sugar: e.target.value })}
                  className={`w-full p-1.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-950 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIMARY DIAGNOSIS */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> Primary Clinical Diagnosis & Clinical Findings *
            </label>
            <textarea
              rows={2}
              required
              disabled={readOnly}
              placeholder="e.g. Acute Bronchitis with Wheezing / Grade II Knee Osteoarthritis with Joint Inflammation"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className={`w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 shadow-sm ${readOnly ? 'bg-slate-100 text-slate-900 font-bold cursor-not-allowed' : ''}`}
            />
          </div>

          {/* SECTION 3: PRESCRIBED MEDICINES */}
          <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-700" /> Prescribed Medicines ({medicines.length})
              </h3>
            </div>

            {/* Existing Prescriptions List */}
            {medicines.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5">Dosage</th>
                      <th className="p-2.5">Frequency</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Instructions</th>
                      {!readOnly && <th className="p-2.5 text-right">Remove</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicines.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                        <td className="p-2.5 text-slate-700">{m.dosage}</td>
                        <td className="p-2.5 font-semibold text-emerald-700">{m.frequency}</td>
                        <td className="p-2.5 text-slate-700">{m.duration}</td>
                        <td className="p-2.5 text-slate-500 italic">{m.instructions || '-'}</td>
                        {!readOnly && (
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(m.id)}
                              className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No medicines prescribed yet.</p>
            )}

            {/* Quick Add Medicine Form (Only for Doctor) */}
            {!readOnly && (
              <div className="space-y-3 pt-3 border-t border-emerald-200/60">
                
                {/* Custom Medicine Alert & Save Button if not in master list */}
                {isMedNotInMaster && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>"{newMedName.trim()}"</strong> is a custom medicine (Not in standard dropdown).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveCustomToMaster}
                      disabled={isSavingCustomMed}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] flex items-center gap-1 shadow cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Database className="w-3 h-3 text-emerald-300" />
                      {isSavingCustomMed ? 'Saving...' : 'Save to Hospital Master Inventory'}
                    </button>
                  </div>
                )}

                {customMedSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" /> {customMedSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Medicine Search / Name</label>
                      <span className="text-[9px] font-bold text-emerald-700">Type or select below</span>
                    </div>
                    <input
                      type="text"
                      list="medicine-suggestions"
                      placeholder="Search or Type Medicine Name..."
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-600 font-bold"
                    />
                    <datalist id="medicine-suggestions">
                      {availableMedicines.map((med, idx) => (
                        <option key={idx} value={med} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Drop or 1/2 Nos or 5 ml"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-emerald-950"
                    />
                    
                    {/* Quick Dosage Buttons: Oral vs Drops */}
                    <div className="mt-1.5 space-y-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-slate-400 mr-0.5">Oral:</span>
                        {['1/2 Nos', '1 Nos', '2 Nos', '5 ml', '10 ml'].map((doseVal) => (
                          <button
                            key={doseVal}
                            type="button"
                            onClick={() => setNewMedDosage(doseVal)}
                            className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-all cursor-pointer ${
                              newMedDosage === doseVal
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            {doseVal}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-blue-500 mr-0.5">Drops:</span>
                        {['1 Drop', '2 Drops', '3 Drops', '4 Drops', '5 Drops'].map((dropVal) => (
                          <button
                            key={dropVal}
                            type="button"
                            onClick={() => setNewMedDosage(dropVal)}
                            className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold transition-all cursor-pointer ${
                              newMedDosage === dropVal
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80'
                            }`}
                          >
                            {dropVal}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequency</label>
                    <select
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                    >
                      <option value="1-0-1 (Twice Daily)">1-0-1 (Twice Daily)</option>
                      <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                      <option value="1-0-0 (Once Daily Morning)">1-0-0 (Morning)</option>
                      <option value="0-0-1 (Once Daily Night)">0-0-1 (Night)</option>
                      <option value="1 Drop 3 times daily">1 Drop 3 times daily</option>
                      <option value="1 Drop 4 times daily">1 Drop 4 times daily</option>
                      <option value="2 Drops Twice Daily">2 Drops Twice Daily</option>
                      <option value="2 Drops 3 times daily">2 Drops 3 times daily</option>
                      <option value="Every 2 Hours (Eye Drop)">Every 2 Hours (Eye Drop)</option>
                      <option value="Every 4 Hours">Every 4 Hours</option>
                      <option value="SOS (As Needed)">SOS (As Needed)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="5 Days"
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-start pt-5">
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Rx
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Instruction:</span>
                  <select
                    value={newMedInstruct}
                    onChange={(e) => setNewMedInstruct(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium"
                  >
                    <option value="After meals">After meals</option>
                    <option value="Before meals">Before meals</option>
                    <option value="In Both Eyes (Eye Drops)">In Both Eyes (Eye Drops)</option>
                    <option value="In Left Eye (Eye Drops)">In Left Eye (Eye Drops)</option>
                    <option value="In Right Eye (Eye Drops)">In Right Eye (Eye Drops)</option>
                    <option value="In Both Nostrils (Nasal Drops)">In Both Nostrils (Nasal Drops)</option>
                    <option value="In Affected Ear (Ear Drops)">In Affected Ear (Ear Drops)</option>
                    <option value="With water">With water</option>
                    <option value="At bedtime">At bedtime</option>
                    <option value="On empty stomach">On empty stomach</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: RECOMMENDED DIAGNOSTIC TESTS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" /> Recommended Diagnostic Lab & Radiology Tests
            </label>

            <div className="flex flex-wrap gap-2 mb-2">
              {recommendedTests.map((test, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex items-center gap-2">
                  {test}
                  {!readOnly && (
                    <button type="button" onClick={() => handleRemoveTest(test)} className="text-blue-500 hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
              {recommendedTests.length === 0 && <span className="text-xs text-slate-400 italic">None recommended</span>}
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  list="test-suggestions"
                  placeholder="Search or type diagnostic test (e.g. Complete Blood Count, Chest X-Ray PA View)..."
                  value={newTestInput}
                  onChange={(e) => setNewTestInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <datalist id="test-suggestions">
                  {availableTestsMaster.map((tName, idx) => (
                    <option key={idx} value={tName} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={handleAddTest}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Test
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: HIGHER REFERENCE / TERTIARY CENTER REFERRAL */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-amber-900 text-xs uppercase">Higher Reference / Referral Details</h3>
                  <p className="text-[11px] text-amber-800">Refer patient to higher medical institute or specialized tertiary hospital</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={hasHigherReferral}
                  onChange={(e) => setHasHigherReferral(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-bold text-amber-900">{hasHigherReferral ? 'Referral Active' : 'No Referral'}</span>
              </label>
            </div>

            {hasHigherReferral && (
              <div className="space-y-3 pt-3 border-t border-amber-200/80 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Referred Hospital / Center Name</label>
                    <input
                      type="text"
                      disabled={readOnly}
                      required={hasHigherReferral}
                      placeholder="e.g. AIIMS New Delhi / Civil Hospital Surat"
                      value={referralData.referred_to_hospital}
                      onChange={(e) => setReferralData({ ...referralData, referred_to_hospital: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border border-amber-300 text-xs font-bold text-slate-900 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Department / Specialist Center</label>
                    <input
                      type="text"
                      disabled={readOnly}
                      placeholder="e.g. Advanced Cardiothoracic & Cath Lab Unit"
                      value={referralData.specialist_center}
                      onChange={(e) => setReferralData({ ...referralData, specialist_center: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border border-amber-300 text-xs ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Clinical Reason for Referral</label>
                    <input
                      type="text"
                      disabled={readOnly}
                      required={hasHigherReferral}
                      placeholder="e.g. Emergency coronary intervention & angiography required"
                      value={referralData.referral_reason}
                      onChange={(e) => setReferralData({ ...referralData, referral_reason: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border border-amber-300 text-xs ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Urgency Level</label>
                    <select
                      disabled={readOnly}
                      value={referralData.urgency}
                      onChange={(e) => setReferralData({ ...referralData, urgency: e.target.value as any })}
                      className={`w-full p-2.5 rounded-xl border border-amber-300 text-xs font-bold text-amber-900 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency Higher Referral">Emergency Higher Referral</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5.5: INPATIENT ADMISSION PRESCRIBED (IPD) */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-700" />
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-xs uppercase">Prescribe Inpatient Ward Admission (IPD)</h3>
                  <p className="text-[11px] text-indigo-800">Recommend hospital room admission for round-the-clock monitoring & treatment</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={recommendAdmission}
                  onChange={(e) => setRecommendAdmission(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-indigo-950">{recommendAdmission ? 'Admission Advised' : 'No Admission'}</span>
              </label>
            </div>

            {recommendAdmission && (
              <div className="space-y-3 pt-3 border-t border-indigo-200/80 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Doctor's Clinical Reason for Admission *</label>
                    <input
                      type="text"
                      disabled={readOnly}
                      required={recommendAdmission}
                      placeholder="e.g. Requires continuous IV fluids, oxygen support & post-op monitoring"
                      value={admissionReason}
                      onChange={(e) => setAdmissionReason(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border border-indigo-300 text-xs font-semibold text-slate-900 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-indigo-900 mb-1">Recommended Ward Type</label>
                    <select
                      disabled={readOnly}
                      value={recommendedWard}
                      onChange={(e) => setRecommendedWard(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border border-indigo-300 text-xs font-bold text-indigo-950 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="General Ward">General Ward Bed (₹1,000/day)</option>
                      <option value="Semi-Private Room">Semi-Private Room (₹1,800/day)</option>
                      <option value="Deluxe Ward">Deluxe AC Ward Room (₹2,500/day)</option>
                      <option value="Super Deluxe Suite">Super Deluxe Suite (₹4,500/day)</option>
                      <option value="ICU Critical Care">ICU Critical Care Unit (₹6,000/day)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: FOLLOW UP DATE & ADVICE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">Recommended Follow-up OPD Date</label>
              <input
                type="date"
                disabled={readOnly}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className={`w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">General Advice & Dietary Instructions</label>
              <input
                type="text"
                disabled={readOnly}
                placeholder="e.g. Avoid heavy lifting, drink 3L water daily, salt restriction"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full p-2.5 rounded-xl border border-slate-200 text-xs ${readOnly ? 'bg-slate-100 text-slate-900 font-bold cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
            {readOnly ? (
              onOpenPrintSlip && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrintSlip(appointment);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-300" /> View & Print Prescription Slip
                </button>
              )
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" /> Save Prescription & Observation Record
              </button>
            )}
          </div>

        </form>
        </div>
      </div>
    </div>
  );
};
