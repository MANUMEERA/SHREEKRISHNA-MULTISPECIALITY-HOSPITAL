import React, { useState, useEffect } from 'react';
import { Doctor, Department, Appointment } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Star, Sparkles, X, Download, AlertTriangle, ShieldAlert, Siren, Printer } from 'lucide-react';
import { HospitalLogo } from '../components/common/HospitalLogo';

interface BookingPageProps {
  setActiveTab: (tab: string) => void;
  preselectedDoctor?: Doctor | null;
  preselectedDepartment?: string | null;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  setActiveTab,
  preselectedDoctor,
  preselectedDepartment
}) => {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Selection states
  const [selectedDeptName, setSelectedDeptName] = useState<string>(preselectedDepartment || 'Cardiology & Cardiac Surgery');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preselectedDoctor || null);
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-08-14');
  const [timeSlot, setTimeSlot] = useState<string>('10:30 AM');

  // Patient Info
  const [patientName, setPatientName] = useState(user?.full_name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '+91 98112 23344');
  const [patientEmail, setPatientEmail] = useState(user?.email || 'patient@skmh.org');
  const [visitReason, setVisitReason] = useState('Routine health checkup and consultation.');
  const [medicalRecordFile, setMedicalRecordFile] = useState<File | null>(null);

  // Completed appointment confirmation slip modal state
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getDoctors().then((docs) => {
      setDoctors(docs);
      if (!selectedDoctor && docs.length > 0) {
        setSelectedDoctor(docs[0]);
      }
    });
    api.getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    if (user) {
      if (!patientName) setPatientName(user.full_name);
      if (!patientEmail) setPatientEmail(user.email);
    }
  }, [user]);

  const availableDoctors = doctors.filter(
    (d) => d.department.toLowerCase() === selectedDeptName.toLowerCase() || selectedDeptName === 'all'
  );

  const STANDARD_OPD_TIME_SLOTS = ['09:00 AM', '11:00 AM', '01:00 PM', '06:00 PM', '08:00 PM'];

  const availableTimeSlots = STANDARD_OPD_TIME_SLOTS;

  const handleDeptChange = (deptName: string) => {
    setSelectedDeptName(deptName);
    const docs = doctors.filter((d) => d.department === deptName);
    if (docs.length > 0) {
      setSelectedDoctor(docs[0]);
    }
  };

  const handleFinalBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setIsSubmitting(true);
    try {
      const newApt = await api.createAppointment({
        user_id: user?.id || `usr-${Date.now()}`,
        user_name: patientName,
        user_phone: patientPhone,
        user_email: patientEmail,
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        department: selectedDoctor.department,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        reason: visitReason
      });

      // Also if file uploaded, create a medical report entry
      if (medicalRecordFile) {
        await api.uploadReport({
          user_id: user?.id || `usr-${Date.now()}`,
          user_name: patientName,
          title: `Attached Record for ${selectedDoctor.name}`,
          category: 'Other',
          file_name: medicalRecordFile.name,
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: `${(medicalRecordFile.size / 1024 / 1024).toFixed(1)} MB`,
          uploaded_by_role: 'patient',
          doctor_notes: `Uploaded during booking for appointment ${newApt.id}`
        });
      }

      setConfirmedAppointment(newApt);
    } catch (err) {
      console.error('Failed to create appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-10">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Online Scheduling
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 mb-2">
            Book an OPD Appointment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Instant digital confirmation with zero wait time at Shree Krishna Multispecialty Hospital.
          </p>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold">
            
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                1
              </span>
              <span className="hidden sm:inline">Select Specialist</span>
            </div>

            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
              <span className="hidden sm:inline">Date & Time</span>
            </div>

            <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                3
              </span>
              <span className="hidden sm:inline">Patient Details</span>
            </div>

          </div>
        </div>

        {/* Step 1: Select Specialty & Doctor */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Step 1: Choose Specialty & Doctor
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Medical Department
              </label>
              <select
                value={selectedDeptName}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white text-slate-800"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Select Consultant Doctor
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDoctors.length === 0 ? (
                  <p className="text-xs text-slate-500 col-span-2">No doctors currently listed for this department.</p>
                ) : (
                  availableDoctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <img
                          src={doc.photo_url}
                          alt={doc.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{doc.name}</h4>
                          <p className="text-[11px] text-slate-600">{doc.specialization}</p>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                            <span>₹{doc.consultation_fee} Fee</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {doc.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                disabled={!selectedDoctor}
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                Continue to Date & Time <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Slot Selection */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Step 2: Choose Appointment Schedule
            </h2>

            {/* Doctor Selected Summary */}
            {selectedDoctor && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <img
                  src={selectedDoctor.photo_url}
                  alt={selectedDoctor.name}
                  className="w-14 h-14 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</h4>
                  <p className="text-xs text-slate-600">{selectedDoctor.department}</p>
                  <p className="text-[11px] font-bold text-emerald-700 mt-0.5">Consultation Fee: ₹{selectedDoctor.consultation_fee}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Preferred Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Available OPD Time Slot
                </label>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  OPD Hours: 09:00 AM – 08:30 PM
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTimeSlots.map((slot, i) => {
                  const isSelected = timeSlot === slot;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> {slot}
                    </button>
                  );
                })}
              </div>

              {/* Strict OPD Timing Notice & Emergency Cut-off Banner */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-900 uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>OPD Consultation Timing & Cut-off Rules</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  • OPD slots are scheduled at <strong>09:00 AM, 11:00 AM, 01:00 PM, 06:00 PM, and 08:00 PM</strong>.<br />
                  • Regular OPD consultation bookings are <strong>NOT ALLOWED after 08:30 PM</strong>.
                </p>
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2 text-rose-900 font-extrabold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Siren className="w-4 h-4 text-rose-600 animate-pulse" />
                    After 08:30 PM: ONLY 24x7 Emergency Casualties & Trauma Admissions
                  </span>
                  <a
                    href="tel:+919099057219"
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3" /> Emergency Call 24x7
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                Proceed to Patient Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Information & Final Submission */}
        {step === 3 && (
          <form onSubmit={handleFinalBookingSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Step 3: Patient Information & Record
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Notification Email Address
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Primary Symptoms / Reason for Visit
              </label>
              <textarea
                rows={3}
                required
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                placeholder="Briefly describe your health issue or purpose of consultation..."
              />
            </div>

            {/* Optional Medical Record Attachment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Attach Existing Medical Report / X-Ray (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpeg,.jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMedicalRecordFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            {/* Final Booking Summary Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-900 uppercase tracking-wider">Booking Overview</h4>
              <div className="flex justify-between text-slate-700">
                <span>Doctor:</span> <span className="font-bold text-slate-900">{selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Department:</span> <span className="font-semibold">{selectedDoctor?.department}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Schedule:</span> <span className="font-bold text-emerald-800">{appointmentDate} at {timeSlot}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Confirming Appointment...' : 'Confirm & Book Appointment'}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Confirmation Voucher Slip Modal */}
      {confirmedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 text-center">
            
            <div className="flex justify-center mb-4">
              <HospitalLogo size="md" variant="full" theme="light" />
            </div>

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 border-2 border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              Booking Confirmed
            </span>

            <h2 className="text-2xl font-black text-slate-900 mt-2 mb-1">
              Appointment Registered!
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Appointment Slip ID: <span className="font-mono font-bold text-slate-900">{confirmedAppointment.id}</span>
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-emerald-800">{confirmedAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.appointment_date} at {confirmedAppointment.time_slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                  {confirmedAppointment.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> Print Booking Pass
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-amber-400" /> Export PDF
              </button>

              <a
                href={`https://wa.me/${confirmedAppointment.user_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `*Shree Krishna Multispecialty Hospital - Appointment Confirmation*\n\nDear ${confirmedAppointment.user_name},\nYour appointment has been registered successfully!\n\n*Doctor:* ${confirmedAppointment.doctor_name}\n*Department:* ${confirmedAppointment.department}\n*Date & Time:* ${confirmedAppointment.appointment_date} at ${confirmedAppointment.time_slot}\n*Appointment ID:* ${confirmedAppointment.id}\n\n*Address:* Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa, Dadra & Nagar Haveli- 396230 (UT)\n*Helpline:* +91 90990 57219`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4 fill-white" /> Send WhatsApp
              </a>

              <a
                href={`mailto:${confirmedAppointment.user_email || 'patient@skmh.org'}?subject=${encodeURIComponent(`Appointment Confirmation - ${confirmedAppointment.id}`)}&body=${encodeURIComponent(
                  `Dear ${confirmedAppointment.user_name},\n\nYour appointment at Shree Krishna Multispecialty Hospital is confirmed.\n\nDoctor: ${confirmedAppointment.doctor_name}\nDepartment: ${confirmedAppointment.department}\nDate & Time: ${confirmedAppointment.appointment_date} at ${confirmedAppointment.time_slot}\nAppointment ID: ${confirmedAppointment.id}\n\nThank you,\nShree Krishna Multispecialty Hospital, Silvassa`
                )}`}
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4 text-teal-200" /> Send Email
              </a>
            </div>

            <div className="mt-3">
              <button
                onClick={() => {
                  setConfirmedAppointment(null);
                  setActiveTab('dashboard');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
              >
                Go to Patient Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
