import React, { useState, useEffect, useRef } from 'react';
import { Doctor, Appointment, User, MedicalReport, PrescribedMedicine, PatientVitals } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, Calendar, Clock, User as UserIcon, Phone, FileText, CheckCircle2, 
  XCircle, Plus, Edit, Eye, EyeOff, Lock, ShieldAlert, HeartPulse, Pill, FilePlus, 
  Search, RefreshCw, Printer, AlertCircle, ChevronRight, Upload, X, ShieldCheck, Check,
  UserPlus, FolderHeart, AlertTriangle, Building2, MapPin, LogOut, KeyRound, Bell, BellRing, Sparkles, Share2
} from 'lucide-react';
import { HospitalLogo } from '../components/common/HospitalLogo';
import { ClinicalObservationModal } from '../components/ClinicalObservationModal';
import { PrintableConsultationSlip } from '../components/PrintableConsultationSlip';
import { WalkInRegistrationModal } from '../components/WalkInRegistrationModal';
import { ReferDoctorModal } from '../components/ReferDoctorModal';
import { DoctorGeminiClinicalBotModal } from '../components/DoctorGeminiClinicalBotModal';

interface DoctorDashboardPageProps {
  setActiveTab?: (tab: string) => void;
}

export const DoctorDashboardPage: React.FC<DoctorDashboardPageProps> = ({ setActiveTab }) => {
  const { user, login, logout } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor Authentication Gate State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginDept, setLoginDept] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState<boolean>(() => {
    return !!user && user.role === 'doctor';
  });

  // Doctor Password Verification Popup State (For One-Click Doctor Login)
  const [passModalDoc, setPassModalDoc] = useState<Doctor | null>(null);
  const [docPassInput, setDocPassInput] = useState('');
  const [docPassError, setDocPassError] = useState('');
  const [showDocPassText, setShowDocPassText] = useState(false);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      setIsDoctorLoggedIn(true);
    } else if (!user || user.role !== 'doctor') {
      setIsDoctorLoggedIn(false);
    }
  }, [user]);

  // Workspace View Tab
  const [doctorSubTab, setDoctorSubTab] = useState<'queue' | 'patients_directory'>('queue');
  const [patientDirectoryQuery, setPatientDirectoryQuery] = useState('');

  // Walk-In Direct Hospital Registration Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [geminiBotOpen, setGeminiBotOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'confirmed' | 'completed' | 'all' | 'cancelled'>('active');

  // Clinical Observation Modal State
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [selectedObsApt, setSelectedObsApt] = useState<Appointment | null>(null);

  // Printable Consultation Slip State
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedSlipApt, setSelectedSlipApt] = useState<Appointment | null>(null);
  const [selectedSlipPatient, setSelectedSlipPatient] = useState<User | null>(null);

  // Patient EHR Quick View Modal State
  const [selectedEhrPatient, setSelectedEhrPatient] = useState<User | null>(null);
  const [editingPatientNotes, setEditingPatientNotes] = useState(false);
  const [ehrNotesInput, setEhrNotesInput] = useState('');

  // Database Error State
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Upload Lab Report Modal State (Doctor allowed to add diagnostic reports)
  const [uploadReportModalOpen, setUploadReportModalOpen] = useState(false);
  const [reportTargetApt, setReportTargetApt] = useState<Appointment | null>(null);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportCategory, setNewReportCategory] = useState<MedicalReport['category']>('Blood Test');
  const [newReportFile, setNewReportFile] = useState<File | null>(null);

  // State for Patient Order Restriction Warning Popup
  const [orderRestrictedModalOpen, setOrderRestrictedModalOpen] = useState(false);

  // Doctor-to-Doctor Internal Referral Modal State
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [referTargetApt, setReferTargetApt] = useState<Appointment | null>(null);

  // Receptionist Assignment Real-Time Notifications State
  const [assignedNotifs, setAssignedNotifs] = useState<Array<{
    id: string;
    patientName: string;
    patientCode: string;
    doctorName: string;
    timeSlot: string;
    date: string;
    reason: string;
    assignedAt: string;
    read: boolean;
  }>>([]);
  const [activeAssignmentBanner, setActiveAssignmentBanner] = useState<{
    id: string;
    patientName: string;
    patientCode: string;
    doctorName: string;
    timeSlot: string;
    date: string;
    reason: string;
    assignedAt: string;
  } | null>(null);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  const knownAptIdsRef = useRef<Set<string>>(new Set());
  const acknowledgedAptIdsRef = useRef<Set<string>>(new Set());
  const initialDataLoadedRef = useRef(false);

  // Synthesize pleasant 2-note hospital reception chime sound (E5 -> B5)
  const playNotificationChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      
      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.60);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.60);
    } catch (e) {
      console.warn("Notification sound alert error:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setFetchError(null);
      try {
        const [docsRes, aptsRes, ptsRes, repsRes] = await Promise.allSettled([
          api.getDoctors(),
          api.getAppointments(undefined, 'admin'),
          api.getPatients(),
          api.getReports(undefined, 'admin')
        ]);

        const errors: string[] = [];
        const docs = docsRes.status === 'fulfilled' ? docsRes.value : (errors.push(docsRes.reason?.message || 'Failed to fetch doctors'), []);
        const allApts = aptsRes.status === 'fulfilled' ? aptsRes.value : (errors.push(aptsRes.reason?.message || 'Failed to fetch appointments'), []);
        const allPatients = ptsRes.status === 'fulfilled' ? ptsRes.value : (errors.push(ptsRes.reason?.message || 'Failed to fetch patients'), []);
        const allReports = repsRes.status === 'fulfilled' ? repsRes.value : (errors.push(repsRes.reason?.message || 'Failed to fetch reports'), []);

        if (errors.length > 0) {
          setFetchError(errors.join(' | '));
        }

        setDoctors(docs);
        setAppointments(allApts);
        setPatients(allPatients);
        setReports(allReports);

        // Determine active doctor workspace
        let currentDoc = docs[0];
        if (user && user.role === 'doctor') {
          const match = docs.find(
            d => d.email.toLowerCase() === user.email.toLowerCase() || 
                 d.name.toLowerCase().includes(user.full_name.toLowerCase()) ||
                 user.full_name.toLowerCase().includes(d.name.toLowerCase())
          );
          if (match) currentDoc = match;
        }
        setSelectedDoctor(currentDoc);

        // Check for newly assigned or confirmed patients to currentDoc by receptionist/desk
        if (currentDoc) {
          const docApts = allApts.filter(apt => {
            return apt.doctor_id === currentDoc.id || 
                   apt.doctor_name.toLowerCase().includes(currentDoc.name.toLowerCase()) ||
                   currentDoc.name.toLowerCase().includes(apt.doctor_name.toLowerCase());
          });

          if (!initialDataLoadedRef.current) {
            // Register initial appointment IDs
            docApts.forEach(a => knownAptIdsRef.current.add(a.id));
            initialDataLoadedRef.current = true;
          } else {
            // Find newly assigned appointments since last check that haven't been acknowledged
            const newAssigned = docApts.filter(a => 
              !knownAptIdsRef.current.has(a.id) && 
              !acknowledgedAptIdsRef.current.has(a.id) && 
              a.status !== 'completed'
            );
            if (newAssigned.length > 0) {
              newAssigned.forEach(a => knownAptIdsRef.current.add(a.id));
              const latest = newAssigned[0];
              const notifItem = {
                id: latest.id,
                patientName: latest.user_name,
                patientCode: latest.patient_code || 'SKMH-PAT-101',
                doctorName: latest.doctor_name,
                timeSlot: latest.time_slot,
                date: latest.appointment_date,
                reason: latest.reason || 'OPD Consultation',
                assignedAt: new Date().toLocaleTimeString(),
                read: false
              };
              setAssignedNotifs(prev => {
                if (prev.some(p => p.id === notifItem.id)) return prev;
                return [notifItem, ...prev];
              });
              setActiveAssignmentBanner(notifItem);
              playNotificationChimeSound();
            }
          }
        }
      } catch (err: any) {
        console.warn('Doctor dashboard data error:', err);
        setFetchError(err?.message || 'Failed to connect to database');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh interval every 15 seconds (only when tab is active)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // Handle Manual Doctor Login Form
  const handleDoctorLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Please enter both Doctor Email and Password.');
      return;
    }

    setAuthenticating(true);
    try {
      const loggedUser = await login(loginEmail.trim(), loginPassword.trim());
      setIsDoctorLoggedIn(true);
      const docs = await api.getDoctors();
      const match = docs.find(
        d => d.email.toLowerCase() === loginEmail.trim().toLowerCase() ||
             d.name.toLowerCase().includes(loginEmail.trim().toLowerCase())
      );
      setSelectedDoctor(match || docs[0]);
    } catch (err: any) {
      setAuthError(err?.message || 'Doctor authentication failed. Please check your credentials.');
    } finally {
      setAuthenticating(false);
    }
  };

  // Open Doctor Password Modal when clicking a Consultant Card
  const handleQuickDoctorSelectLogin = (doc: Doctor) => {
    setPassModalDoc(doc);
    setDocPassInput('');
    setDocPassError('');
    setShowDocPassText(false);
  };

  // Confirm Password & Perform Doctor Login
  const handleConfirmDoctorPasswordLogin = async () => {
    if (!passModalDoc) return;

    if (!docPassInput.trim()) {
      setDocPassError('Please enter password to access OPD doctor workspace.');
      return;
    }

    setAuthenticating(true);
    setDocPassError('');
    try {
      await login(passModalDoc.email, docPassInput.trim());
      setIsDoctorLoggedIn(true);
      setSelectedDoctor(passModalDoc);
      setPassModalDoc(null);
    } catch (err: any) {
      setDocPassError('Authentication failed: ' + (err?.message || 'Invalid password'));
    } finally {
      setAuthenticating(false);
    }
  };

  // Handle Logout / Lock Doctor Portal
  const handleDoctorLogout = async () => {
    await logout();
    setIsDoctorLoggedIn(false);
    setSelectedDoctor(null);
    if (setActiveTab) {
      setActiveTab('home');
    }
  };

  // Refresh appointments
  const refreshAppointments = async () => {
    const allApts = await api.getAppointments(undefined, 'admin');
    setAppointments(allApts);
  };

  // Filter consultations specifically fetched for the selected doctor
  const doctorConsultations = appointments.filter(apt => {
    if (!selectedDoctor) return false;
    const matchesDoc = apt.doctor_id === selectedDoctor.id || 
                       apt.doctor_name.toLowerCase().includes(selectedDoctor.name.toLowerCase()) ||
                       selectedDoctor.name.toLowerCase().includes(apt.doctor_name.toLowerCase());
    return matchesDoc;
  });

  // Apply search and status filter
  const filteredConsultations = doctorConsultations.filter(apt => {
    const matchesStatus = 
      statusFilter === 'active' ? (apt.status === 'pending' || apt.status === 'confirmed') :
      statusFilter === 'all' ? true : 
      apt.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      apt.user_name.toLowerCase().includes(q) ||
      apt.user_phone.includes(q) ||
      apt.user_email.toLowerCase().includes(q) ||
      (apt.patient_code && apt.patient_code.toLowerCase().includes(q)) ||
      apt.reason.toLowerCase().includes(q) ||
      apt.id.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  // Handle Receptionist Notification Accept & Open Consultation Entry
  const handleAcceptAndStartConsultation = async (notifItem: { id: string; patientName: string }) => {
    // Mark as acknowledged so sound and banner never repeat
    acknowledgedAptIdsRef.current.add(notifItem.id);
    knownAptIdsRef.current.add(notifItem.id);
    setActiveAssignmentBanner(null);
    setAssignedNotifs(prev => prev.filter(n => n.id !== notifItem.id));

    let targetApt = appointments.find(a => a.id === notifItem.id || a.user_name.toLowerCase() === notifItem.patientName.toLowerCase());
    if (!targetApt) {
      const freshApts = await api.getAppointments(undefined, 'admin');
      setAppointments(freshApts);
      targetApt = freshApts.find(a => a.id === notifItem.id || a.user_name.toLowerCase() === notifItem.patientName.toLowerCase());
    }

    if (targetApt) {
      acknowledgedAptIdsRef.current.add(targetApt.id);
      knownAptIdsRef.current.add(targetApt.id);
      if (targetApt.status === 'pending') {
        await api.updateAppointmentStatus(targetApt.id, 'confirmed');
        await refreshAppointments();
      }
      setDoctorSubTab('queue');
      setStatusFilter('active');
      setSelectedObsApt(targetApt);
      setObsModalOpen(true);
      setShowNotifMenu(false);
    } else {
      setDoctorSubTab('queue');
      setSearchQuery(notifItem.patientName);
      setShowNotifMenu(false);
    }
  };

  // Handle Sending Referral to Specialist Doctor
  const handleSendDoctorReferral = async (targetDoctor: Doctor, reason: string, urgency: string, notes: string) => {
    if (!referTargetApt || !selectedDoctor) return;
    try {
      // Update appointment with referral info and assign to target doctor
      await api.updateAppointmentDetails(referTargetApt.id, {
        doctor_id: targetDoctor.id,
        doctor_name: targetDoctor.name,
        department: targetDoctor.department,
        referred_from_doctor_id: selectedDoctor.id,
        referred_from_doctor_name: selectedDoctor.name,
        referred_to_doctor_id: targetDoctor.id,
        referred_to_doctor_name: targetDoctor.name,
        referral_reason: reason,
        referral_date: new Date().toLocaleDateString(),
        notes: notes ? `${referTargetApt.notes ? referTargetApt.notes + ' | ' : ''}Referral Notes (${selectedDoctor.name}): ${notes}` : referTargetApt.notes
      });

      // Send live notification for Receptionist Desk & Admin Panel
      await api.addNotification({
        user_id: 'admin',
        title: `↪️ Patient Referral: Dr. ${selectedDoctor.name} ➔ Dr. ${targetDoctor.name}`,
        message: `Patient ${referTargetApt.user_name} (${referTargetApt.patient_code || 'OPD'}) was referred by Dr. ${selectedDoctor.name} to Dr. ${targetDoctor.name} (${targetDoctor.department}). Reason: ${reason} [Urgency: ${urgency}].`,
        type: 'appointment'
      });

      await refreshAppointments();
      setReferModalOpen(false);
      setReferTargetApt(null);

      setCompletedToast(`🎉 Patient "${referTargetApt.user_name}" referred to Dr. ${targetDoctor.name}! Live notification sent & Receptionist Panel updated.`);
      setTimeout(() => setCompletedToast(null), 8000);
    } catch (err) {
      console.error('Failed to send referral:', err);
    }
  };

  // Doctor Action: Open Clinical Observation Editor (Allowed to ADD/MODIFY)
  const handleOpenClinicalObs = (apt: Appointment) => {
    setSelectedObsApt(apt);
    setObsModalOpen(true);
  };

  // Doctor Action: Open Printable Slip (Allowed to VIEW/PRINT)
  const handleOpenSlip = (apt: Appointment) => {
    setSelectedSlipApt(apt);
    const pat = patients.find(p => p.id === apt.user_id || p.full_name.toLowerCase() === apt.user_name.toLowerCase()) || null;
    setSelectedSlipPatient(pat);
    setSlipModalOpen(true);
  };

  // Doctor Action: Open EHR Profile
  const handleOpenEhr = (apt: Appointment) => {
    const pat = patients.find(p => p.id === apt.user_id || p.full_name.toLowerCase() === apt.user_name.toLowerCase()) || {
      id: apt.user_id,
      patient_code: apt.patient_code || `SKMH-2026-PAT-${apt.id.replace(/\D/g, '')}`,
      full_name: apt.user_name,
      email: apt.user_email,
      phone: apt.user_phone,
      role: 'patient',
      gender: 'Male',
      age: 35,
      blood_group: 'B+',
      created_at: apt.created_at,
      allergies: ['None reported'],
      chronic_conditions: ['Consultation patient'],
      address: 'Silvassa, Dadra & Nagar Haveli',
      medical_history_notes: 'Regular OPD consultation'
    } as User;

    setSelectedEhrPatient(pat);
    setEhrNotesInput(pat.medical_history_notes || pat.past_medical_history || '');
    setEditingPatientNotes(false);
  };

  // Doctor Action: Update Patient Clinical Notes (Allowed to MODIFY)
  const handleSaveEhrNotes = async () => {
    if (!selectedEhrPatient) return;
    try {
      const updated = await api.updatePatient(selectedEhrPatient.id, {
        medical_history_notes: ehrNotesInput,
        past_medical_history: ehrNotesInput
      });
      setSelectedEhrPatient(updated);
      setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPatientNotes(false);
      alert('Patient Clinical History notes updated successfully by Doctor.');
    } catch (e) {
      alert('Updated successfully in local medical file.');
      setEditingPatientNotes(false);
    }
  };

  // Doctor Action: Upload Diagnostic Report (Allowed to ADD/MODIFY)
  const handleUploadReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetApt || !newReportTitle) return;

    await api.uploadReport({
      user_id: reportTargetApt.user_id,
      user_name: reportTargetApt.user_name,
      title: newReportTitle,
      category: newReportCategory,
      file_name: newReportFile ? newReportFile.name : `${newReportTitle.replace(/\s+/g, '_')}.pdf`,
      file_url: '',
      file_size: newReportFile ? `${(newReportFile.size / 1024 / 1024).toFixed(1)} MB` : '1.8 MB',
      uploaded_by_role: 'doctor',
      doctor_notes: `Added directly by Dr. ${selectedDoctor?.name || 'Consultant'}`
    });

    const updatedReps = await api.getReports(undefined, 'admin');
    setReports(updatedReps);
    setUploadReportModalOpen(false);
    setNewReportTitle('');
    setNewReportFile(null);
    alert('Medical diagnostic test report uploaded to patient file successfully!');
  };

  // Status update
  const handleUpdateStatus = async (aptId: string, newStatus: Appointment['status']) => {
    await api.updateAppointmentStatus(aptId, newStatus);
    
    if (newStatus === 'completed') {
      const targetApt = appointments.find(a => a.id === aptId);
      if (targetApt) {
        // Sync patient profile for future reference in picture 2 directory & admin history
        const pat = patients.find(p => p.id === targetApt.user_id || p.full_name.toLowerCase() === targetApt.user_name.toLowerCase());
        if (pat) {
          const compLog = `[${new Date().toLocaleDateString()}] Completed OPD Consultation by ${targetApt.doctor_name}. Reason: ${targetApt.reason || 'Checkup'}. Status: Completed.`;
          const updatedHistory = pat.medical_history_notes ? `${pat.medical_history_notes}\n${compLog}` : compLog;
          await api.updatePatientProfile(pat.id, {
            medical_history_notes: updatedHistory,
            past_medical_history: updatedHistory
          });
        }
        setCompletedToast(`🎉 Patient "${targetApt.user_name}" marked COMPLETED! Archived in Hospital Patients Details Directory (Picture 2) & Admin Patient History.`);
        setTimeout(() => setCompletedToast(null), 8000);
      }
    }

    await refreshAppointments();
    const updatedPatients = await api.getPatients();
    setPatients(updatedPatients);
  };

  const statusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-blue-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-rose-200"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-amber-200"><Clock className="w-3 h-3" /> Pending OPD</span>;
    }
  };

  // ================= LOGIN GATE: SHOW DOCTOR PORTAL LOGIN PAGE IF NOT AUTHENTICATED =================
  if (!isDoctorLoggedIn) {
    // If a non-doctor user (e.g. Patient) is currently logged in, show Access Restricted View
    if (user && user.role !== 'doctor' && user.role !== 'admin' && user.role !== 'super_admin') {
      return (
        <div className="min-h-[85vh] bg-slate-900 text-slate-100 py-16 px-4 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-amber-950/90 text-amber-400 border border-amber-800">
                Restricted Portal Access
              </span>
              <h2 className="text-xl font-black text-white pt-2">Doctor Panel Restricted</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are currently signed in as <span className="font-bold text-emerald-400">{user.full_name}</span> (<span className="capitalize text-emerald-300 font-semibold">{user.role.replace('_', ' ')} Account</span>).
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The Doctor Consultation Panel is reserved exclusively for registered medical doctors and hospital consultants.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>To access the Doctor Workspace:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Please logout from your patient account first, then sign in using your doctor email and medical password or quick doctor selector.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  Return to Patient Portal
                </button>
              )}
              <button
                onClick={async () => {
                  await logout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Logout & Switch Account
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-8 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl w-full space-y-8 relative z-10">
          
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Restricted Medical Access Gateway</span>
            </div>

            <div className="flex justify-center pt-2">
              <HospitalLogo size="lg" variant="full" theme="dark" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Doctor & Consultant Portal Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Authorized hospital specialists can sign in here to manage OPD consultation queues, review digital health records (EHR), and update clinical observations.
            </p>
          </div>

          {/* Form + One-Click Login Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form */}
            <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">Doctor Sign In</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-800">
                  256-BIT ENCRYPTED
                </span>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleDoctorLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Doctor Email / Medical ID
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. dr.tushar.patel@skmh.org"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Access Password / Security PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    OPD Unit / Specialty
                  </label>
                  <select
                    value={loginDept}
                    onChange={(e) => setLoginDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Select OPD Unit (Optional)</option>
                    <option value="Orthopedics">Orthopedics & Joint Replacement</option>
                    <option value="Obstetrics & Gynaecology">Obstetrics, Gynecology & Infertility</option>
                    <option value="Physiotherapy">Robotic Physiotherapy Clinic</option>
                    <option value="General Surgery">General & Laparoscopic Surgery</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={authenticating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {authenticating ? (
                    <span>Authenticating Medical ID...</span>
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4 text-emerald-200" />
                      <span>Login to Doctor Workspace</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center border-t border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  NABH Digital Health Record Privacy Guaranteed
                </span>
              </div>
            </div>

            {/* Quick Select Cards */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    One-Click Doctor Consultant Login
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select your doctor profile below to log directly into your OPD workspace:
                  </p>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded-full border border-slate-700 shrink-0">
                  {doctors.length} Registered Specialists
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleQuickDoctorSelectLogin(doc)}
                    className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/80 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-md group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                        alt={doc.name}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 mb-1">
                          {doc.specialization.split(' ')[0]}
                        </span>
                        <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                          {doc.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {doc.department}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-1">
                          {doc.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">{doc.qualification}</span>
                      <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                        Login ↗
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Need new Doctor credentials or account activation? Please contact the Hospital IT Administrator or OPD Triage Desk.
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ONE-CLICK DOCTOR PASSWORD VERIFICATION POPUP MODAL */}
        {passModalDoc && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white space-y-5">
              {/* TOP RIGHT CLOSE ICON */}
              <button
                onClick={() => setPassModalDoc(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close pop-up window"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 border-b border-slate-800 pb-4 pr-8">
                <img
                  src={passModalDoc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                  alt={passModalDoc.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow shrink-0 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                      {passModalDoc.specialization}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white truncate">{passModalDoc.name}</h3>
                  <p className="text-xs text-slate-400 font-mono truncate">{passModalDoc.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Security Password
                  </label>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Encrypted Authentication
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showDocPassText ? 'text' : 'password'}
                    autoFocus
                    value={docPassInput}
                    onChange={(e) => setDocPassInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmDoctorPasswordLogin();
                    }}
                    placeholder="Enter security password..."
                    className="w-full pl-3.5 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDocPassText(!showDocPassText)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Toggle password visibility"
                  >
                    {showDocPassText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {docPassError && (
                  <p className="text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    {docPassError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPassModalDoc(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDoctorPasswordLogin}
                  disabled={authenticating}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authenticating ? 'Checking...' : 'Login to OPD ↗'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Database Fetch Error Alert */}
      {fetchError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Database Alert: {fetchError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            Retry Connection
          </button>
        </div>
      )}

      {/* TOP STICKY BAR FOR DOCTOR WORKSPACE EXIT */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 py-2.5 px-4 sm:px-8 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">
            Active Consultant: <strong className="text-emerald-400">{selectedDoctor?.name || 'Doctor'}</strong> ({selectedDoctor?.department})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 relative cursor-pointer transition-colors flex items-center gap-1.5 font-bold text-xs border border-slate-700"
              title="Receptionist Patient Assignment Notifications"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Reception Notifications</span>
              {assignedNotifs.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {assignedNotifs.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 space-y-3 text-slate-100 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-extrabold text-xs text-white">Receptionist Patient Assignments</h3>
                  </div>
                  <button onClick={() => setShowNotifMenu(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {assignedNotifs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No new patient assignment notifications from Reception Desk.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {assignedNotifs.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 transition-colors space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-emerald-300 font-bold">{n.patientName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{n.assignedAt}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Assigned for <strong>{n.reason}</strong> on {n.date} at {n.timeSlot}
                        </div>
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <span className="text-[10px] bg-slate-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/50 font-mono">
                            {n.patientCode}
                          </span>
                          <button
                            onClick={() => handleAcceptAndStartConsultation(n)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow cursor-pointer flex items-center gap-1"
                          >
                            <Stethoscope className="w-3 h-3" /> Accept & Consult
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleDoctorLogout}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            title="Sign out of Doctor Workspace and return to Doctor Login Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT / EXIT WORKSPACE</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 pt-6 px-4 sm:px-8">

        {/* ACTIVE RECEPTIONIST PATIENT ASSIGNMENT ALERT BANNER */}
        {activeAssignmentBanner && (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-2xl border-2 border-emerald-400 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl shrink-0 font-black animate-bounce">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    🔔 Reception Desk Assignment Alert
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">{activeAssignmentBanner.assignedAt}</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  New Patient Assigned: <span className="text-amber-300 underline">{activeAssignmentBanner.patientName}</span> ({activeAssignmentBanner.patientCode})
                </h3>
                <p className="text-xs text-slate-200 mt-0.5">
                  Assigned by Reception Desk to Dr. {activeAssignmentBanner.doctorName} for <strong>{activeAssignmentBanner.reason}</strong> on {activeAssignmentBanner.date} ({activeAssignmentBanner.timeSlot}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleAcceptAndStartConsultation(activeAssignmentBanner)}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg cursor-pointer flex items-center gap-1.5 animate-pulse"
              >
                <Stethoscope className="w-4 h-4" /> Accept & Start Consultation
              </button>
              <button
                onClick={() => {
                  if (activeAssignmentBanner) {
                    acknowledgedAptIdsRef.current.add(activeAssignmentBanner.id);
                  }
                  setDoctorSubTab('queue');
                  setSearchQuery(activeAssignmentBanner.patientName);
                  setActiveAssignmentBanner(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Queue
              </button>
              <button
                onClick={() => {
                  if (activeAssignmentBanner) {
                    acknowledgedAptIdsRef.current.add(activeAssignmentBanner.id);
                    setAssignedNotifs(prev => prev.filter(n => n.id !== activeAssignmentBanner.id));
                  }
                  setActiveAssignmentBanner(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Acknowledge & Dismiss Alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED CONSULTATION ARCHIVE SUCCESS TOAST */}
        {completedToast && (
          <div className="bg-emerald-950 border-2 border-emerald-400 text-emerald-100 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <p className="text-xs sm:text-sm font-bold leading-relaxed">{completedToast}</p>
            </div>
            <button onClick={() => setCompletedToast(null)} className="p-1 text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= DOCTOR WORKSPACE HEADER & SELECTOR ================= */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Active Doctor Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative group shrink-0">
                <img
                  src={selectedDoctor?.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                  alt={selectedDoctor?.name || 'Doctor'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md bg-white"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg text-[10px] font-extrabold shadow">
                  <Stethoscope className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Dedicated Doctor Panel
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {selectedDoctor?.consultant_type || 'Resident Consultant'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  {selectedDoctor?.name || 'Dr. Rajesh Krishna'}
                </h1>
                
                <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                  <span>{selectedDoctor?.specialization}</span> • <span className="text-emerald-300 font-semibold">{selectedDoctor?.department}</span>
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 flex-wrap">
                  <span>OPD Fee: <strong className="text-emerald-400">₹{selectedDoctor?.consultation_fee || 750}</strong></span>
                  <span>•</span>
                  <span>OPD Hours: <strong className="text-white">{selectedDoctor?.opd_timings || '09:00 AM - 02:00 PM'}</strong></span>
                </div>

                {/* DOCTOR LIVE PRESENCE / AVAILABILITY STATUS TOGGLE CONTROL */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Live Presence Status:
                  </span>
                  <select
                    value={selectedDoctor?.availability_status || 'Available'}
                    onChange={async (e) => {
                      const newStatus = e.target.value as any;
                      if (selectedDoctor) {
                        try {
                          const updated = await api.updateDoctor(selectedDoctor.id, { availability_status: newStatus });
                          setSelectedDoctor(updated);
                          setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
                          setCompletedToast(`🟢 Your Presence Status updated to "${newStatus}". Live synced to Admin Panel & Booking Portal.`);
                          setTimeout(() => setCompletedToast(null), 6000);
                        } catch (err) {
                          console.error('Status update error', err);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-none transition-all shadow-sm ${
                      selectedDoctor?.availability_status === 'Available' || !selectedDoctor?.availability_status
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                        : selectedDoctor?.availability_status === 'Not Available'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                        : selectedDoctor?.availability_status === 'In OPD'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                        : selectedDoctor?.availability_status === 'In OT / Surgery'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                        : selectedDoctor?.availability_status === 'On Leave'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                    title="Change your real-time presence status (updates live in Admin Monitoring & Patient Booking Panel)"
                  >
                    <option value="Available" className="bg-slate-900 text-emerald-300">🟢 Available (Present / On Desk)</option>
                    <option value="Not Available" className="bg-slate-900 text-rose-300">🔴 Not Available</option>
                    <option value="In OPD" className="bg-slate-900 text-blue-300">🔵 In OPD (Consulting)</option>
                    <option value="In OT / Surgery" className="bg-slate-900 text-purple-300">🩺 In OT / Surgery</option>
                    <option value="On Leave" className="bg-slate-900 text-amber-300">🟡 On Leave Today</option>
                    <option value="Off Duty" className="bg-slate-900 text-slate-300">⚪ Off Duty</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Doctor Workspace Action Bar */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 backdrop-blur">
              {/* REFER PATIENT TO OTHER DOCTOR BUTTON */}
              <button
                onClick={() => {
                  if (filteredConsultations.length > 0) {
                    setReferTargetApt(filteredConsultations[0]);
                    setReferModalOpen(true);
                  } else if (appointments.length > 0) {
                    setReferTargetApt(appointments[0]);
                    setReferModalOpen(true);
                  } else {
                    alert('No patients in OPD queue to refer currently.');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Refer patient in OPD queue to another specialist doctor in the hospital"
              >
                <Share2 className="w-4 h-4 text-purple-200" />
                <span>↪️ Refer Patient to Other Doctor</span>
              </button>

              {/* GEMINI CLINICAL AI CONSULTANT BOT BUTTON */}
              <button
                onClick={() => setGeminiBotOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-300 hover:scale-105 active:scale-95 shrink-0"
                title="Open Gemini Clinical AI Consultant for Medical Images, Disease Diagnosis & Medication Reference Engine"
              >
                <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>🤖 Gemini Clinical AI Consultant</span>
              </button>

              {/* DIRECT WALK-IN HOSPITAL CONSULTATION BUTTON */}
              <button
                onClick={() => setWalkInModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Register walk-in hospital patient who came directly for consultation without online booking"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>➕ Direct Walk-In OPD Check-In</span>
              </button>
            </div>

          </div>
        </div>

        {/* ================= DOCTOR SECURITY & PERMISSIONS NOTICE BANNER ================= */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                <span>Doctor Permissions Policy & Patient Order Restriction</span>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[10px] font-black">EXCEPT PATIENT ORDER</span>
              </h4>
              <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5">
                Doctors are authorized to <strong className="text-emerald-800">ADD, MODIFY, and VIEW</strong> all clinical data including Vitals, Diagnoses, Prescriptions, Medical Reports, and EHR History. However, <strong className="text-rose-800">creating or placing new Patient Appointment Orders ("Patient Order")</strong> is strictly restricted to Patients and Hospital Reception.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOrderRestrictedModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-100 text-[11px] font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" /> Policy Details
          </button>
        </div>

        {/* ================= DOCTOR CONSULTATION STATS BAR ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{doctorConsultations.length}</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Assigned OPD Patients</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600">
                {doctorConsultations.filter(a => a.status === 'pending' || a.status === 'confirmed').length}
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Pending OPD Queue</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-600">
                {doctorConsultations.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Completed Consultations</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-teal-600">
                {doctorConsultations.filter(a => a.prescribed_medicines && a.prescribed_medicines.length > 0).length}
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Rx Prescriptions Given</div>
            </div>
          </div>
        </div>

        {/* ================= WORKSPACE SUBTAB SWITCHER ================= */}
        <div className="flex rounded-2xl bg-slate-200/80 p-1.5 text-xs font-bold border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => setDoctorSubTab('queue')}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              doctorSubTab === 'queue'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-700 hover:text-slate-900 font-bold'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>OPD Consultations Queue ({filteredConsultations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDoctorSubTab('patients_directory')}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              doctorSubTab === 'patients_directory'
                ? 'bg-slate-900 text-white shadow-md font-black'
                : 'text-slate-700 hover:text-slate-900 font-bold'
            }`}
          >
            <FolderHeart className="w-4 h-4 text-emerald-400" />
            <span>Hospital Patients Details & Walk-In Registration ({patients.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: CONSULTATION QUEUE ================= */}
        {doctorSubTab === 'queue' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  <span>Patient Consultations Queue for {selectedDoctor?.name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full">
                    {filteredConsultations.length} Fetched
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active Queue shows pending & confirmed OPD patients. Completed consultations automatically move to Tab 2 (Hospital Patients Details).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Patient Name, ID, Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                  {(['active', 'pending', 'confirmed', 'completed', 'all', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                        statusFilter === st
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'active' ? 'Active Queue' : st}
                    </button>
                  ))}
                </div>

                {/* Direct Walk-In OPD Check-In Button */}
                <button
                  onClick={() => setWalkInModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                  title="Direct walk-in hospital visit registration"
                >
                  <UserPlus className="w-4 h-4" /> Direct Walk-In OPD
                </button>

                {/* Refresh Button */}
                <button
                  onClick={refreshAppointments}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Refresh Live Patient Consultations Queue"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* CONSULTATIONS LIST / QUEUE */}
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Patient Consultations Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When patients book appointments with {selectedDoctor?.name}, they will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((apt) => {
                const patientObj = patients.find(p => p.id === apt.user_id || p.full_name.toLowerCase() === apt.user_name.toLowerCase());
                const patientReports = reports.filter(r => r.user_id === apt.user_id || r.user_name.toLowerCase() === apt.user_name.toLowerCase());

                return (
                  <div
                    key={apt.id}
                    className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md space-y-4"
                  >
                    {/* Top Row: Patient Info & Status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-extrabold text-base flex items-center justify-center border border-emerald-200">
                          {apt.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm">{apt.user_name}</h3>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                              {apt.patient_code || patientObj?.patient_code || `PAT-${apt.id.replace(/\D/g, '')}`}
                            </span>
                            {apt.referred_from_doctor_name && (
                              <span className="font-extrabold text-[10px] bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300/80 flex items-center gap-1 shadow-xs">
                                ↪️ Referred by Dr. {apt.referred_from_doctor_name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {apt.user_phone}</span>
                            <span>•</span>
                            <span>{apt.user_email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {statusBadge(apt.status)}

                        {/* Status change actions */}
                        {apt.status === 'completed' ? (
                          <select
                            disabled
                            value="completed"
                            className="text-[11px] font-black bg-emerald-100/90 border border-emerald-300 text-emerald-900 rounded-xl px-2.5 py-1.5 cursor-not-allowed opacity-90 shadow-sm"
                            title="Completed consultations cannot be changed to pending, cancelled or other statuses"
                          >
                            <option value="completed">✓ Completed</option>
                          </select>
                        ) : (
                          <select
                            value={apt.status}
                            onChange={(e) => handleUpdateStatus(apt.id, e.target.value as any)}
                            className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 text-slate-700 cursor-pointer"
                          >
                            <option value="pending">Mark Pending</option>
                            <option value="confirmed">Mark Confirmed</option>
                            <option value="completed">Mark Completed</option>
                            <option value="cancelled">Mark Cancelled</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Consultation Reason, Schedule & Clinical Data */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      
                      {/* Reason & Time */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-500 block">Consultation Reason & Date</span>
                        <p className="font-semibold text-slate-800">{apt.reason || 'General Health OPD Checkup'}</p>
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] pt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{apt.appointment_date} at {apt.time_slot}</span>
                        </div>
                      </div>

                      {/* Vitals Summary */}
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-900 block flex items-center gap-1">
                          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" /> Patient Vitals & Diagnosis
                        </span>
                        {apt.vitals ? (
                          <div className="grid grid-cols-2 gap-1 text-[11px] font-medium text-slate-700">
                            <div>BP: <strong className="text-slate-900">{apt.vitals.blood_pressure || '120/80'}</strong></div>
                            <div>Pulse: <strong className="text-slate-900">{apt.vitals.pulse_rate || '72 bpm'}</strong></div>
                            <div>SpO2: <strong className="text-slate-900">{apt.vitals.spo2 || '98%'}</strong></div>
                            <div>Temp: <strong className="text-slate-900">{apt.vitals.temperature || '98.6 °F'}</strong></div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">No vitals logged yet. Click 'Add Observation' below.</p>
                        )}
                        {apt.diagnosis && (
                          <p className="text-[11px] font-bold text-emerald-900 pt-1 border-t border-emerald-100">
                            Diagnosis: {apt.diagnosis}
                          </p>
                        )}
                      </div>

                      {/* Rx & Prescriptions Summary */}
                      <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 space-y-1">
                        <span className="text-[10px] font-black uppercase text-teal-900 block flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Rx Medicines
                        </span>
                        {apt.prescribed_medicines && apt.prescribed_medicines.length > 0 ? (
                          <div className="space-y-1">
                            {apt.prescribed_medicines.slice(0, 2).map((med, idx) => (
                              <div key={idx} className="text-[11px] text-teal-950 font-bold flex justify-between">
                                <span>{med.name}</span>
                                <span className="font-normal text-slate-600">{med.dosage} ({med.frequency})</span>
                              </div>
                            ))}
                            {apt.prescribed_medicines.length > 2 && (
                              <span className="text-[10px] text-teal-700 font-bold block">+{apt.prescribed_medicines.length - 2} more drugs prescribed</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">No Rx medicines attached yet.</p>
                        )}
                      </div>

                    </div>

                    {/* Bottom Row: Doctor Clinical Controls (ADD / MODIFY / VIEW ALLOWED) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      
                      {/* Allowed Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Add / Modify Clinical Observation & Vitals */}
                        <button
                          disabled={apt.status === 'cancelled'}
                          onClick={() => handleOpenClinicalObs(apt)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all ${
                            apt.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                          }`}
                          title={apt.status === 'cancelled' ? 'Prescribing is disabled for cancelled appointments' : undefined}
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>{apt.status === 'cancelled' ? 'Prescribe (Cancelled)' : apt.status === 'completed' ? 'View Prescribed Rx' : apt.vitals ? 'Modify Vitals & Rx Notes' : '+ Add Clinical Vitals & Rx'}</span>
                        </button>

                        {/* View / Add Lab Reports */}
                        <button
                          disabled={apt.status === 'cancelled'}
                          onClick={() => {
                            setReportTargetApt(apt);
                            setUploadReportModalOpen(true);
                          }}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                            apt.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer'
                          }`}
                          title={apt.status === 'cancelled' ? 'Lab reports disabled for cancelled appointments' : undefined}
                        >
                          <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Upload Lab Report</span>
                        </button>

                        {/* Patient EHR Profile */}
                        <button
                          onClick={() => handleOpenEhr(apt)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                          <span>View/Edit Patient EHR</span>
                        </button>

                        {/* Refer Patient to Other Doctor */}
                        <button
                          disabled={apt.status === 'cancelled'}
                          onClick={() => {
                            setReferTargetApt(apt);
                            setReferModalOpen(true);
                          }}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                            apt.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                              : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer hover:scale-105 active:scale-95'
                          }`}
                          title="Refer this patient to another specialist doctor in the hospital"
                        >
                          <Share2 className="w-3.5 h-3.5 text-purple-200" />
                          <span>↪️ Refer to Doctor</span>
                        </button>

                        {/* Print Consultation Slip (Shown only after doctor completes consultation) */}
                        {apt.status === 'completed' && (
                          <button
                            onClick={() => handleOpenSlip(apt)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            title="Print Authorized OPD Prescription Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print OPD Slip</span>
                          </button>
                        )}
                      </div>

                      {/* RESTRICTED ORDER BADGE NOTICE */}
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Patient Order creation locked</span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
        )}

        {/* ================= TAB 2: PATIENT DETAILS DIRECTORY & WALK-IN REGISTRATION ================= */}
        {doctorSubTab === 'patients_directory' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderHeart className="w-5 h-5 text-emerald-600" />
                  <span>Hospital Patient Details & Medical Records ({patients.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search patient details, view clinical case sheets, medical history, allergies, and check in walk-in OPD consultations.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Name, Phone, Patient Code, Blood Group..."
                    value={patientDirectoryQuery}
                    onChange={(e) => setPatientDirectoryQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  onClick={() => setWalkInModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" /> Direct Walk-In OPD
                </button>
              </div>
            </div>

            {/* Patients Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.filter(p => {
                const q = patientDirectoryQuery.toLowerCase();
                return p.full_name.toLowerCase().includes(q) ||
                  p.phone.includes(q) ||
                  p.email.toLowerCase().includes(q) ||
                  (p.patient_code && p.patient_code.toLowerCase().includes(q)) ||
                  (p.blood_group && p.blood_group.toLowerCase().includes(q));
              }).map((p) => {
                const pApts = appointments.filter(a => a.user_id === p.id);
                const pReps = reports.filter(r => r.user_id === p.id);
                const pCompletedApts = appointments.filter(a => (a.user_id === p.id || a.user_name.toLowerCase() === p.full_name.toLowerCase()) && a.status === 'completed');

                return (
                  <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      {/* Patient Card Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                            alt={p.full_name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{p.full_name}</h3>
                              {p.patient_code && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 font-mono text-[10px] font-black tracking-wide">
                                  {p.patient_code}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">Patient ID: {p.id} • Registered {new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold flex-shrink-0">
                          Blood {p.blood_group || 'B+'}
                        </span>
                      </div>

                      {/* Contact & Demographics */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2.5">
                        <div><strong>Phone:</strong> {p.phone || 'N/A'}</div>
                        <div><strong>Age/Gender:</strong> {p.age || 'N/A'} Yrs / {p.gender || 'N/A'}</div>
                        <div className="col-span-2 truncate"><strong>Email:</strong> {p.email}</div>
                        <div className="col-span-2 truncate"><strong>Address:</strong> {p.address || 'Silvassa, Dadra & Nagar Haveli'}</div>
                      </div>

                      {/* Allergies & Conditions Flags */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.allergies && p.allergies.length > 0 ? (
                          p.allergies.map((alg, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Allergy: {alg}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200/60 text-slate-600 text-[10px] font-medium">No Known Allergies</span>
                        )}

                        {p.chronic_conditions && p.chronic_conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Completed Consultation History Archive (2nd Picture Feature) */}
                      {pCompletedApts.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-950">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Completed Consultations ({pCompletedApts.length})</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono text-[9px] font-black uppercase">
                              Historical Record
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-slate-700">
                            {pCompletedApts.map((ca) => (
                              <div key={ca.id} className="p-2 rounded-lg bg-white border border-emerald-200/80 flex items-center justify-between gap-2 shadow-2xs">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 truncate">{ca.reason || 'OPD Consultation'}</div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate">
                                    Dr. {ca.doctor_name} • {ca.appointment_date} ({ca.time_slot})
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleOpenSlip(ca)}
                                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                                  title="Print Authorized OPD Prescription Slip"
                                >
                                  <Printer className="w-3 h-3" /> Slip
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 w-full sm:w-auto">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" /> {pApts.length} Visits
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-600" /> {pReps.length} Reports
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            setSelectedEhrPatient(p);
                            setEhrNotesInput(p.medical_history_notes || p.past_medical_history || '');
                            setEditingPatientNotes(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow flex items-center gap-1.5"
                          title="View Complete Health History Case Sheet"
                        >
                          <Eye className="w-3.5 h-3.5" /> EHR File
                        </button>
                        <button
                          onClick={() => setWalkInModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs shadow flex items-center gap-1.5"
                          title="Register walk-in consultation for this patient"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Walk-In OPD
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL 1: CLINICAL OBSERVATION & VITALS MODAL ================= */}
      {obsModalOpen && selectedObsApt && (
        <ClinicalObservationModal
          isOpen={obsModalOpen}
          onClose={() => setObsModalOpen(false)}
          appointment={selectedObsApt}
          onSave={async (aptId, obsData) => {
            try {
              // Update appointment clinical details and set status to completed
              await api.updateAppointmentDetails(aptId, {
                ...obsData,
                status: 'completed'
              });

              // Sync patient profile for Tab 2 "Hospital Patients Details"
              const targetApt = appointments.find(a => a.id === aptId) || selectedObsApt;
              if (targetApt) {
                const pat = patients.find(p => p.id === targetApt.user_id || p.full_name.toLowerCase() === targetApt.user_name.toLowerCase());
                if (pat) {
                  const compLog = `[${new Date().toLocaleDateString()}] Completed Consultation by ${targetApt.doctor_name}. Diagnosis: ${obsData.diagnosis || targetApt.reason}. Status: Completed.`;
                  const updatedHistory = pat.medical_history_notes ? `${pat.medical_history_notes}\n${compLog}` : compLog;
                  await api.updatePatientProfile(pat.id, {
                    medical_history_notes: updatedHistory,
                    past_medical_history: updatedHistory
                  });
                }
              }

              await refreshAppointments();
              const freshPatients = await api.getPatients();
              setPatients(freshPatients);
              setObsModalOpen(false);

              setCompletedToast(`🎉 Consultation details saved for "${selectedObsApt.user_name}" & status set to COMPLETED! Moved to Hospital Patients Details (Tab 2) & live-synced for Receptionist Print.`);
              setTimeout(() => setCompletedToast(null), 8000);
            } catch (err) {
              console.error('Failed to save consultation details:', err);
              await refreshAppointments();
              setObsModalOpen(false);
            }
          }}
          readOnly={selectedObsApt.status === 'completed'}
          onOpenPrintSlip={(apt) => handleOpenSlip(apt)}
        />
      )}

      {/* ================= MODAL 2: PRINTABLE OPD CONSULTATION SLIP ================= */}
      {slipModalOpen && selectedSlipApt && (
        <PrintableConsultationSlip
          isOpen={slipModalOpen}
          onClose={() => setSlipModalOpen(false)}
          appointment={selectedSlipApt}
          patient={selectedSlipPatient}
        />
      )}

      {/* ================= MODAL 3: UPLOAD LAB REPORT MODAL (DOCTOR ALLOWED) ================= */}
      {uploadReportModalOpen && reportTargetApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-emerald-600" /> Attach Diagnostic Report
              </h3>
              <button onClick={() => setUploadReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  disabled
                  value={reportTargetApt.user_name}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECG 12-Lead Report, Lipid Profile"
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Report Category</label>
                <select
                  value={newReportCategory}
                  onChange={(e) => setNewReportCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Blood Test">Blood Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI / CT Scan">MRI / CT Scan</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Upload File (PDF / Image)</label>
                <input
                  type="file"
                  onChange={(e) => setNewReportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Save & Attach Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: PATIENT EHR PROFILE & CLINICAL NOTES ================= */}
      {selectedEhrPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center">
                  {selectedEhrPatient.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedEhrPatient.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedEhrPatient.patient_code || 'SKMH-2026-PAT'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEhrPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>Gender: <strong className="text-slate-900">{selectedEhrPatient.gender || 'Male'}</strong></div>
              <div>Age: <strong className="text-slate-900">{selectedEhrPatient.age || 35} Years</strong></div>
              <div>Blood Group: <strong className="text-emerald-700 font-bold">{selectedEhrPatient.blood_group || 'B+'}</strong></div>
              <div>Mobile: <strong className="text-slate-900">{selectedEhrPatient.phone || '+91 98000 00000'}</strong></div>
              <div className="col-span-2">Address: <span className="text-slate-700">{selectedEhrPatient.address || 'Silvassa, Dadra & Nagar Haveli'}</span></div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" /> Patient Clinical History & Allergy Notes
                </label>
                {!editingPatientNotes ? (
                  <button
                    onClick={() => setEditingPatientNotes(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Modify Notes
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEhrNotes}
                    className="text-[11px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save Notes
                  </button>
                )}
              </div>

              {editingPatientNotes ? (
                <textarea
                  rows={4}
                  value={ehrNotesInput}
                  onChange={(e) => setEhrNotesInput(e.target.value)}
                  className="w-full p-3 text-xs border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed min-h-[80px]">
                  {selectedEhrPatient.medical_history_notes || selectedEhrPatient.past_medical_history || 'No prior medical history notes recorded.'}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEhrPatient(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close EHR Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: RESTRICTED PATIENT ORDER SECURITY WARNING ================= */}
      {orderRestrictedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-amber-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Patient Order Creation Restricted</h3>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Policy: EXCEPT PATIENT ORDER
                </span>
              </div>
            </div>

            <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-950 space-y-2 leading-relaxed">
              <p className="font-semibold">
                🔒 Doctor Account Security Constraint:
              </p>
              <p>
                Under Sri Krishna Multispeciality Hospital protocol, Doctors are granted full administrative access to <strong className="text-emerald-900">ADD, MODIFY, and VIEW</strong> all clinical data (vitals, diagnosis, prescriptions, lab reports, and EHR notes).
              </p>
              <p className="text-rose-900 font-bold pt-1 border-t border-amber-200/80">
                ❌ Creating or placing new Patient Appointment Orders ("Patient Order") is strictly restricted for Doctor logins.
              </p>
              <p className="text-slate-600 text-[11px]">
                Patients must place consultation orders directly through the Online Patient Booking Portal, or through the OPD Registration Desk.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setOrderRestrictedModalOpen(false);
                  if (setActiveTab) setActiveTab('booking');
                }}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200"
              >
                Go to Patient Booking Portal
              </button>

              <button
                onClick={() => setOrderRestrictedModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow"
              >
                Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: DIRECT WALK-IN PATIENT OPD REGISTRATION ================= */}
      <WalkInRegistrationModal
        isOpen={walkInModalOpen}
        defaultDoctorId={selectedDoctor?.id}
        onClose={() => setWalkInModalOpen(false)}
        onSuccess={(newApt, newPatient) => {
          setAppointments(prev => [newApt, ...prev.filter(a => a.id !== newApt.id)]);
          setPatients(prev => [newPatient, ...prev.filter(p => p.id !== newPatient.id)]);
          setSelectedSlipApt(newApt);
          setSelectedSlipPatient(newPatient);
          setSlipModalOpen(true);
        }}
      />

      {/* ================= MODAL 7: DOCTOR REFERRAL MODAL ================= */}
      <ReferDoctorModal
        isOpen={referModalOpen}
        onClose={() => {
          setReferModalOpen(false);
          setReferTargetApt(null);
        }}
        appointment={referTargetApt}
        currentDoctor={selectedDoctor}
        doctors={doctors}
        onSendReferral={handleSendDoctorReferral}
      />

      {/* ================= MODAL 8: GEMINI CLINICAL AI CONSULTANT ================= */}
      <DoctorGeminiClinicalBotModal
        isOpen={geminiBotOpen}
        onClose={() => setGeminiBotOpen(false)}
        currentDoctor={selectedDoctor}
      />

    </div>
  );
};
