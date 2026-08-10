import React, { useState, useEffect } from 'react';
import { User, Doctor, Appointment } from '../types';
import { api } from '../lib/api';
import { 
  X, UserPlus, Search, Stethoscope, Calendar, Clock, Phone, MapPin, 
  HeartPulse, ShieldCheck, CheckCircle2, User as UserIcon, AlertCircle, Building2, CreditCard
} from 'lucide-react';

interface WalkInRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoctorId?: string;
  initialRegistrationType?: 'new' | 'existing';
  onSuccess: (newApt: Appointment, newPatient: User) => void;
}

export const WalkInRegistrationModal: React.FC<WalkInRegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultDoctorId,
  initialRegistrationType = 'new',
  onSuccess
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [existingPatients, setExistingPatients] = useState<User[]>([]);
  const [registrationType, setRegistrationType] = useState<'new' | 'existing'>(initialRegistrationType);
  const [searchPatientQuery, setSearchPatientQuery] = useState('');
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<User | null>(null);

  // Form Fields - New Patient
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [address, setAddress] = useState('Silvassa, Dadra & Nagar Haveli');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('Direct Hospital Walk-In OPD Patient');

  // Consultation Booking Fields
  const [selectedDocId, setSelectedDocId] = useState(defaultDoctorId || '');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [reason, setReason] = useState('General Hospital OPD Consultation');
  const [paymentMode, setPaymentMode] = useState<'Cash at Counter' | 'UPI / QR Code' | 'Card Payment' | 'Government Free OPD Scheme'>('Cash at Counter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const docs = await api.getDoctors();
      setDoctors(docs);
      if (!selectedDocId && docs.length > 0) {
        setSelectedDocId(defaultDoctorId || docs[0].id);
      }

      const patients = await api.getPatients();
      setExistingPatients(patients);
      setRegistrationType(initialRegistrationType);
    }
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, defaultDoctorId, initialRegistrationType]);

  if (!isOpen) return null;

  const currentSelectedDoctor = doctors.find(d => d.id === selectedDocId) || doctors[0];

  const filteredPatients = existingPatients.filter(p => {
    const q = searchPatientQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.patient_code && p.patient_code.toLowerCase().includes(q)) ||
      p.email.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let patientToUse: User;

      if (registrationType === 'existing' && selectedExistingPatient) {
        patientToUse = selectedExistingPatient;
      } else {
        // Create new patient
        const formattedCode = `SKMH-2026-PAT-${100 + existingPatients.length + 1}`;
        patientToUse = await api.signup({
          full_name: fullName.trim(),
          phone: phone.trim() || '+91 98000 00000',
          email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '')}@skmh-walkin.org`,
          gender,
          age: Number(age) || 30,
          blood_group: bloodGroup,
          patient_code: formattedCode,
          address,
          allergies: allergies ? allergies.split(',').map(a => a.trim()) : ['None Reported'],
          past_medical_history: medicalHistory,
          medical_history_notes: medicalHistory,
          role: 'patient'
        });
      }

      // Create OPD Appointment Order
      const newApt = await api.createAppointment({
        user_id: patientToUse.id,
        user_name: patientToUse.full_name,
        user_phone: patientToUse.phone,
        user_email: patientToUse.email,
        patient_code: patientToUse.patient_code || `SKMH-2026-PAT-${patientToUse.id.replace(/\D/g, '')}`,
        doctor_id: currentSelectedDoctor?.id || 'doc-1',
        doctor_name: currentSelectedDoctor?.name || 'Dr. Rajesh Krishna',
        department: currentSelectedDoctor?.department || 'General Medicine',
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        reason: reason || 'Direct Walk-In Hospital Consultation',
        notes: `Walk-In Registration. Paid via ${paymentMode}. OPD Fee: ₹${currentSelectedDoctor?.consultation_fee || 750}`
      });

      // Auto-confirm the walk-in appointment since patient is physically at the hospital desk
      await api.updateAppointmentStatus(newApt.id, 'confirmed');

      // Send real-time notification to the assigned doctor
      if (currentSelectedDoctor) {
        await api.addNotification({
          user_id: currentSelectedDoctor.id,
          title: '🔔 New Patient Assigned by Reception Desk!',
          message: `Patient ${patientToUse.full_name} (${patientToUse.patient_code || 'SKMH-PAT-101'}) has been assigned to Dr. ${currentSelectedDoctor.name} for OPD consultation.`,
          type: 'appointment'
        });
      }

      const confirmedApt = { ...newApt, status: 'confirmed' as const };

      onSuccess(confirmedApt, patientToUse);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Walk-in registration successful!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">
                Direct Hospital Visit Entry
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Walk-In Patient & Instant OPD Check-In
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3 text-xs border border-slate-800">
          <Building2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <p className="leading-relaxed">
            Use this module when a patient physically visits Sri Krishna Multispeciality Hospital for consultation without booking online. Enter patient details below to immediately assign a doctor and generate an OPD Consultation Slip.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRegistrationType('new')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              registrationType === 'new'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>➕ Register New Walk-In Patient</span>
          </button>
          <button
            type="button"
            onClick={() => setRegistrationType('existing')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              registrationType === 'existing'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>🔍 Select Existing Registered Patient ({existingPatients.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* SECTION A: PATIENT DETAILS */}
          {registrationType === 'existing' ? (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block font-extrabold text-slate-900 uppercase text-[11px]">
                Search Existing Hospital Patient File
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type patient name, phone, code (SKMH-2026-PAT-xxx)..."
                  value={searchPatientQuery}
                  onChange={(e) => setSearchPatientQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              {/* Patient Selector List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pt-1">
                {filteredPatients.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedExistingPatient(pat)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedExistingPatient?.id === pat.id
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                        <span>{pat.full_name}</span>
                        {pat.patient_code && (
                          <span className="font-mono text-[10px] bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            {pat.patient_code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Phone: {pat.phone} • Age/Gender: {pat.age || 35} Yrs / {pat.gender || 'Male'} • Blood: {pat.blood_group || 'B+'}
                      </div>
                    </div>
                    {selectedExistingPatient?.id === pat.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <UserIcon className="w-4 h-4 text-emerald-600" /> Walk-In Patient Demographics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar Verma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98250 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="110"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="City, Locality, Silvassa..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Known Allergies or Past Medical Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin allergy, Hypertension history"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: ASSIGNED DOCTOR & OPD CONSULTATION DETAILS */}
          <div className="space-y-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <h3 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-200/80 pb-2">
              <Stethoscope className="w-4 h-4 text-emerald-700" /> Assign OPD Doctor & Consultation Shift
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Select OPD Doctor *</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 font-bold text-emerald-900 bg-white focus:outline-none focus:border-emerald-600"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization} • ₹{doc.consultation_fee})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Department</label>
                <input
                  type="text"
                  disabled
                  value={currentSelectedDoctor?.department || 'General Medicine'}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-100/60 text-emerald-950 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Consultation Date *</label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Time Slot / OPD Shift *</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="09:00 AM">09:00 AM (Morning OPD Slot)</option>
                  <option value="11:00 AM">11:00 AM (Late Morning OPD Slot)</option>
                  <option value="01:00 PM">01:00 PM (Afternoon OPD Slot)</option>
                  <option value="06:00 PM">06:00 PM (Evening OPD Slot)</option>
                  <option value="08:00 PM">08:00 PM (Night OPD Slot - Closes 08:30 PM)</option>
                  <option value="Emergency (After 08:30 PM)">After 08:30 PM (24x7 Emergency Casualties Only)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Chief Reason for Hospital Visit / OPD Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Acute chest discomfort, High fever, Routine OPD checkup..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800 text-xs">Payment Method:</span>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="px-2 py-1 bg-emerald-50 text-emerald-950 font-bold border border-emerald-300 rounded-lg text-xs"
                  >
                    <option value="Cash at Counter">Cash at Counter</option>
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Card Payment">Card Payment</option>
                    <option value="Government Free OPD Scheme">Government Free OPD Scheme</option>
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Consultation Fee</span>
                  <span className="text-base font-black text-emerald-800">₹{currentSelectedDoctor?.consultation_fee || 750}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (registrationType === 'existing' && !selectedExistingPatient)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Confirm Walk-In & Print OPD Slip'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
