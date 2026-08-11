import React, { useState, useEffect } from 'react';
import { Doctor, Department, Appointment, User, MedicalReport, AnalyticsStats, ReportCategory, DoctorAvailabilityStatus } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Calendar, Stethoscope, Plus, Edit, Trash2, ShieldCheck, Copy, Check, Search, ChevronRight, X, 
  Building2, Upload, Image as ImageIcon, HeartPulse, Brain, Bone, Baby, Activity, BedDouble, UserCheck, PhoneCall,
  FileText, FolderHeart, AlertTriangle, Printer, FileSpreadsheet, Eye, ClipboardList, Clock, CheckCircle2, UserPlus, FilePlus, Pill, Share2, FileCheck2, Lock, ShieldAlert, RefreshCw, Database, Bot, CreditCard
} from 'lucide-react';
import { ClinicalObservationModal } from '../components/ClinicalObservationModal';
import { PrintableConsultationSlip } from '../components/PrintableConsultationSlip';
import { DoctorSecurityMonitorModal } from '../components/DoctorSecurityMonitorModal';
import { WalkInRegistrationModal } from '../components/WalkInRegistrationModal';
import { StaffManagementSection } from '../components/StaffManagementSection';
import { PaymentReceiptModal } from '../components/PaymentReceiptModal';
import { InpatientManagerModal } from '../components/InpatientManagerModal';
import { HospitalSettingsModal } from '../components/HospitalSettingsModal';
import { AccountingManagerSection } from '../components/AccountingManagerSection';
import { InventoryManagerSection } from '../components/InventoryManagerSection';
import { DiagnosticTestsManagerSection } from '../components/DiagnosticTestsManagerSection';
import { BotFaqManagerSection } from '../components/BotFaqManagerSection';
import { WardRoomChargesManagerSection } from '../components/WardRoomChargesManagerSection';
import { AudioNotificationToast } from '../components/AudioNotificationToast';
import { SupabaseSchemaModal } from '../components/SupabaseSchemaModal';
import { DailyPaymentReportModal } from '../components/DailyPaymentReportModal';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin';

  const isReceptionist = userRole === 'receptionist';

  const [adminSubTab, setAdminSubTab] = useState<'analytics' | 'departments' | 'doctors' | 'appointments' | 'patients' | 'supabase' | 'staff' | 'accounting' | 'inventory' | 'tests' | 'bot_faqs' | 'ward_charges'>(
    userRole === 'receptionist' ? 'appointments' : 'patients'
  );


  // Auto-Refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(new Date().toLocaleTimeString());

  // Payment receipt modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptPatient, setReceiptPatient] = useState<{
    id?: string;
    name: string;
    code: string;
    phone: string;
    email?: string;
    doctor?: string;
    autoShowReceipt?: boolean;
  }>({ name: 'Walk-in Patient', code: 'SKMH-WALKIN', phone: '+91 98000 00000', autoShowReceipt: false });

  // IPD modal
  const [ipdModalOpen, setIpdModalOpen] = useState(false);

  // Hospital settings modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Supabase Schema Modal
  const [supabaseSchemaModalOpen, setSupabaseSchemaModalOpen] = useState(false);

  // Audio toast
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string; description: string; timestamp: string } | null>(null);

  useEffect(() => {
    if (isReceptionist && adminSubTab !== 'appointments' && adminSubTab !== 'patients') {
      setAdminSubTab('appointments');
    }
  }, [isReceptionist, adminSubTab]);

  
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);

  // Walk-In Direct Hospital Patient Registration Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInInitialType, setWalkInInitialType] = useState<'new' | 'existing'>('new');

  // Receptionist Desk Settings: Disable Slip & Bill Receipts
  const [printingDisabled, setPrintingDisabled] = useState<boolean>(false);

  // Receptionist Daily Collection Payment Report Modal State
  const [dailyReportModalOpen, setDailyReportModalOpen] = useState<boolean>(false);

  // OPD Consultation Log Windows: 'today' vs 'previous'
  const [opdLogWindow, setOpdLogWindow] = useState<'today' | 'previous'>('today');

  // Super Admin Doctor Login Security Monitor Modal State
  const [doctorSecurityModalOpen, setDoctorSecurityModalOpen] = useState(false);

  // Clinical Observation Modal State
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [selectedObsAppointment, setSelectedObsAppointment] = useState<Appointment | null>(null);

  // Printable Consultation Slip Modal State
  const [printableSlipModalOpen, setPrintableSlipModalOpen] = useState(false);
  const [selectedSlipAppointment, setSelectedSlipAppointment] = useState<Appointment | null>(null);
  const [selectedSlipPatient, setSelectedSlipPatient] = useState<User | null>(null);

  // Selected Patient for EHR History Modal View
  const [selectedEhrPatient, setSelectedEhrPatient] = useState<User | null>(null);
  const [ehrActiveTab, setEhrActiveTab] = useState<'timeline' | 'reports' | 'conditions' | 'print'>('timeline');

  // Edit Patient Clinical Notes state inside EHR
  const [editingClinicalNotes, setEditingClinicalNotes] = useState(false);
  const [patientClinicalFormData, setPatientClinicalFormData] = useState({
    allergies: '',
    chronic_conditions: '',
    emergency_contact: '',
    address: '',
    medical_history_notes: '',
    blood_group: 'B+',
    phone: '',
    email: '',
    age: 40,
    gender: 'Male' as 'Male' | 'Female' | 'Other'
  });

  // Add / Edit Patient Modal
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<User | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFormData, setPatientFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 35,
    blood_group: 'B+',
    emergency_contact: '',
    address: '',
    allergies: 'Penicillin',
    chronic_conditions: 'Hypertension',
    medical_history_notes: 'Regular checkups.'
  });

  // Upload Report Modal for Patient
  const [uploadReportModalOpen, setUploadReportModalOpen] = useState(false);
  const [reportPatient, setReportPatient] = useState<User | null>(null);
  const [reportFormData, setReportFormData] = useState({
    title: '',
    category: 'Blood Test' as ReportCategory,
    file_name: 'lab_report.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '1.5 MB',
    doctor_notes: ''
  });

  // Edit Appointment Notes state
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [aptNotesInput, setAptNotesInput] = useState('');

  // Department CRUD Modal state
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    lead_doctor: 'Dr. Senior Specialist',
    total_doctors: 2,
    beds_count: 20,
    icon_name: 'Activity',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    equipment_highlights: 'Advanced Monitoring, Digital Diagnostics, ICU Beds',
    common_conditions: 'Emergency Care, Critical Care, Routine Checks',
    treatments: 'Consultation, Outpatient, Inpatient ICU'
  });

  // Doctor CRUD Modal state
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [docFormData, setDocFormData] = useState({
    name: '',
    department: 'Cardiology & Cardiac Surgery',
    specialization: 'Senior Consultant',
    qualification: 'MBBS, MD',
    experience_years: 10,
    consultation_fee: 750,
    phone: '+91 98765 00000',
    email: '',
    bio: '',
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    is_on_call: false,
    consultant_type: 'Resident Consultant' as string,
    availability_status: 'Available' as DoctorAvailabilityStatus
  });

  // Filter states for appointments
  const [aptStatusFilter, setAptStatusFilter] = useState<string>('all');
  const [aptSearch, setAptSearch] = useState<string>('');

  // Copy SQL script state
  const [sqlCopied, setSqlCopied] = useState(false);

  useEffect(() => {
    loadAllAdminData();

    // Auto Refresh Interval every 15 seconds (only when tab is active)
    const interval = setInterval(() => {
      if (autoRefreshEnabled && document.visibilityState === 'visible') {
        loadAllAdminData();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const loadAllAdminData = async () => {
    const [s, docs, depts, apts, pts, reps] = await Promise.all([
      api.getAdminStats(),
      api.getDoctors(),
      api.getDepartments(),
      api.getAppointments(undefined, 'admin'),
      api.getPatients(),
      api.getReports(undefined, 'admin')
    ]);

    setStats(s);
    setDoctors(docs);
    setDepartments(depts);
    setAppointments(apts);
    setPatients(pts);
    setReports(reps);
    setLastRefreshedTime(new Date().toLocaleTimeString());
  };

  // Open EHR History Drawer / Modal
  const handleOpenEhrHistory = (patient: User) => {
    setSelectedEhrPatient(patient);
    setEhrActiveTab('timeline');
    setPatientClinicalFormData({
      allergies: (patient.allergies || []).join(', '),
      chronic_conditions: (patient.chronic_conditions || []).join(', '),
      emergency_contact: patient.emergency_contact || '',
      address: patient.address || '',
      medical_history_notes: patient.medical_history_notes || '',
      blood_group: patient.blood_group || 'B+',
      phone: patient.phone || '',
      email: patient.email || '',
      age: patient.age || 40,
      gender: patient.gender || 'Male'
    });
  };

  // Save updated clinical history from EHR Modal
  const handleSaveEhrClinicalHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEhrPatient) return;

    const updated = await api.updatePatient(selectedEhrPatient.id, {
      allergies: patientClinicalFormData.allergies.split(',').map(s => s.trim()).filter(Boolean),
      chronic_conditions: patientClinicalFormData.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
      emergency_contact: patientClinicalFormData.emergency_contact,
      address: patientClinicalFormData.address,
      medical_history_notes: patientClinicalFormData.medical_history_notes,
      blood_group: patientClinicalFormData.blood_group,
      phone: patientClinicalFormData.phone,
      email: patientClinicalFormData.email,
      age: Number(patientClinicalFormData.age),
      gender: patientClinicalFormData.gender
    });

    setSelectedEhrPatient(updated);
    setEditingClinicalNotes(false);
    await loadAllAdminData();
  };

  // Open Add / Edit Patient Modal
  const handleOpenAddPatient = () => {
    setEditingPatient(null);
    setPatientFormData({
      full_name: '',
      email: `patient${Date.now()}@gmail.com`,
      phone: '+91 98000 00000',
      gender: 'Male',
      age: 35,
      blood_group: 'B+',
      emergency_contact: '+91 98000 11111',
      address: 'Silvassa, Dadra & Nagar Haveli',
      allergies: 'None',
      chronic_conditions: 'None',
      medical_history_notes: 'New patient registered via hospital admin.'
    });
    setPatientModalOpen(true);
  };

  const handleOpenEditPatient = (p: User) => {
    setEditingPatient(p);
    setPatientFormData({
      full_name: p.full_name,
      email: p.email,
      phone: p.phone || '',
      gender: p.gender || 'Male',
      age: p.age || 35,
      blood_group: p.blood_group || 'B+',
      emergency_contact: p.emergency_contact || '',
      address: p.address || '',
      allergies: (p.allergies || []).join(', '),
      chronic_conditions: (p.chronic_conditions || []).join(', '),
      medical_history_notes: p.medical_history_notes || ''
    });
    setPatientModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: patientFormData.full_name,
      email: patientFormData.email,
      phone: patientFormData.phone,
      gender: patientFormData.gender,
      age: Number(patientFormData.age),
      blood_group: patientFormData.blood_group,
      emergency_contact: patientFormData.emergency_contact,
      address: patientFormData.address,
      allergies: patientFormData.allergies.split(',').map(s => s.trim()).filter(Boolean),
      chronic_conditions: patientFormData.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
      medical_history_notes: patientFormData.medical_history_notes
    };

    if (editingPatient) {
      await api.updatePatient(editingPatient.id, payload);
    } else {
      await api.createPatient({
        ...payload,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
      });
    }

    setPatientModalOpen(false);
    await loadAllAdminData();
  };

  const handleDeletePatient = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove patient record for "${name}"? This action removes history records.`)) {
      await api.deletePatient(id);
      if (selectedEhrPatient?.id === id) setSelectedEhrPatient(null);
      await loadAllAdminData();
    }
  };

  // Open Upload Report Modal
  const handleOpenUploadReport = (patient: User) => {
    setReportPatient(patient);
    setReportFormData({
      title: 'Lab Blood Screening Report',
      category: 'Blood Test',
      file_name: `${patient.full_name.replace(/\s+/g, '_')}_Report.pdf`,
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '1.4 MB',
      doctor_notes: 'Screening values within normal limits. Reviewed by Hospital Pathology.'
    });
    setUploadReportModalOpen(true);
  };

  const handleSaveUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPatient) return;

    await api.uploadReport({
      user_id: reportPatient.id,
      user_name: reportPatient.full_name,
      title: reportFormData.title,
      category: reportFormData.category,
      file_name: reportFormData.file_name,
      file_url: reportFormData.file_url,
      file_size: reportFormData.file_size,
      doctor_notes: reportFormData.doctor_notes,
      uploaded_by_role: 'admin'
    });

    setUploadReportModalOpen(false);
    await loadAllAdminData();
  };

  // Save clinical note on specific appointment
  const handleSaveAptNotes = async (aptId: string) => {
    await api.updateAppointmentStatus(aptId, 'completed', aptNotesInput);
    setEditingAptId(null);
    setAptNotesInput('');
    await loadAllAdminData();
  };

  // --- DEPARTMENT HANDLERS ---
  const handleOpenAddDepartment = () => {
    setEditingDepartment(null);
    setDeptFormData({
      name: '',
      lead_doctor: 'Dr. Senior Specialist',
      total_doctors: 2,
      beds_count: 20,
      icon_name: 'Activity',
      description: 'Provides comprehensive diagnostic and therapeutic clinical care.',
      image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
      equipment_highlights: 'High-precision Diagnostic Scanners, Dedicated ICU Beds, Modular Operation Theatres',
      common_conditions: 'Acute Conditions, Chronic Management, Emergency Triage',
      treatments: 'Advanced Surgery, OPD Consultations, Inpatient Rehabilitation'
    });
    setDepartmentModalOpen(true);
  };

  const handleOpenEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDeptFormData({
      name: dept.name,
      lead_doctor: dept.lead_doctor,
      total_doctors: dept.total_doctors,
      beds_count: dept.beds_count,
      icon_name: dept.icon_name || 'Activity',
      description: dept.description,
      image_url: dept.image_url,
      equipment_highlights: Array.isArray(dept.equipment_highlights) ? dept.equipment_highlights.join(', ') : '',
      common_conditions: Array.isArray(dept.common_conditions) ? dept.common_conditions.join(', ') : '',
      treatments: Array.isArray(dept.treatments) ? dept.treatments.join(', ') : ''
    });
    setDepartmentModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: deptFormData.name,
      lead_doctor: deptFormData.lead_doctor,
      total_doctors: Number(deptFormData.total_doctors),
      beds_count: Number(deptFormData.beds_count),
      icon_name: deptFormData.icon_name,
      description: deptFormData.description,
      image_url: deptFormData.image_url,
      equipment_highlights: deptFormData.equipment_highlights.split(',').map(s => s.trim()).filter(Boolean),
      common_conditions: deptFormData.common_conditions.split(',').map(s => s.trim()).filter(Boolean),
      treatments: deptFormData.treatments.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editingDepartment) {
      await api.updateDepartment(editingDepartment.id, payload);
    } else {
      await api.createDepartment(payload);
    }
    setDepartmentModalOpen(false);
    await loadAllAdminData();
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete department "${name}"?`)) {
      await api.deleteDepartment(id);
      await loadAllAdminData();
    }
  };

  // --- DOCTOR HANDLERS ---
  const handleDoctorPhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setDocFormData(prev => ({ ...prev, photo_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDoctorStatusChange = async (docId: string, docName: string, newStatus: DoctorAvailabilityStatus) => {
    await api.updateDoctor(docId, { availability_status: newStatus });
    await loadAllAdminData();
    setToastMessage({
      id: Date.now().toString(),
      title: 'Doctor Availability Updated',
      description: `${docName} status updated to "${newStatus}". Synced with 24/7 AI Chatbot.`,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    const defaultDept = departments[0]?.name || 'Cardiology & Cardiac Surgery';
    setDocFormData({
      name: '',
      department: defaultDept,
      specialization: 'Senior Consultant',
      qualification: 'MBBS, MD',
      experience_years: 10,
      consultation_fee: 750,
      phone: '+91 98765 00000',
      email: `doctor${Date.now()}@skmh.org`,
      bio: 'Experienced specialist delivering high quality clinical care.',
      photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      is_on_call: false,
      consultant_type: 'Resident Consultant',
      availability_status: 'Available'
    });
    setDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocFormData({
      name: doc.name,
      department: doc.department,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience_years: doc.experience_years,
      consultation_fee: doc.consultation_fee,
      phone: doc.phone,
      email: doc.email,
      bio: doc.bio,
      photo_url: doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      is_on_call: doc.is_on_call || false,
      consultant_type: doc.consultant_type || (doc.is_on_call ? 'Visiting / On-Call' : 'Resident Consultant'),
      availability_status: doc.availability_status || 'Available'
    });
    setDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOnCall = docFormData.consultant_type === 'Visiting / On-Call';
    const payload = {
      ...docFormData,
      is_on_call: isOnCall,
      consultant_type: docFormData.consultant_type,
      availability_status: docFormData.availability_status
    };

    if (editingDoctor) {
      await api.updateDoctor(editingDoctor.id, payload);
    } else {
      await api.createDoctor({
        ...payload,
        availability_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        time_slots: ['09:00 AM', '11:00 AM', '01:00 PM', '06:00 PM', '08:00 PM'],
        is_active: true
      });
    }
    setDoctorModalOpen(false);
    await loadAllAdminData();
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate and remove Dr. ${name}?`)) {
      await api.deleteDoctor(id);
      await loadAllAdminData();
    }
  };

  const handleOpenObservationModal = (apt: Appointment) => {
    setSelectedObsAppointment(apt);
    setObservationModalOpen(true);
  };

  const handleSaveObservationModal = async (aptId: string, observationData: any) => {
    await api.saveClinicalObservation(aptId, observationData);
    await loadAllAdminData();
    if (selectedEhrPatient) {
      // Refresh selected EHR patient's state if modal is open
      const freshPt = patients.find(p => p.id === selectedEhrPatient.id);
      if (freshPt) setSelectedEhrPatient(freshPt);
    }
  };

  const handleOpenPrintSlip = (apt: Appointment, patientOverride?: User) => {
    setSelectedSlipAppointment(apt);
    const targetPatient = patientOverride || patients.find(p => p.id === apt.user_id) || null;
    setSelectedSlipPatient(targetPatient);
    setPrintableSlipModalOpen(true);
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: Appointment['status']) => {
    await api.updateAppointmentStatus(id, newStatus);
    await loadAllAdminData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return true;

    const patientApts = appointments.filter(a => a.user_id === p.id);
    const hasDiagnosisMatch = patientApts.some(a => 
      (a.diagnosis && a.diagnosis.toLowerCase().includes(q)) ||
      (a.reason && a.reason.toLowerCase().includes(q)) ||
      (a.prescribed_medicines && a.prescribed_medicines.some(m => m.name.toLowerCase().includes(q)))
    );

    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.blood_group && p.blood_group.toLowerCase().includes(q)) ||
      (p.patient_code && p.patient_code.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      hasDiagnosisMatch
    );
  });

  const todayDateStr = new Date().toISOString().split('T')[0];

  const todayAptsCount = appointments.filter(a => a.appointment_date === todayDateStr || !a.appointment_date).length;
  const previousAptsCount = appointments.filter(a => a.appointment_date && a.appointment_date !== todayDateStr).length;

  const filteredAppointments = appointments.filter((apt) => {
    const isTodayApt = apt.appointment_date === todayDateStr || !apt.appointment_date;
    const matchesWindow = opdLogWindow === 'today' ? isTodayApt : !isTodayApt;

    const matchesStatus = aptStatusFilter === 'all' || apt.status === aptStatusFilter;
    const matchesSearch =
      apt.user_name.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.doctor_name.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.department.toLowerCase().includes(aptSearch.toLowerCase()) ||
      (apt.patient_code && apt.patient_code.toLowerCase().includes(aptSearch.toLowerCase()));
      
    return matchesWindow && matchesStatus && matchesSearch;
  });

  const filteredDepartments = departments.filter((d) => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.lead_doctor.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.description.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(docSearch.toLowerCase()) ||
    doc.department.toLowerCase().includes(docSearch.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(docSearch.toLowerCase())
  );

  const COLORS = ['#059669', '#0d9488', '#0284c7', '#d97706', '#dc2626'];

  // Helper for selected EHR Patient's appointments and reports
  const selectedPatientApts = selectedEhrPatient 
    ? appointments.filter(a => a.user_id === selectedEhrPatient.id)
    : [];

  const selectedPatientReports = selectedEhrPatient
    ? reports.filter(r => r.user_id === selectedEhrPatient.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin / Receptionist Header Banner */}
        {isReceptionist ? (
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Reception Desk Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase">
                  Restricted Access Mode
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">OPD Appointment Booking & Walk-In Desk</h1>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                Register walk-in patients, schedule OPD consultations, search doctor availability, and print consultation slips. Administrative financial data & system settings are strictly prohibited.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
                  autoRefreshEnabled
                    ? 'bg-purple-900/90 border-purple-500/50 text-purple-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle Auto Refresh for Reception Desk Log"
              >
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>Auto-Refresh: {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
                <span className="text-[10px] text-purple-300 font-mono hidden sm:inline">({lastRefreshedTime})</span>
              </button>

              <button
                onClick={() => setWalkInModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> ➕ Register Walk-In Patient & Book OPD
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FolderHeart className="w-3.5 h-3.5" /> Electronic Health Record (EHR) & Admin Panel
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Shree Krishna Hospital CMS & Patient EHR</h1>
              <p className="text-xs text-slate-400">Complete maintenance of patient health histories, OPD consultations, diagnostic reports, and medical faculty.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Auto Refresh Status Badge & Toggle */}
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
                  autoRefreshEnabled
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Auto Refresh Hospital Dashboard"
              >
                <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>Auto-Refresh: {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({lastRefreshedTime})</span>
              </button>

              {/* IPD Admissions Manager */}
              <button
                onClick={() => setIpdModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <BedDouble className="w-4 h-4 text-emerald-400" /> IPD Beds
              </button>

              {/* Hospital Seal & Stamp Config */}
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Seal & Legal
              </button>

              {/* Supabase PostgreSQL Schema */}
              <button
                onClick={() => setSupabaseSchemaModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="View & Download Supabase PostgreSQL Table Schemas & DDL"
              >
                <Database className="w-4 h-4 text-emerald-400" /> Supabase SQL
              </button>

              <button
                onClick={handleOpenAddPatient}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Register Patient
              </button>
            </div>
          </div>
        )}

        {/* Main Vertical Layout: Sidebar Navigation on Left + Content on Right */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT VERTICAL SIDEBAR */}
          <aside className="w-full lg:w-72 flex-shrink-0 bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-2 lg:sticky lg:top-24">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isReceptionist ? 'Reception Desk Navigation' : 'Hospital Records & Modules'}
              </span>
            </div>

            {isReceptionist ? (
              <div className="space-y-2">
                <button
                  onClick={() => setAdminSubTab('appointments')}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between bg-purple-700 text-white shadow-lg shadow-purple-700/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20 text-white">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span>OPD Booking Desk</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-900 text-white">
                    {appointments.length}
                  </span>
                </button>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] space-y-1.5 mt-4">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-700" /> Front Desk Access Restricted
                  </div>
                  <p className="text-amber-800 text-[10px] leading-relaxed">
                    You are logged in as Receptionist. Access is restricted exclusively to OPD Appointment Booking & Walk-In Patient Registration. All other admin records are blocked by Super Administrator policy.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: PATIENT HEALTH RECORDS (PRIMARY REQ) */}
                <button
                  onClick={() => setAdminSubTab('patients')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'patients'
                      ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'patients' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <FolderHeart className="w-4 h-4" />
                    </div>
                    <span>Patient Health Records (EHR)</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'patients' ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {patients.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminSubTab('appointments')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'appointments'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'appointments' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span>Appointments History</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'appointments' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {appointments.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminSubTab('analytics')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'analytics'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <span>Analytics Overview</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${adminSubTab === 'analytics' ? 'translate-x-0.5 text-emerald-400' : 'text-slate-300 group-hover:text-slate-500'}`} />
                </button>

                <button
                  onClick={() => setAdminSubTab('departments')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'departments'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'departments' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>Manage Departments</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'departments' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {departments.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminSubTab('doctors')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'doctors'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'doctors' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span>Manage Doctors</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'doctors' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {doctors.length}
                  </span>
                </button>

                {/* TAB: STAFF CATEGORIES & DESIGNATIONS */}
                <button
                  onClick={() => setAdminSubTab('staff')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'staff'
                      ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'staff' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span>Staff Categories & Roles</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'staff' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Roles
                  </span>
                </button>

                {/* TAB: ACCOUNTING & FINANCIAL LEDGER */}
                <button
                  onClick={() => setAdminSubTab('accounting')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'accounting'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'accounting' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span>Accounting & Revenue Ledger</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'accounting' ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    Financial
                  </span>
                </button>

                {/* TAB: PHARMACY & SUPPLIES INVENTORY */}
                <button
                  onClick={() => setAdminSubTab('inventory')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'inventory'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'inventory' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Pill className="w-4 h-4" />
                    </div>
                    <span>Pharmacy & Supplies Stock</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'inventory' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Stock
                  </span>
                </button>

                {/* TAB: DIAGNOSTIC TESTS & LAB MASTER */}
                <button
                  onClick={() => setAdminSubTab('tests')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'tests'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'tests' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <span>Diagnostic Tests & Lab Price Catalog</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'tests' ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    Tests Master
                  </span>
                </button>

                {/* TAB: AI DESK CHATBOT FIXED Q&A RULES */}
                <button
                  onClick={() => setAdminSubTab('bot_faqs')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'bot_faqs'
                      ? 'bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-lg shadow-teal-900/20 border border-teal-700/50'
                      : 'text-slate-600 hover:bg-teal-50/80 hover:text-teal-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'bot_faqs' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-teal-100 text-teal-800 group-hover:bg-teal-200'
                    }`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <span>AI Assistant Q&A Rules</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'bot_faqs' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-teal-100 text-teal-900'
                  }`}>
                    Bot FAQ
                  </span>
                </button>

                {/* TAB: ROOM & WARD CHARGES MASTER */}
                <button
                  onClick={() => setAdminSubTab('ward_charges')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'ward_charges'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'ward_charges' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <span>Room & Ward Charges Master</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminSubTab === 'ward_charges' ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Ward Rates
                  </span>
                </button>


                {/* Super Admin Passkey Monitor Button */}
                <button
                  onClick={() => setDoctorSecurityModalOpen(true)}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] text-white font-bold">Doctor Logins & Security</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Passkey
                  </span>
                </button>

                <button
                  onClick={() => setAdminSubTab('supabase')}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    adminSubTab === 'supabase'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      adminSubTab === 'supabase' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Supabase DDL & Rules</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${adminSubTab === 'supabase' ? 'translate-x-0.5 text-emerald-400' : 'text-slate-300 group-hover:text-slate-500'}`} />
                </button>
              </>
            )}

            {/* EHR Quick System Summary Box */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                  <span>EHR Database</span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 space-y-1">
                  <div>📁 Total Patients: <strong className="text-white">{patients.length}</strong></div>
                  <div>📄 Diagnostic Reports: <strong className="text-white">{reports.length}</strong></div>
                  <div>🩺 OPD Visit Records: <strong className="text-white">{appointments.length}</strong></div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0 w-full space-y-6">

            {/* TAB 1: PATIENT HEALTH RECORDS & HISTORY (PRIMARY FOCUS) */}
            {adminSubTab === 'patients' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FolderHeart className="w-5 h-5 text-emerald-700" />
                      Hospital Patient Electronic Health Records ({patients.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Maintain complete clinical history, consultation logs, allergies, diagnostic lab reports, and medical case sheets.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search patient name, phone, blood group..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <button
                      onClick={() => setWalkInModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-800 transition-colors"
                      title="Direct hospital visit registration for patients without prior online booking"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-400" /> Walk-In OPD Check-In
                    </button>
                    <button
                      onClick={handleOpenAddPatient}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap hover:bg-emerald-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Patient
                    </button>
                  </div>
                </div>

                {/* Patients List / Directory with Medical Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPatients.map((p) => {
                    const pApts = appointments.filter(a => a.user_id === p.id);
                    const pReps = reports.filter(r => r.user_id === p.id);

                    return (
                      <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                        <div>
                          {/* Header Line */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <img 
                                src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                                alt={p.full_name} 
                                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
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
                                <p className="text-[11px] text-slate-500 font-mono">File ID: {p.id} • Registered {new Date(p.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold flex-shrink-0">
                              Blood Group {p.blood_group || 'B+'}
                            </span>
                          </div>

                          {/* Contact Details */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2.5">
                            <div><strong>Phone:</strong> {p.phone || 'N/A'}</div>
                            <div><strong>Age/Gender:</strong> {p.age || 'N/A'} Yrs / {p.gender || 'N/A'}</div>
                            <div className="col-span-2 truncate"><strong>Email:</strong> {p.email}</div>
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
                        </div>

                        {/* Summary Badges & Action Buttons */}
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
                              onClick={() => handleOpenEhrHistory(p)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow flex items-center gap-1.5"
                              title="View Complete Health History File"
                            >
                              <Eye className="w-3.5 h-3.5" /> Full EHR File
                            </button>
                            <button
                              onClick={() => handleOpenUploadReport(p)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                              title="Upload Diagnostic Report"
                            >
                              <FilePlus className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleOpenEditPatient(p)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                              title="Edit Patient Info"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(p.id, p.full_name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors"
                              title="Delete Patient Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 2: APPOINTMENTS HISTORY */}
            {adminSubTab === 'appointments' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                
                {/* TWO WINDOWS / TABS NAVIGATION FOR TODAY VS PREVIOUS OPD CONSULTATION LOG */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setOpdLogWindow('today')}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      opdLogWindow === 'today'
                        ? 'bg-white text-emerald-950 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>WINDOW 1: TODAY'S OPD CONSULTATION LOG</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      opdLogWindow === 'today' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {todayAptsCount} Today
                    </span>
                  </button>

                  <button
                    onClick={() => setOpdLogWindow('previous')}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      opdLogWindow === 'previous'
                        ? 'bg-white text-teal-950 shadow-md border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>WINDOW 2: PREVIOUS / HISTORIC OPD LOG</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      opdLogWindow === 'previous' ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {previousAptsCount} History
                    </span>
                  </button>
                </div>

                {/* Toolbar Controls */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>{opdLogWindow === 'today' ? "Today's Hospital Consultations & OPD Log" : "Historic OPD Consultations Log"}</span>
                      {opdLogWindow === 'today' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">Live OPD Desk</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {opdLogWindow === 'today' 
                        ? "Real-time queue of patient appointments & walk-ins registered for today's doctor consultations."
                        : "Archived consultation history of all past OPD visits prior to today."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    
                    {/* TOGGLE DISABLE / ENABLE SLIP & BILL PRINTING */}
                    <button
                      onClick={() => setPrintingDisabled(!printingDisabled)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                        printingDisabled
                          ? 'bg-rose-100 border-rose-300 text-rose-900 shadow-sm'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Enable or Disable printing of OPD Slips and Bill Receipts"
                    >
                      <Printer className={`w-3.5 h-3.5 ${printingDisabled ? 'text-rose-600' : 'text-emerald-600'}`} />
                      <span>Slips & Bills: {printingDisabled ? '🚫 DISABLED' : '✅ ENABLED'}</span>
                    </button>

                    {/* PRINT DAILY PAYMENT COLLECTION REPORT FOR ADMIN / SUPER ADMIN */}
                    <button
                      onClick={() => setDailyReportModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      title="Generate & Print Hard Copy Daily OPD Collection Report for Admin / Super Admin"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-200" />
                      <span>🖨️ Daily Collection Report</span>
                    </button>

                    {/* Auto-Refresh Live Status Indicator */}
                    <button
                      onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                        autoRefreshEnabled
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                      title="Toggle Real-Time Auto Refresh Log"
                    >
                      <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                      <span>Auto-Refresh: {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      onClick={() => loadAllAdminData()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Refresh Log Now"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    </button>

                    <select
                      value={aptStatusFilter}
                      onChange={(e) => setAptStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Search patient, code, doctor..."
                      value={aptSearch}
                      onChange={(e) => setAptSearch(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />

                    {/* RE-ASSIGN EXISTING PATIENT FROM HISTORY */}
                    <button
                      onClick={() => {
                        setWalkInInitialType('existing');
                        setWalkInModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
                      title="Select existing registered patient from history & assign to doctor"
                    >
                      <Search className="w-3.5 h-3.5 text-teal-200" />
                      <span>🔍 Existing Patient Walk-In</span>
                    </button>

                    {/* NEW WALK-IN OPD CHECK-IN */}
                    <button
                      onClick={() => {
                        setWalkInInitialType('new');
                        setWalkInModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      title="Register new walk-in hospital visit"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>➕ New Walk-In OPD</span>
                    </button>

                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Apt ID</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Doctor & Dept</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Reason / Notes</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-slate-500">{apt.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{apt.user_name}</div>
                            <div className="text-[10px] text-slate-400">{apt.user_phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-emerald-800">{apt.doctor_name}</div>
                            <div className="text-[10px] text-slate-500">{apt.department}</div>
                            {apt.referred_from_doctor_name && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                                  ↪️ Referred by Dr. {apt.referred_from_doctor_name}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{apt.appointment_date} at {apt.time_slot}</td>
                          <td className="p-3 text-slate-600 max-w-xs">
                            <p className="line-clamp-1">{apt.reason}</p>
                            {apt.notes && <p className="text-[10px] text-slate-400 italic">Notes: {apt.notes}</p>}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'completed' ? 'bg-blue-100 text-blue-800' : apt.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {apt.status === 'cancelled' ? (
                                <>
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed opacity-50"
                                    title="Prescribing is disabled for cancelled appointments"
                                  >
                                    <Stethoscope className="w-3 h-3 text-slate-400" /> Prescribe
                                  </button>

                                  <button
                                    disabled
                                    className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed opacity-50"
                                    title="Prescription slip is disabled for cancelled appointments"
                                  >
                                    <Printer className="w-3 h-3 text-slate-400" /> Slip
                                  </button>

                                  <button
                                    disabled
                                    className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed opacity-50"
                                    title="Bill receipt is disabled for cancelled appointments"
                                  >
                                    <FileText className="w-3 h-3 text-slate-400" /> Bill Receipt
                                  </button>
                                </>
                              ) : apt.status === 'completed' ? (
                                <>
                                  <button
                                    onClick={() => handleOpenObservationModal(apt)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                    title="View Read-Only Doctor Prescription Details"
                                  >
                                    <Stethoscope className="w-3 h-3 text-emerald-600" /> View Rx
                                  </button>

                                  <button
                                    disabled={printingDisabled}
                                    onClick={() => !printingDisabled && handleOpenPrintSlip(apt)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                                      printingDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 cursor-pointer shadow-xs'
                                    }`}
                                    title={printingDisabled ? 'Slip printing is currently DISABLED by Receptionist settings' : 'Print Authorized OPD Prescription Slip'}
                                  >
                                    <Printer className="w-3 h-3 text-emerald-600" /> Slip {printingDisabled && '(Disabled)'}
                                  </button>

                                  <button
                                    disabled={printingDisabled}
                                    onClick={() => {
                                      if (printingDisabled) return;
                                      setReceiptPatient({
                                        name: apt.user_name,
                                        code: apt.patient_code || 'SKMH-WALKIN',
                                        phone: apt.patient_phone || '+91 98000 00000',
                                        email: apt.user_email,
                                        doctor: apt.doctor_name,
                                        autoShowReceipt: false
                                      });
                                      setReceiptModalOpen(true);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                                      printingDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none'
                                        : 'bg-blue-700 hover:bg-blue-800 text-white shadow cursor-pointer'
                                    }`}
                                    title={printingDisabled ? 'Billing disabled' : 'Pay Patient Charges / Add Extra Hospital Charges'}
                                  >
                                    <CreditCard className="w-3 h-3 text-blue-200" /> Pay / Add Charges
                                  </button>

                                  <button
                                    disabled={printingDisabled}
                                    onClick={() => {
                                      if (printingDisabled) return;
                                      setReceiptPatient({
                                        name: apt.user_name,
                                        code: apt.patient_code || 'SKMH-WALKIN',
                                        phone: apt.patient_phone || '+91 98000 00000',
                                        email: apt.user_email,
                                        doctor: apt.doctor_name,
                                        autoShowReceipt: true
                                      });
                                      setReceiptModalOpen(true);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                                      printingDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none'
                                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow cursor-pointer'
                                    }`}
                                    title={printingDisabled ? 'Bill receipt printing is currently DISABLED by Receptionist settings' : 'Print Official Payment Receipt'}
                                  >
                                    <FileText className="w-3 h-3 text-emerald-300" /> Print Bill Receipt {printingDisabled && '(Disabled)'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[11px] flex items-center gap-1 cursor-not-allowed opacity-60"
                                    title="Prescribing is disabled for Receptionist/Admin. Only attending Doctor can prescribe from Doctor Portal."
                                  >
                                    <Stethoscope className="w-3 h-3 text-slate-400" /> Prescribe (Doctor Only)
                                  </button>

                                  <button
                                    disabled={printingDisabled}
                                    onClick={() => !printingDisabled && handleOpenPrintSlip(apt)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                                      printingDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                                    }`}
                                    title={printingDisabled ? 'Slip printing is currently DISABLED by Receptionist settings' : 'Print Consultation Slip'}
                                  >
                                    <Printer className="w-3 h-3 text-blue-600" /> Slip {printingDisabled && '(Disabled)'}
                                  </button>

                                  <button
                                    disabled={printingDisabled}
                                    onClick={() => {
                                      if (printingDisabled) return;
                                      setReceiptPatient({
                                        name: apt.user_name,
                                        code: apt.patient_code || 'SKMH-WALKIN',
                                        phone: apt.patient_phone || '+91 98000 00000',
                                        email: apt.user_email,
                                        doctor: apt.doctor_name,
                                        autoShowReceipt: false
                                      });
                                      setReceiptModalOpen(true);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                                      printingDisabled
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow cursor-pointer'
                                    }`}
                                    title="Fast Pay Patient's Charges, Add Extra Service Charges & Collect Bill Payment"
                                  >
                                    <CreditCard className="w-3 h-3 text-emerald-200" /> Pay / Add Charges
                                  </button>
                                </>
                              )}

                              {apt.status === 'completed' ? (
                                <select
                                  disabled
                                  value="completed"
                                  className="px-2 py-1 rounded-lg border border-emerald-300 text-xs font-black text-emerald-900 bg-emerald-100/90 cursor-not-allowed opacity-90 shadow-sm"
                                  title="Completed consultations cannot be changed to pending, cancelled or other statuses"
                                >
                                  <option value="completed">✓ Completed</option>
                                </select>
                              ) : (
                                <select
                                  value={apt.status}
                                  onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value as any)}
                                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white cursor-pointer hover:border-slate-300 focus:outline-none focus:border-emerald-600"
                                  title="Receptionist Permission: Confirm or Cancel appointments only. Consultation completion is reserved for attending Doctor."
                                >
                                  {apt.status === 'pending' && <option value="pending">Pending</option>}
                                  <option value="confirmed">Confirm</option>
                                  <option value="cancelled">Cancel</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: ANALYTICS OVERVIEW */}
            {adminSubTab === 'analytics' && stats && (
              <div className="space-y-6">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Registered Patients</span>
                    <div className="text-2xl font-black text-slate-900">{patients.length}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">+12% this month</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Active Departments</span>
                    <div className="text-2xl font-black text-slate-900">{departments.length}</div>
                    <span className="text-[10px] text-slate-500 font-semibold">{doctors.length} Doctors Assigned</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Pending Appointments</span>
                    <div className="text-2xl font-black text-amber-600">{stats.pending_appointments}</div>
                    <span className="text-[10px] text-amber-700 font-semibold">Requires Staff Review</span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Est. Monthly Revenue</span>
                    <div className="text-2xl font-black text-emerald-700">₹{stats.estimated_revenue.toLocaleString()}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">OPD Consultation Fees</span>
                  </div>
                </div>

                {/* Recharts Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Monthly Booking Trend & OPD Revenue</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthly_booking_trend}>
                          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#059669" radius={[6, 6, 0, 0]} name="Bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">Department Load Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.department_distribution}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {stats.department_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MANAGE DEPARTMENTS */}
            {adminSubTab === 'departments' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                      Hospital Clinical Departments ({departments.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add, edit, or remove hospital departments. Updates immediately sync with the public website & booking options.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <button
                      onClick={handleOpenAddDepartment}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add Department
                    </button>
                  </div>
                </div>

                {/* Departments Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDepartments.map((dept) => (
                    <div key={dept.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 hover:border-emerald-300 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <img 
                            src={dept.image_url} 
                            alt={dept.name} 
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-900 text-sm truncate">{dept.name}</h3>
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                {dept.beds_count} Beds
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-800 mt-0.5 flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" /> Lead: {dept.lead_doctor}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
                          </div>
                        </div>

                        {/* Equipment Badges */}
                        {dept.equipment_highlights && dept.equipment_highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                            {dept.equipment_highlights.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-medium">
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {dept.total_doctors} Faculty Doctors
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditDepartment(dept)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-600" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 5: MANAGE DOCTORS */}
            {adminSubTab === 'doctors' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Hospital Medical Faculty ({doctors.length})</h2>
                    <p className="text-xs text-slate-500">Manage doctor profiles, upload photo avatars, and toggle Resident vs On-Call consultant status.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setDoctorSecurityModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                      title="Super Admin Passkey Protected Doctor Security Console"
                    >
                      <Lock className="w-3.5 h-3.5" /> Doctor Security Logins
                    </button>
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search doctors..."
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <button
                      onClick={handleOpenAddDoctor}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add Doctor
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Doctor</th>
                        <th className="p-3">Consultant Type</th>
                        <th className="p-3">Live Availability Status</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Qualification</th>
                        <th className="p-3">OPD Fee</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDoctors.map((doc) => {
                        const status = doc.availability_status || 'Available';
                        let statusBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                        if (status === 'Not Available') statusBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';
                        else if (status === 'In OPD') statusBadgeStyle = 'bg-blue-50 text-blue-800 border-blue-300';
                        else if (status === 'In OT / Surgery') statusBadgeStyle = 'bg-purple-50 text-purple-800 border-purple-300';
                        else if (status === 'On Leave') statusBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
                        else if (status === 'Off Duty') statusBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';

                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEditDoctor(doc)}
                                className="relative group shrink-0"
                                title="Click to Upload/Change Doctor Photo"
                              >
                                <img src={doc.photo_url} alt={doc.name} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 shadow-sm group-hover:opacity-85 transition-opacity" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </div>
                              </button>
                              <div>
                                <div className="font-bold text-slate-900">{doc.name}</div>
                                <div className="text-[10px] font-normal text-slate-400">{doc.specialization}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              {doc.is_on_call ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3" /> Doctor On-Call
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> Resident Doctor
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="relative inline-block">
                                <select
                                  value={status}
                                  onChange={(e) => handleDoctorStatusChange(doc.id, doc.name, e.target.value as DoctorAvailabilityStatus)}
                                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer transition-all ${statusBadgeStyle}`}
                                  title="Change Live Status (Instantly updates 24/7 AI Chatbot)"
                                >
                                  <option value="Available">🟢 Available (On Desk)</option>
                                  <option value="Not Available">🔴 Not Available</option>
                                  <option value="In OPD">🔵 In OPD (Consulting)</option>
                                  <option value="In OT / Surgery">🩺 In OT / Surgery</option>
                                  <option value="On Leave">🟡 On Leave Today</option>
                                  <option value="Off Duty">⚪ Off Duty</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{doc.department}</td>
                          <td className="p-3 text-slate-600">{doc.qualification} ({doc.experience_years} Yrs Exp)</td>
                          <td className="p-3 font-black text-emerald-800">₹{doc.consultation_fee}</td>
                          <td className="p-3 font-bold text-amber-600">★ {doc.rating}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditDoctor(doc)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                                title="Edit Doctor"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors"
                                title="Delete Doctor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: SUPABASE CONFIG */}
            {adminSubTab === 'supabase' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Supabase SQL Schema Script</h2>
                    <p className="text-xs text-slate-500">Copy & run this script directly in your Supabase SQL Editor to provision tables & RLS policies.</p>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1.5"
                  >
                    {sqlCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    {sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                  </button>
                </div>

                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-xs overflow-x-auto font-mono max-h-96">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            )}

            {/* TAB 7: STAFF CATEGORIES & DESIGNATIONS */}
            {adminSubTab === 'staff' && (
              <StaffManagementSection />
            )}

            {/* TAB 8: ACCOUNTING & FINANCIAL LEDGER */}
            {adminSubTab === 'accounting' && (
              <AccountingManagerSection />
            )}

            {/* TAB 9: PHARMACY & SUPPLIES INVENTORY */}
            {adminSubTab === 'inventory' && (
              <InventoryManagerSection />
            )}

            {/* TAB 10: DIAGNOSTIC TESTS & LAB MASTER */}
            {adminSubTab === 'tests' && (
              <DiagnosticTestsManagerSection />
            )}

            {/* TAB 11: AI DESK CHATBOT FIXED Q&A RULES */}
            {adminSubTab === 'bot_faqs' && (
              <BotFaqManagerSection />
            )}

            {/* TAB 12: ROOM & WARD CHARGES MASTER */}
            {adminSubTab === 'ward_charges' && (
              <WardRoomChargesManagerSection />
            )}



          </main>
        </div>

      </div>

      {/* ================= PATIENT ELECTRONIC HEALTH RECORD (EHR) FULL MODAL ================= */}
      {selectedEhrPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[94vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedEhrPatient.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                  alt={selectedEhrPatient.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      Patient Health Record File
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {selectedEhrPatient.id}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedEhrPatient.full_name}</h2>
                  <p className="text-xs text-slate-500">{selectedEhrPatient.email} • Phone: {selectedEhrPatient.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Case Sheet
                </button>
                <button 
                  onClick={() => setSelectedEhrPatient(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Demographics & Safety Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</span>
                <span className="font-extrabold text-emerald-800 text-sm">{selectedEhrPatient.blood_group || 'B+'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Age / Gender</span>
                <span className="font-bold text-slate-800">{selectedEhrPatient.age || 40} Yrs / {selectedEhrPatient.gender || 'Male'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Emergency Contact</span>
                <span className="font-bold text-slate-800 truncate block">{selectedEhrPatient.emergency_contact || 'None Recorded'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Reg Date</span>
                <span className="font-bold text-slate-800">{new Date(selectedEhrPatient.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Medical Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Known Allergies
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedEhrPatient.allergies && selectedEhrPatient.allergies.length > 0 ? (
                    selectedEhrPatient.allergies.map((alg, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-rose-900 border border-rose-200 text-[10px] font-bold">
                        {alg}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-rose-700 font-medium">No drug/substance allergies reported.</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-600" /> Chronic Conditions & History
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedEhrPatient.chronic_conditions && selectedEhrPatient.chronic_conditions.length > 0 ? (
                    selectedEhrPatient.chronic_conditions.map((cond, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-200 text-[10px] font-bold">
                        {cond}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium">No chronic ailments recorded.</span>
                  )}
                </div>
              </div>
            </div>

            {/* EHR Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setEhrActiveTab('timeline')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ehrActiveTab === 'timeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> OPD Visits ({selectedPatientApts.length})
              </button>
              <button
                onClick={() => setEhrActiveTab('reports')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ehrActiveTab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Diagnostics & Reports ({selectedPatientReports.length})
              </button>
              <button
                onClick={() => setEhrActiveTab('conditions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ehrActiveTab === 'conditions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Edit className="w-3.5 h-3.5" /> Edit Medical Summary
              </button>
            </div>

            {/* SUB-TAB 1: OPD VISITS & APPOINTMENTS TIMELINE */}
            {ehrActiveTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">Consultation Timeline & Doctor Notes</h4>
                  <span className="text-[11px] text-slate-500 font-medium">Recorded at Shree Krishna Hospital OPD</span>
                </div>

                {selectedPatientApts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl border text-center">
                    No OPD appointment records logged yet for this patient.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientApts.map((apt) => (
                      <div key={apt.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{apt.appointment_date} at {apt.time_slot}</span>
                            <h5 className="font-bold text-slate-900 text-sm mt-0.5">{apt.doctor_name}</h5>
                            <p className="text-xs font-semibold text-emerald-800">{apt.department}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                          <div>
                            <strong>Chief Complaint:</strong> {apt.reason}
                          </div>

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
                              <strong className="text-emerald-900 block text-[11px] uppercase tracking-wider">Clinical Diagnosis:</strong>
                              <p className="font-bold text-xs">{apt.diagnosis}</p>
                            </div>
                          )}

                          {apt.prescribed_medicines && apt.prescribed_medicines.length > 0 && (
                            <div className="space-y-1">
                              <strong className="text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                                <Pill className="w-3 h-3 text-emerald-600" /> Prescribed Medications (Rx):
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
                              <strong className="text-slate-700 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                                <FileCheck2 className="w-3 h-3 text-blue-600" /> Recommended Tests:
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
                                <Share2 className="w-3.5 h-3.5 text-amber-700" /> Referred To Higher Center ({apt.higher_reference.urgency}):
                              </div>
                              <p className="text-[11px]"><strong>Hospital:</strong> {apt.higher_reference.referred_to_hospital} ({apt.higher_reference.specialist_center})</p>
                              <p className="text-[11px]"><strong>Reason:</strong> {apt.higher_reference.referral_reason}</p>
                            </div>
                          )}

                          {apt.notes && (
                            <div className="mt-1 text-slate-600 border-t border-slate-100 pt-1">
                              <strong>Clinical Advice / Notes:</strong> {apt.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenObservationModal(apt)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow flex items-center gap-1"
                          >
                            <Stethoscope className="w-3.5 h-3.5" /> Record / Edit Observations
                          </button>
                          {apt.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPrintSlip(apt, selectedEhrPatient)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" /> Print OPD Slip
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: DIAGNOSTIC REPORTS */}
            {ehrActiveTab === 'reports' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Patient Lab Reports, X-Rays & Prescriptions</h4>
                  <button
                    onClick={() => handleOpenUploadReport(selectedEhrPatient)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Attach New Report
                  </button>
                </div>

                {selectedPatientReports.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl border text-center">
                    No medical reports uploaded yet for this patient.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPatientReports.map((rep) => (
                      <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                              {rep.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{new Date(rep.uploaded_at).toLocaleDateString()}</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-xs mt-1.5">{rep.title}</h5>
                          {rep.doctor_notes && (
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">Note: {rep.doctor_notes}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{rep.file_size} • {rep.file_name}</span>
                          <a
                            href={rep.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-white border border-slate-300 font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" /> View File
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: EDIT CLINICAL SUMMARY FORM */}
            {ehrActiveTab === 'conditions' && (
              <form onSubmit={handleSaveEhrClinicalHistory} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">Update Patient Medical History & Ailments</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Known Drug / Food Allergies</label>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Dust Mites, Sulfa"
                      value={patientClinicalFormData.allergies}
                      onChange={(e) => setPatientClinicalFormData({ ...patientClinicalFormData, allergies: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chronic Conditions</label>
                    <input
                      type="text"
                      placeholder="e.g. Stage 1 Hypertension, Type 2 Diabetes"
                      value={patientClinicalFormData.chronic_conditions}
                      onChange={(e) => setPatientClinicalFormData({ ...patientClinicalFormData, chronic_conditions: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Contact Person & Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98000 00000 (Spouse)"
                      value={patientClinicalFormData.emergency_contact}
                      onChange={(e) => setPatientClinicalFormData({ ...patientClinicalFormData, emergency_contact: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Residential address..."
                      value={patientClinicalFormData.address}
                      onChange={(e) => setPatientClinicalFormData({ ...patientClinicalFormData, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Comprehensive Clinical Notes & Surgery History</label>
                  <textarea
                    rows={3}
                    placeholder="Enter past surgery history, chronic medication regimes..."
                    value={patientClinicalFormData.medical_history_notes}
                    onChange={(e) => setPatientClinicalFormData({ ...patientClinicalFormData, medical_history_notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500 transition-colors"
                  >
                    Save Clinical History Changes
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ================= ADD / EDIT PATIENT MODAL ================= */}
      {patientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSavePatient} className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPatient ? 'Edit Patient Demographic Record' : 'Register New Patient File'}
                </h3>
              </div>
              <button type="button" onClick={() => setPatientModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Patient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rameshchandra Patel"
                value={patientFormData.full_name}
                onChange={(e) => setPatientFormData({ ...patientFormData, full_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="patient@gmail.com"
                  value={patientFormData.email}
                  onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 00000"
                  value={patientFormData.phone}
                  onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Age (Yrs)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={patientFormData.age}
                  onChange={(e) => setPatientFormData({ ...patientFormData, age: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Gender</label>
                <select
                  value={patientFormData.gender}
                  onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Blood Group</label>
                <select
                  value={patientFormData.blood_group}
                  onChange={(e) => setPatientFormData({ ...patientFormData, blood_group: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-emerald-800"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Allergies (comma separated)</label>
                <input
                  type="text"
                  placeholder="Penicillin, Sulfa"
                  value={patientFormData.allergies}
                  onChange={(e) => setPatientFormData({ ...patientFormData, allergies: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Chronic Conditions</label>
                <input
                  type="text"
                  placeholder="Hypertension, Asthma"
                  value={patientFormData.chronic_conditions}
                  onChange={(e) => setPatientFormData({ ...patientFormData, chronic_conditions: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Medical Notes & History Summary</label>
              <textarea
                rows={2}
                placeholder="Initial diagnosis, past surgeries or clinical notes..."
                value={patientFormData.medical_history_notes}
                onChange={(e) => setPatientFormData({ ...patientFormData, medical_history_notes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500"
              >
                {editingPatient ? 'Save Patient Details' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= UPLOAD REPORT MODAL ================= */}
      {uploadReportModalOpen && reportPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveUploadReport} className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Attach Diagnostic Report</h3>
                  <p className="text-xs text-slate-500">For Patient: <strong>{reportPatient.full_name}</strong></p>
                </div>
              </div>
              <button type="button" onClick={() => setUploadReportModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Full Body Pathology & Blood Glucose"
                value={reportFormData.title}
                onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Category</label>
                <select
                  value={reportFormData.category}
                  onChange={(e) => setReportFormData({ ...reportFormData, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
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
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={reportFormData.file_name}
                  onChange={(e) => setReportFormData({ ...reportFormData, file_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Doctor Findings & Clinical Notes</label>
              <textarea
                rows={3}
                placeholder="Key observations, reference ranges, follow-up advice..."
                value={reportFormData.doctor_notes}
                onChange={(e) => setReportFormData({ ...reportFormData, doctor_notes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUploadReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-500"
              >
                Attach Report to Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DEPARTMENT ADD / EDIT MODAL ================= */}
      {departmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveDepartment} className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingDepartment ? 'Edit Department Details' : 'Add New Department'}
                </h3>
              </div>
              <button type="button" onClick={() => setDepartmentModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Gastroenterology & Hepatology"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Lead Doctor / HOD</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Senior Specialist"
                  value={deptFormData.lead_doctor}
                  onChange={(e) => setDeptFormData({ ...deptFormData, lead_doctor: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Icon Representation</label>
                <select
                  value={deptFormData.icon_name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, icon_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Activity">Activity / Cardiology</option>
                  <option value="HeartPulse">HeartPulse / Cardiac</option>
                  <option value="Brain">Brain / Neurology</option>
                  <option value="Bone">Bone / Orthopedics</option>
                  <option value="Baby">Baby / Pediatrics</option>
                  <option value="Stethoscope">Stethoscope / General</option>
                  <option value="Building2">Building / Facility</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Total Doctors Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={deptFormData.total_doctors}
                  onChange={(e) => setDeptFormData({ ...deptFormData, total_doctors: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dedicated Beds Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={deptFormData.beds_count}
                  onChange={(e) => setDeptFormData({ ...deptFormData, beds_count: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department Description</label>
              <textarea
                rows={2}
                required
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepartmentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500"
              >
                {editingDepartment ? 'Save Department Changes' : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DOCTOR ADD / EDIT MODAL ================= */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveDoctor} className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingDoctor ? 'Edit Doctor Profile' : 'Add New Medical Faculty'}
                </h3>
              </div>
              <button type="button" onClick={() => setDoctorModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Doctor Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Rajesh Krishna"
                value={docFormData.name}
                onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* DOCTOR IMAGE / PHOTO SECTION */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-extrabold uppercase text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" /> Doctor Profile Photo / Image
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Upload Local File or Pick Avatar</span>
              </label>

              <div className="flex items-center gap-4">
                {/* Live Avatar Preview */}
                <div className="relative group shrink-0">
                  <img
                    src={docFormData.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                    alt="Doctor Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg cursor-pointer shadow border border-white transition-transform hover:scale-110">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDoctorPhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Upload & URL Controls */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Upload Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDoctorPhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, WEBP (Max 5MB)</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Or paste Doctor Photo Image URL (http://...)"
                    value={docFormData.photo_url}
                    onChange={(e) => setDocFormData({ ...docFormData, photo_url: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Quick Select Stock Photo Gallery */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-500 block mb-1.5">Quick Select Hospital Avatar Presets:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { name: 'Senior Male', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Female Specialist', url: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Male Specialist', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Female MD', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Surgeon', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400' }
                  ].map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setDocFormData({ ...docFormData, photo_url: preset.url })}
                      className={`shrink-0 flex items-center gap-1.5 p-1 rounded-xl border text-[10px] font-bold transition-all ${
                        docFormData.photo_url === preset.url
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-6 h-6 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <span className="pr-1">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Consultant Type</label>
                <select
                  value={docFormData.consultant_type}
                  onChange={(e) => setDocFormData({ ...docFormData, consultant_type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-emerald-800"
                >
                  <option value="Resident Consultant">Resident Consultant</option>
                  <option value="Visiting / On-Call">Visiting / On-Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Live Availability Status</label>
                <select
                  value={docFormData.availability_status}
                  onChange={(e) => setDocFormData({ ...docFormData, availability_status: e.target.value as DoctorAvailabilityStatus })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-extrabold text-teal-900"
                >
                  <option value="Available">🟢 Available (On Desk)</option>
                  <option value="Not Available">🔴 Not Available</option>
                  <option value="In OPD">🔵 In OPD (Consulting)</option>
                  <option value="In OT / Surgery">🩺 In OT / Surgery</option>
                  <option value="On Leave">🟡 On Leave Today</option>
                  <option value="Off Duty">⚪ Off Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department</label>
                <select
                  value={docFormData.department}
                  onChange={(e) => setDocFormData({ ...docFormData, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  placeholder="Orthopaedic Specialist"
                  value={docFormData.specialization}
                  onChange={(e) => setDocFormData({ ...docFormData, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  required
                  placeholder="(M.B.B.S, M.S)"
                  value={docFormData.qualification}
                  onChange={(e) => setDocFormData({ ...docFormData, qualification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={docFormData.experience_years}
                  onChange={(e) => setDocFormData({ ...docFormData, experience_years: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">OPD Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={docFormData.consultation_fee}
                  onChange={(e) => setDocFormData({ ...docFormData, consultation_fee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500"
              >
                {editingDoctor ? 'Save Doctor Changes' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= CLINICAL OBSERVATION & PRESCRIPTION MODAL ================= */}
      <ClinicalObservationModal
        isOpen={observationModalOpen}
        onClose={() => setObservationModalOpen(false)}
        appointment={selectedObsAppointment}
        onSave={handleSaveObservationModal}
        readOnly={true}
        onOpenPrintSlip={(apt) => handleOpenPrintSlip(apt)}
      />

      {/* ================= PRINTABLE CONSULTATION & PRESCRIPTION SLIP ================= */}
      <PrintableConsultationSlip
        isOpen={printableSlipModalOpen}
        onClose={() => setPrintableSlipModalOpen(false)}
        appointment={selectedSlipAppointment}
        patient={selectedSlipPatient}
      />

      {/* ================= DIRECT HOSPITAL WALK-IN REGISTRATION & OPD MODAL ================= */}
      <WalkInRegistrationModal
        isOpen={walkInModalOpen}
        initialRegistrationType={walkInInitialType}
        onClose={() => setWalkInModalOpen(false)}
        onSuccess={(newApt, newPatient) => {
          setAppointments(prev => [newApt, ...prev.filter(a => a.id !== newApt.id)]);
          setPatients(prev => [newPatient, ...prev.filter(p => p.id !== newPatient.id)]);
          if (!printingDisabled) {
            setSelectedSlipAppointment(newApt);
            setSelectedSlipPatient(newPatient);
            setPrintableSlipModalOpen(true);
          }
        }}
      />

      {/* ================= DAILY PAYMENT COLLECTION REPORT MODAL (HARD COPY) ================= */}
      <DailyPaymentReportModal
        isOpen={dailyReportModalOpen}
        onClose={() => setDailyReportModalOpen(false)}
        appointments={appointments}
        doctors={doctors}
      />

      {/* ================= SUPER ADMIN DOCTOR LOGIN SECURITY MONITOR MODAL ================= */}
      <DoctorSecurityMonitorModal
        isOpen={doctorSecurityModalOpen}
        onClose={() => setDoctorSecurityModalOpen(false)}
        onDoctorUpdated={loadAllAdminData}
      />

      {/* ================= PAYMENT RECEIPT BILLING MODAL (CASH / UPI QR / CARD) ================= */}
      <PaymentReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        patientName={receiptPatient.name}
        patientCode={receiptPatient.code}
        patientPhone={receiptPatient.phone}
        patientEmail={receiptPatient.email}
        doctorName={receiptPatient.doctor}
        autoShowReceipt={receiptPatient.autoShowReceipt}
        onPaymentSuccess={() => {
          loadAllAdminData();
          setToastMessage({
            id: Date.now().toString(),
            title: 'Payment Received',
            description: `Payment bill receipt generated for ${receiptPatient.name}`,
            timestamp: new Date().toLocaleTimeString()
          });
        }}
      />

      {/* ================= INPATIENT ADMISSIONS & WARD BEDS (IPD) MODAL ================= */}
      <InpatientManagerModal
        isOpen={ipdModalOpen}
        onClose={() => setIpdModalOpen(false)}
        onOpenBillingReceipt={(ipd) => {
          setReceiptPatient({
            id: ipd.patient_id || ipd.patient_code,
            name: ipd.patient_name,
            code: ipd.patient_code,
            phone: ipd.phone,
            email: '',
            doctor: ipd.doctor_name,
            autoShowReceipt: true
          });
          setIpdModalOpen(false);
          setReceiptModalOpen(true);
        }}
      />

      {/* ================= HOSPITAL SEAL STAMP & LEGAL POLICY SETTINGS MODAL ================= */}
      <HospitalSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* ================= SUPABASE DATABASE SCHEMA & TABLE DICTIONARY MODAL ================= */}
      <SupabaseSchemaModal
        isOpen={supabaseSchemaModalOpen}
        onClose={() => setSupabaseSchemaModalOpen(false)}
      />

      {/* ================= AUDIO NOTIFICATION CHIME TOAST ================= */}
      <AudioNotificationToast
        toast={toastMessage}
        onClose={() => setToastMessage(null)}
      />

    </div>
  );
};
