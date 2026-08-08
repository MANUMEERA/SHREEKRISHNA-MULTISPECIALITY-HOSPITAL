import React, { useState, useEffect } from 'react';
import { Appointment, MedicalReport, NotificationItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText, Bell, User, Clock, FileUp, Eye, Trash2, Download, CheckCircle2, XCircle, AlertCircle, Plus, ChevronRight, X, Pill, FileCheck2, Share2, Printer, HeartPulse, Stethoscope } from 'lucide-react';
import { PrintableConsultationSlip } from '../components/PrintableConsultationSlip';

interface PatientDashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const PatientDashboardPage: React.FC<PatientDashboardPageProps> = ({ setActiveTab }) => {
  const { user, login, signup, logout, role, notifications, markNotificationRead, refreshNotifications } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'appointments' | 'reports' | 'notifications' | 'profile'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Login Gate State for Non-Logged In Patients
  const [gateEmail, setGateEmail] = useState('');
  const [gatePassword, setGatePassword] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportCategory, setNewReportCategory] = useState<MedicalReport['category']>('Blood Test');
  const [newReportFile, setNewReportFile] = useState<File | null>(null);

  // View Report Modal
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  // Printable Consultation Slip Modal
  const [printableSlipModalOpen, setPrintableSlipModalOpen] = useState(false);
  const [selectedSlipAppointment, setSelectedSlipAppointment] = useState<Appointment | null>(null);

  const handleGateLogin = async (emailToUse?: string) => {
    const targetEmail = emailToUse || gateEmail.trim();
    if (!targetEmail) {
      setGateError('Please enter your registered patient email address.');
      return;
    }
    setGateLoading(true);
    setGateError('');
    try {
      await login(targetEmail, 'patient');
    } catch (err: any) {
      setGateError(err?.message || 'Failed to login to Patient Portal.');
    } finally {
      setGateLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const apts = await api.getAppointments(user?.id, role);
        const reps = await api.getReports(user?.id, role);
        setAppointments(apts);
        setReports(reps);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, role]);

  const handleCancelAppointment = async (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      await api.updateAppointmentStatus(id, 'cancelled');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    }
  };

  const handleUploadReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReportTitle) return;

    await api.uploadReport({
      user_id: user.id,
      user_name: user.full_name,
      title: newReportTitle,
      category: newReportCategory,
      file_name: newReportFile ? newReportFile.name : `${newReportTitle.replace(/\s+/g, '_')}.pdf`,
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: newReportFile ? `${(newReportFile.size / 1024 / 1024).toFixed(1)} MB` : '1.5 MB',
      uploaded_by_role: 'patient',
      doctor_notes: 'Uploaded directly by patient.'
    });

    const updated = await api.getReports(user.id, role);
    setReports(updated);
    setUploadModalOpen(false);
    setNewReportTitle('');
    setNewReportFile(null);
  };

  const statusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Gateway Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-emerald-800/80 text-center space-y-3 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider mb-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" /> Patient Portal Access Gate
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Shree Krishna Hospital Patient Portal
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              Please log in with your registered patient account to view Electronic Health Records (EHR), OPD consultation slips, diagnostic test reports, and appointment history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: LOGIN TO PATIENT PORTAL */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Existing Patient Login</h2>
                    <p className="text-xs text-slate-500">Sign in with your registered patient email</p>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleGateLogin(); }} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Patient Email Address</label>
                    <input
                      type="email"
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      placeholder="e.g. patient@skmh.org"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                    <input
                      type="password"
                      value={gatePassword}
                      onChange={(e) => setGatePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50"
                    />
                  </div>

                  {gateError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{gateError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={gateLoading}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {gateLoading ? 'Signing In...' : 'Sign In to Patient Portal ↗'}
                  </button>
                </form>

                {/* Quick Demo Accounts */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    ⚡ Quick Demo Patient Logins:
                  </span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleGateLogin('patient@skmh.org')}
                      className="w-full p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
                    >
                      <div>
                        <span className="block font-black">Amitabh Sharma</span>
                        <span className="text-[10px] font-mono text-emerald-700">patient@skmh.org</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGateLogin('priya.nair@skmh.org')}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
                    >
                      <div>
                        <span className="block font-black">Priya Nair</span>
                        <span className="text-[10px] font-mono text-slate-500">priya.nair@skmh.org</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: NEW PATIENT REGISTRATION */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-6 text-white border border-slate-800 shadow-md space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">New Patient Registration</h2>
                    <p className="text-xs text-emerald-200">Not registered at Shree Krishna Hospital yet?</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Registering a new patient account gives you immediate access to online OPD scheduling, digital prescriptions, lab test downloads, and automated appointment updates.
                </p>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Digital Patient Health ID</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant OPD Appointment Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Secure Storage for Lab & Diagnostic Reports</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  ➕ Register New Patient Account Now
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* User Header Profile Card */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-2xl border-2 border-emerald-600 shadow-inner">
              {user?.full_name ? user.full_name.charAt(0) : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Patient Health Records
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{user?.full_name || 'Amitabh Sharma'}</h1>
              <p className="text-xs text-emerald-200 font-medium">{user?.email || 'patient@skmh.org'} • {user?.phone || '+91 98112 23344'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('booking')}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" /> Book New OPD Appointment
            </button>
            <button
              onClick={logout}
              className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              title="Sign out of Patient Portal"
            >
              <XCircle className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-sm flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'appointments' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> My Appointments ({appointments.length})
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'reports' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Medical Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'notifications' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications ({notifications.length})
          </button>

          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'profile' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" /> Patient Profile
          </button>
        </div>

        {/* Tab 1: Appointments List */}
        {activeSubTab === 'appointments' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Your Appointment History</h2>
              <span className="text-xs text-slate-500 font-medium">{appointments.length} Total Appointments</span>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No appointments booked yet. Click "Book New OPD Appointment" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-mono font-bold text-slate-400">ID: {apt.id}</span>
                          {apt.patient_code && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold">
                              {apt.patient_code}
                            </span>
                          )}
                          {statusBadge(apt.status)}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base">{apt.doctor_name}</h3>
                        <p className="text-xs text-slate-600 font-medium">{apt.department}</p>
                        <p className="text-xs text-emerald-800 font-bold flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> Date: {apt.appointment_date} at {apt.time_slot}
                        </p>
                        {apt.reason && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">Chief Complaint: "{apt.reason}"</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setSelectedSlipAppointment(apt);
                            setPrintableSlipModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print OPD Slip
                        </button>

                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clinical Details Box */}
                    {(apt.vitals || apt.diagnosis || (apt.prescribed_medicines && apt.prescribed_medicines.length > 0) || (apt.recommended_tests && apt.recommended_tests.length > 0) || apt.higher_reference) && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs space-y-2.5">
                        {apt.vitals && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-3 text-[11px]">
                            <span><strong>BP:</strong> {apt.vitals.blood_pressure || '-'}</span>
                            <span>• <strong>Pulse:</strong> {apt.vitals.pulse_rate || '-'}</span>
                            <span>• <strong>Temp:</strong> {apt.vitals.temperature || '-'}</span>
                            <span>• <strong>SpO2:</strong> {apt.vitals.spo2 || '-'}</span>
                            <span>• <strong>Weight:</strong> {apt.vitals.weight_kg ? `${apt.vitals.weight_kg} kg` : '-'}</span>
                          </div>
                        )}

                        {apt.diagnosis && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950">
                            <strong className="text-emerald-900 block text-[10px] uppercase font-black">Doctor Diagnosis:</strong>
                            <p className="font-bold text-xs">{apt.diagnosis}</p>
                          </div>
                        )}

                        {apt.prescribed_medicines && apt.prescribed_medicines.length > 0 && (
                          <div className="space-y-1">
                            <strong className="text-slate-700 block text-[10px] uppercase font-black flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" /> Prescribed Medications (Rx):
                            </strong>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 divide-y divide-slate-100 text-[11px]">
                              {apt.prescribed_medicines.map((m, idx) => (
                                <div key={idx} className="py-1 flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{m.name} ({m.dosage})</span>
                                  <span className="text-emerald-800 font-semibold">{m.frequency} • {m.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {apt.recommended_tests && apt.recommended_tests.length > 0 && (
                          <div className="space-y-1">
                            <strong className="text-slate-700 block text-[10px] uppercase font-black flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Recommended Tests:
                            </strong>
                            <div className="flex flex-wrap gap-1.5">
                              {apt.recommended_tests.map((t, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold">
                                  • {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {apt.higher_reference && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                            <div className="font-bold text-xs uppercase flex items-center gap-1">
                              <Share2 className="w-3.5 h-3.5 text-amber-700" /> Higher Referral Note ({apt.higher_reference.urgency}):
                            </div>
                            <p className="text-[11px]"><strong>Hospital:</strong> {apt.higher_reference.referred_to_hospital} ({apt.higher_reference.specialist_center})</p>
                            <p className="text-[11px]"><strong>Reason:</strong> {apt.higher_reference.referral_reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Medical Reports */}
        {activeSubTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Medical Reports & Prescriptions</h2>
                <p className="text-xs text-slate-500">Access lab test results, radiology scans, and doctor prescriptions.</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors flex items-center gap-1.5"
              >
                <FileUp className="w-4 h-4" /> Upload Report
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No medical reports uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {rep.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{rep.title}</h4>
                      <p className="text-[11px] text-slate-500">{rep.file_name} ({rep.file_size})</p>
                      <p className="text-[10px] text-slate-400">Uploaded: {new Date(rep.uploaded_at).toLocaleDateString()}</p>
                      {rep.doctor_notes && (
                        <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-100 mt-2">
                          <span className="font-bold">Doctor Note:</span> {rep.doctor_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeSubTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Notification Center</h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No notifications available.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer ${
                      n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800 text-sm">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Patient Profile */}
        {activeSubTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Patient Profile & Health Vitals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="text-slate-400 font-bold uppercase text-[10px] block">Full Name</label>
                <div className="font-bold text-slate-900 text-sm mt-1">{user?.full_name || 'Amitabh Sharma'}</div>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</label>
                <div className="font-bold text-slate-900 text-sm mt-1">{user?.email || 'patient@skmh.org'}</div>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[10px] block">Contact Number</label>
                <div className="font-bold text-slate-900 text-sm mt-1">{user?.phone || '+91 98112 23344'}</div>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[10px] block">Blood Group</label>
                <div className="font-bold text-emerald-700 text-sm mt-1">{user?.blood_group || 'B+'}</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Upload Medical Report Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUploadReportSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Upload Medical Report</h3>
              <button type="button" onClick={() => setUploadModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Blood Sugar & Lipid Test"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Report Category</label>
              <select
                value={newReportCategory}
                onChange={(e) => setNewReportCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="Blood Test">Blood Test</option>
                <option value="Radiology / X-Ray">Radiology / X-Ray</option>
                <option value="MRI Scan">MRI Scan</option>
                <option value="Prescription">Prescription</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Lab Result">Lab Result</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select File (PDF, PNG, JPG)</label>
              <input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewReportFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow"
              >
                Upload File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Medical Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  {selectedReport.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedReport.title}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>File Name:</span> <span className="font-bold text-slate-900">{selectedReport.file_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Uploaded On:</span> <span className="font-semibold text-slate-800">{new Date(selectedReport.uploaded_at).toLocaleString()}</span>
              </div>
              {selectedReport.doctor_notes && (
                <div className="pt-2 border-t border-slate-200 text-emerald-900">
                  <span className="font-bold block mb-1">Doctor Remarks & Prescription:</span>
                  <p className="bg-white p-3 rounded-xl border border-emerald-100">{selectedReport.doctor_notes}</p>
                </div>
              )}
            </div>

            {/* Document Preview Frame Simulation */}
            <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
              <FileText className="w-12 h-12 text-emerald-600 mb-2" />
              <p className="font-bold text-slate-700">{selectedReport.file_name}</p>
              <p className="text-[11px] text-slate-400">Verified Medical Document • Encrypted Storage</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable OPD Slip Modal */}
      <PrintableConsultationSlip
        isOpen={printableSlipModalOpen}
        onClose={() => setPrintableSlipModalOpen(false)}
        appointment={selectedSlipAppointment}
        patient={user}
      />

    </div>
  );
};
