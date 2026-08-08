import React, { useState, useEffect } from 'react';
import { Appointment, PrescribedMedicine, HigherReference, PatientVitals } from '../types';
import { X, Plus, Trash2, Stethoscope, Activity, Pill, FileCheck2, Share2, AlertCircle, Calendar, HeartPulse, User } from 'lucide-react';

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
  }) => Promise<void>;
}

export const ClinicalObservationModal: React.FC<ClinicalObservationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave
}) => {
  if (!isOpen || !appointment) return null;

  // Form State
  const [vitals, setVitals] = useState<PatientVitals>({
    blood_pressure: appointment.vitals?.blood_pressure || '120/80 mmHg',
    pulse_rate: appointment.vitals?.pulse_rate || '72 bpm',
    temperature: appointment.vitals?.temperature || '98.6 °F',
    spo2: appointment.vitals?.spo2 || '99%',
    weight_kg: appointment.vitals?.weight_kg || '68'
  });

  const [diagnosis, setDiagnosis] = useState<string>(
    appointment.diagnosis || ''
  );

  const [medicines, setMedicines] = useState<PrescribedMedicine[]>(
    appointment.prescribed_medicines || [
      {
        id: `med-${Date.now()}-1`,
        name: 'Tab. Paracetamol (500mg)',
        dosage: '1 Tablet',
        frequency: '1-0-1 (Twice Daily)',
        duration: '5 Days',
        instructions: 'Take after food'
      }
    ]
  );

  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
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

  const [submitting, setSubmitting] = useState(false);

  const handleAddMedicine = () => {
    if (!newMedName.trim()) return;
    const item: PrescribedMedicine = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newMedName.trim(),
      dosage: newMedDosage,
      frequency: newMedFreq,
      duration: newMedDuration,
      instructions: newMedInstruct
    };
    setMedicines(prev => [...prev, item]);
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
        notes
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 font-bold">
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
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Consultation Record for {appointment.user_name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Doctor: <strong>{appointment.doctor_name}</strong> • Dept: {appointment.department} • Date: {appointment.appointment_date} ({appointment.time_slot})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: PATIENT VITALS & OBSERVATION */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-emerald-600" /> Patient Vitals On Visit
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="120/80 mmHg"
                  value={vitals.blood_pressure}
                  onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulse Rate</label>
                <input
                  type="text"
                  placeholder="72 bpm"
                  value={vitals.pulse_rate}
                  onChange={(e) => setVitals({ ...vitals, pulse_rate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Body Temp</label>
                <input
                  type="text"
                  placeholder="98.6 °F"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">SpO2 Level</label>
                <input
                  type="text"
                  placeholder="99%"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (Kg)</label>
                <input
                  type="text"
                  placeholder="68"
                  value={vitals.weight_kg}
                  onChange={(e) => setVitals({ ...vitals, weight_kg: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
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
              placeholder="e.g. Acute Bronchitis with Wheezing / Grade II Knee Osteoarthritis with Joint Inflammation"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 shadow-sm"
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
                      <th className="p-2.5 text-right">Remove</th>
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
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(m.id)}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No medicines prescribed yet.</p>
            )}

            {/* Quick Add Medicine Form */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-2 border-t border-emerald-200/60">
              <input
                type="text"
                placeholder="Medicine Name (e.g. Tab. Amoxicillin 625mg)"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="sm:col-span-2 p-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                placeholder="Dosage (1 Tablet)"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Frequency (1-0-1)"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Duration (5 Days)"
                value={newMedDuration}
                onChange={(e) => setNewMedDuration(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
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
                  <button type="button" onClick={() => handleRemoveTest(test)} className="text-blue-500 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type test name (e.g., Complete Blood Count, Chest X-Ray PA View, 2D Echo)..."
                value={newTestInput}
                onChange={(e) => setNewTestInput(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTest}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Test
              </button>
            </div>
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
                      required={hasHigherReferral}
                      placeholder="e.g. AIIMS New Delhi / Civil Hospital Surat"
                      value={referralData.referred_to_hospital}
                      onChange={(e) => setReferralData({ ...referralData, referred_to_hospital: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 text-xs font-bold bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Department / Specialist Center</label>
                    <input
                      type="text"
                      placeholder="e.g. Advanced Cardiothoracic & Cath Lab Unit"
                      value={referralData.specialist_center}
                      onChange={(e) => setReferralData({ ...referralData, specialist_center: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Clinical Reason for Referral</label>
                    <input
                      type="text"
                      required={hasHigherReferral}
                      placeholder="e.g. Emergency coronary intervention & angiography required"
                      value={referralData.referral_reason}
                      onChange={(e) => setReferralData({ ...referralData, referral_reason: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Urgency Level</label>
                    <select
                      value={referralData.urgency}
                      onChange={(e) => setReferralData({ ...referralData, urgency: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 text-xs font-bold bg-white text-amber-900"
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

          {/* SECTION 6: FOLLOW UP DATE & ADVICE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">Recommended Follow-up OPD Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">General Advice & Dietary Instructions</label>
              <input
                type="text"
                placeholder="e.g. Avoid heavy lifting, drink 3L water daily, salt restriction"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" /> Save Prescription & Observation Record
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
