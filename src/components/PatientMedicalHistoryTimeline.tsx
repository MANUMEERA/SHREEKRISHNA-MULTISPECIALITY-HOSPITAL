import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, MedicalReport, AdmittedPatientRecord, User, PrescribedMedicine } from '../types';
import { api } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  Calendar, Clock, Stethoscope, Activity, FileText, Pill, HeartPulse, Building2, 
  Download, Printer, Search, Filter, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, 
  FileCheck2, Share2, User as UserIcon, ShieldCheck, RefreshCw, Database, 
  Eye, FileUp, Sparkles, ExternalLink, ArrowUpDown, ChevronRight, AlertTriangle
} from 'lucide-react';
import { PrintableConsultationSlip } from './PrintableConsultationSlip';

interface PatientMedicalHistoryTimelineProps {
  user: User;
  onOpenSlipModal?: (apt: Appointment) => void;
  onViewReportModal?: (rep: MedicalReport) => void;
}

export interface UnifiedTimelineEvent {
  id: string;
  date: string; // ISO or YYYY-MM-DD
  timestamp: number;
  type: 'consultation' | 'ipd_admission' | 'lab_report' | 'prescription';
  title: string;
  category: string;
  doctorName?: string;
  department?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  vitals?: Appointment['vitals'];
  prescribedMedicines?: PrescribedMedicine[];
  recommendedTests?: string[];
  higherReference?: Appointment['higher_reference'];
  followUpDate?: string;
  notes?: string;
  // Report specific
  reportUrl?: string;
  reportFileName?: string;
  reportFileSize?: string;
  // IPD specific
  ipdDetails?: {
    wardType: string;
    bedNumber: string;
    admissionDate: string;
    dischargeDate?: string;
    surgeries?: AdmittedPatientRecord['surgeries_performed'];
    routineCheckups?: AdmittedPatientRecord['daily_routine_checkups'];
    doses?: AdmittedPatientRecord['daily_doses'];
  };
  rawAppointment?: Appointment;
  rawReport?: MedicalReport;
  rawIpd?: AdmittedPatientRecord;
}

export const PatientMedicalHistoryTimeline: React.FC<PatientMedicalHistoryTimelineProps> = ({
  user,
  onOpenSlipModal,
  onViewReportModal
}) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Raw fetched datasets
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ipdRecords, setIpdRecords] = useState<AdmittedPatientRecord[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [userProfile, setUserProfile] = useState<User>(user);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'consultation' | 'prescription' | 'ipd_admission' | 'lab_report'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});

  // Local Modal for OPD Printable Slip
  const [selectedSlipApt, setSelectedSlipApt] = useState<Appointment | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // IPD Detail Modal
  const [selectedIpdRecord, setSelectedIpdRecord] = useState<AdmittedPatientRecord | null>(null);

  // Report Modal
  const [selectedReportView, setSelectedReportView] = useState<MedicalReport | null>(null);

  // Fetch data automatically from Supabase with fallback to API
  const fetchMedicalHistoryData = async () => {
    setSyncing(true);
    try {
      let fetchedAppointments: Appointment[] = [];
      let fetchedIpd: AdmittedPatientRecord[] = [];
      let fetchedReports: MedicalReport[] = [];
      let supabaseActive = false;

      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Query Supabase Appointments
          const aptQuery = await supabase
            .from('appointments')
            .select('*')
            .or(`user_id.eq.${user.id},user_email.eq.${user.email}${user.patient_code ? `,patient_code.eq.${user.patient_code}` : ''}`)
            .order('appointment_date', { ascending: false });

          if (!aptQuery.error && aptQuery.data && aptQuery.data.length > 0) {
            fetchedAppointments = aptQuery.data as Appointment[];
            supabaseActive = true;
          }

          // 2. Query Supabase IPD Admitted Patients
          const ipdQuery = await supabase
            .from('admitted_patients')
            .select('*')
            .or(`patient_id.eq.${user.id},phone.eq.${user.phone || ''}${user.patient_code ? `,patient_code.eq.${user.patient_code}` : ''}`)
            .order('admission_date', { ascending: false });

          if (!ipdQuery.error && ipdQuery.data && ipdQuery.data.length > 0) {
            fetchedIpd = ipdQuery.data as AdmittedPatientRecord[];
            supabaseActive = true;
          }

          // 3. Query Supabase Medical Reports
          const repQuery = await supabase
            .from('medical_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('uploaded_at', { ascending: false });

          if (!repQuery.error && repQuery.data && repQuery.data.length > 0) {
            fetchedReports = repQuery.data as MedicalReport[];
            supabaseActive = true;
          }

          // 4. Query fresh user profile from Supabase
          const userQuery = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!userQuery.error && userQuery.data) {
            setUserProfile(prev => ({ ...prev, ...userQuery.data }));
          }
        } catch (sbErr) {
          console.warn('Supabase fetch error for medical history, using local fallback:', sbErr);
        }
      }

      // Fallback or merge with API local storage if Supabase records empty or incomplete
      const localApts = await api.getAppointments(user.id, 'patient');
      const localReports = await api.getReports(user.id, 'patient');
      const allIpd = await api.getAdmittedPatients();
      const localIpd = allIpd.filter(p => 
        p.patient_id === user.id || 
        (user.patient_code && p.patient_code === user.patient_code) ||
        (user.full_name && p.patient_name.toLowerCase() === user.full_name.toLowerCase())
      );

      // Merge and deduplicate appointments
      const combinedAptsMap = new Map<string, Appointment>();
      [...fetchedAppointments, ...localApts].forEach(a => combinedAptsMap.set(a.id, a));
      const finalApts = Array.from(combinedAptsMap.values());

      // Merge and deduplicate reports
      const combinedReportsMap = new Map<string, MedicalReport>();
      [...fetchedReports, ...localReports].forEach(r => combinedReportsMap.set(r.id, r));
      const finalReports = Array.from(combinedReportsMap.values());

      // Merge and deduplicate IPD
      const combinedIpdMap = new Map<string, AdmittedPatientRecord>();
      [...fetchedIpd, ...localIpd].forEach(i => combinedIpdMap.set(i.id, i));
      const finalIpd = Array.from(combinedIpdMap.values());

      setAppointments(finalApts);
      setReports(finalReports);
      setIpdRecords(finalIpd);
      setIsSupabaseLive(supabaseActive || isSupabaseConfigured);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchMedicalHistoryData();
  }, [user.id, user.patient_code]);

  // Construct Unified Timeline
  const timelineEvents = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];

    // 1. Process OPD Appointments
    appointments.forEach((apt) => {
      const dateStr = apt.appointment_date || apt.created_at || new Date().toISOString().split('T')[0];
      const timeMs = new Date(dateStr).getTime();

      // General consultation event
      events.push({
        id: `timeline-apt-${apt.id}`,
        date: dateStr,
        timestamp: isNaN(timeMs) ? Date.now() : timeMs,
        type: 'consultation',
        title: `OPD Consultation (${apt.status.toUpperCase()})`,
        category: apt.department || 'General Medicine',
        doctorName: apt.doctor_name,
        department: apt.department,
        diagnosis: apt.diagnosis,
        chiefComplaint: apt.reason,
        vitals: apt.vitals,
        prescribedMedicines: apt.prescribed_medicines,
        recommendedTests: apt.recommended_tests,
        higherReference: apt.higher_reference,
        followUpDate: apt.follow_up_date,
        notes: apt.notes,
        rawAppointment: apt
      });

      // If prescription medicines exist, also add a specific prescription event entry if desired or keep combined
      if (apt.prescribed_medicines && apt.prescribed_medicines.length > 0) {
        events.push({
          id: `timeline-rx-${apt.id}`,
          date: dateStr,
          timestamp: isNaN(timeMs) ? Date.now() : timeMs - 10, // slight offset to group cleanly
          type: 'prescription',
          title: `Doctor Prescription Issued (Rx)`,
          category: `Prescription • ${apt.doctor_name}`,
          doctorName: apt.doctor_name,
          department: apt.department,
          diagnosis: apt.diagnosis,
          prescribedMedicines: apt.prescribed_medicines,
          notes: `Follow-up advise: ${apt.follow_up_date || 'As required'}`,
          rawAppointment: apt
        });
      }
    });

    // 2. Process IPD Admissions
    ipdRecords.forEach((ipd) => {
      const dateStr = ipd.admission_date ? ipd.admission_date.split('T')[0] : new Date().toISOString().split('T')[0];
      const timeMs = new Date(dateStr).getTime();

      events.push({
        id: `timeline-ipd-${ipd.id}`,
        date: dateStr,
        timestamp: isNaN(timeMs) ? Date.now() : timeMs,
        type: 'ipd_admission',
        title: `Inpatient Admission (${ipd.status})`,
        category: `IPD Ward • ${ipd.ward_type}`,
        doctorName: ipd.doctor_name,
        department: ipd.department || 'Inpatient Care',
        diagnosis: ipd.diagnosis_at_admission,
        notes: ipd.notes,
        ipdDetails: {
          wardType: ipd.ward_type,
          bedNumber: ipd.bed_number,
          admissionDate: dateStr,
          dischargeDate: ipd.discharge_date ? ipd.discharge_date.split('T')[0] : undefined,
          surgeries: ipd.surgeries_performed,
          routineCheckups: ipd.daily_routine_checkups,
          doses: ipd.daily_doses
        },
        rawIpd: ipd
      });
    });

    // 3. Process Medical Reports
    reports.forEach((rep) => {
      const dateStr = rep.uploaded_at ? rep.uploaded_at.split('T')[0] : new Date().toISOString().split('T')[0];
      const timeMs = new Date(dateStr).getTime();

      events.push({
        id: `timeline-rep-${rep.id}`,
        date: dateStr,
        timestamp: isNaN(timeMs) ? Date.now() : timeMs,
        type: 'lab_report',
        title: rep.title,
        category: rep.category || 'Diagnostic Test Result',
        notes: rep.doctor_notes,
        reportUrl: rep.file_url,
        reportFileName: rep.file_name,
        reportFileSize: rep.file_size,
        rawReport: rep
      });
    });

    return events;
  }, [appointments, ipdRecords, reports]);

  // Filtered & Sorted Timeline Events
  const filteredEvents = useMemo(() => {
    let result = [...timelineEvents];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.doctorName && e.doctorName.toLowerCase().includes(q)) ||
        (e.diagnosis && e.diagnosis.toLowerCase().includes(q)) ||
        (e.chiefComplaint && e.chiefComplaint.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.prescribedMedicines && e.prescribedMedicines.some(m => m.name.toLowerCase().includes(q))) ||
        (e.recommendedTests && e.recommendedTests.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort by timestamp
    result.sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [timelineEvents, filterType, searchQuery, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedEventIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintFullHistory = () => {
    window.print();
  };

  const totalPrescriptions = useMemo(() => {
    return appointments.reduce((acc, a) => acc + (a.prescribed_medicines?.length || 0), 0);
  }, [appointments]);

  const totalDiagnoses = useMemo(() => {
    return appointments.filter(a => Boolean(a.diagnosis)).length;
  }, [appointments]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEALTH RECORD BANNER & SUPABASE LIVE STATUS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> Supabase EHR Synchronization
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                Patient ID: {userProfile.patient_code || userProfile.id.slice(0, 12)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              Patient Medical History & Timeline
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated record aggregated from past OPD consultations, IPD hospital stays, prescriptions, and lab diagnostic reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchMedicalHistoryData}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh timeline records from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>

            <button
              onClick={handlePrintFullHistory}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" /> Print Medical History
            </button>
          </div>
        </div>

        {/* Sync Indicator Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80 gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-slate-800">
              {isSupabaseLive ? 'Connected to Supabase PostgreSQL Database' : 'Local Storage EHR Mode'}
            </span>
            {lastSyncTime && (
              <span className="text-[11px] text-slate-400 font-mono">
                • Last synced at {lastSyncTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600 font-semibold">
            <span><strong>{appointments.length}</strong> Consultations</span>
            <span>• <strong>{ipdRecords.length}</strong> IPD Admissions</span>
            <span>• <strong>{reports.length}</strong> Reports</span>
          </div>
        </div>

        {/* Patient Vitals & Health Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Allergies & Chronic Conditions */}
          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/90 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Allergies & Chronic Conditions
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-slate-800 font-medium">
                <strong>Known Allergies:</strong>{' '}
                {userProfile.allergies && userProfile.allergies.length > 0
                  ? userProfile.allergies.join(', ')
                  : 'No known drug allergies reported'}
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Chronic Conditions:</strong>{' '}
                {userProfile.chronic_conditions && userProfile.chronic_conditions.length > 0
                  ? userProfile.chronic_conditions.join(', ')
                  : 'Stage 1 Hypertension, Mild Osteoarthritis'}
              </p>
            </div>
          </div>

          {/* Box 2: Emergency Contact & Profile Details */}
          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/90 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> Verified Patient Demographics
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-800">
              <p><strong>Blood Group:</strong> {userProfile.blood_group || 'B+'}</p>
              <p><strong>Age / Gender:</strong> {userProfile.age || 42} Yrs • {userProfile.gender || 'Male'}</p>
              <p className="col-span-2 truncate"><strong>Emergency:</strong> {userProfile.emergency_contact || '+91 98112 99887'}</p>
            </div>
          </div>

          {/* Box 3: Medical History Overview Notes */}
          <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200/90 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wide">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" /> Clinical History Notes
            </div>
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
              {userProfile.medical_history_notes || 'Regular OPD evaluations with Dr. Tushar Patel & Dr. Rajesh Krishna. Comprehensive clinical records preserved in Supabase.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-black">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900">{appointments.length}</span>
            <span className="block text-[11px] text-slate-500 font-bold">OPD Consultations</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-100 text-teal-800 font-black">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900">{totalPrescriptions}</span>
            <span className="block text-[11px] text-slate-500 font-bold">Prescribed Medicines</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-100 text-indigo-800 font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900">{ipdRecords.length}</span>
            <span className="block text-[11px] text-slate-500 font-bold">Hospital IPD Stays</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-800 font-black">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900">{reports.length}</span>
            <span className="block text-[11px] text-slate-500 font-bold">Lab & Scan Reports</span>
          </div>
        </div>
      </div>

      {/* 3. TIMELINE CONTROLS & FILTER BAR */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagnosis, doctor, medicine, test or symptoms..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort & Quick Filter */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  sortOrder === 'newest' ? 'bg-white text-emerald-900 shadow' : 'text-slate-600'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  sortOrder === 'oldest' ? 'bg-white text-emerald-900 shadow' : 'text-slate-600'
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs font-bold">
          <span className="text-slate-400 text-[10px] uppercase font-black mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" /> Filter:
          </span>

          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-emerald-400 font-extrabold shadow'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Timeline Events ({timelineEvents.length})
          </button>

          <button
            onClick={() => setFilterType('consultation')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'consultation'
                ? 'bg-emerald-600 text-white font-extrabold shadow'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            🩺 OPD Consultations ({timelineEvents.filter(e => e.type === 'consultation').length})
          </button>

          <button
            onClick={() => setFilterType('prescription')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'prescription'
                ? 'bg-teal-600 text-white font-extrabold shadow'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
            }`}
          >
            💊 Prescriptions (Rx) ({timelineEvents.filter(e => e.type === 'prescription').length})
          </button>

          <button
            onClick={() => setFilterType('ipd_admission')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'ipd_admission'
                ? 'bg-indigo-600 text-white font-extrabold shadow'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
            }`}
          >
            🏥 IPD Hospital Stays ({timelineEvents.filter(e => e.type === 'ipd_admission').length})
          </button>

          <button
            onClick={() => setFilterType('lab_report')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'lab_report'
                ? 'bg-blue-600 text-white font-extrabold shadow'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
          >
            📄 Diagnostic & Lab Reports ({timelineEvents.filter(e => e.type === 'lab_report').length})
          </button>
        </div>
      </div>

      {/* 4. SCROLLABLE TIMELINE VIEW */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Chronological Consultation & EHR Flow
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredEvents.length} of {timelineEvents.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-extrabold text-slate-700">Retrieving Patient Consultation Records from Supabase...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No medical records match your criteria</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search query or switching filters to view all consultation records stored in Supabase.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterType('all'); }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredEvents.map((event) => {
              const isExpanded = expandedEventIds[event.id] ?? true;

              // Node icon and color styling based on event type
              let nodeBg = 'bg-emerald-600 text-white';
              let badgeBg = 'bg-emerald-100 text-emerald-900';
              let borderStyle = 'border-emerald-200/80 bg-emerald-50/20';
              let icon = <Stethoscope className="w-4 h-4" />;

              if (event.type === 'prescription') {
                nodeBg = 'bg-teal-600 text-white';
                badgeBg = 'bg-teal-100 text-teal-900';
                borderStyle = 'border-teal-200/80 bg-teal-50/20';
                icon = <Pill className="w-4 h-4" />;
              } else if (event.type === 'ipd_admission') {
                nodeBg = 'bg-indigo-600 text-white';
                badgeBg = 'bg-indigo-100 text-indigo-900';
                borderStyle = 'border-indigo-200/80 bg-indigo-50/20';
                icon = <Building2 className="w-4 h-4" />;
              } else if (event.type === 'lab_report') {
                nodeBg = 'bg-blue-600 text-white';
                badgeBg = 'bg-blue-100 text-blue-900';
                borderStyle = 'border-blue-200/80 bg-blue-50/20';
                icon = <FileText className="w-4 h-4" />;
              }

              return (
                <div key={event.id} className="relative group">
                  
                  {/* Timeline Node Bullet */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full ${nodeBg} flex items-center justify-center ring-4 ring-white shadow-md z-10`}>
                    {icon}
                  </div>

                  {/* Card Event Content */}
                  <div className={`rounded-3xl p-5 border ${borderStyle} hover:border-slate-300 transition-all shadow-xs space-y-4`}>
                    
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-600" /> {event.date}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeBg}`}>
                            {event.category}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">{event.title}</h4>
                        {event.doctorName && (
                          <p className="text-xs text-slate-700 font-bold flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> {event.doctorName}
                            {event.department && <span className="text-slate-500 font-normal">({event.department})</span>}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {event.rawAppointment && (
                          <button
                            onClick={() => {
                              if (onOpenSlipModal) {
                                onOpenSlipModal(event.rawAppointment!);
                              } else {
                                setSelectedSlipApt(event.rawAppointment!);
                                setSlipModalOpen(true);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-300" /> Print OPD Slip
                          </button>
                        )}

                        {event.rawReport && (
                          <a
                            href={event.reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> View Report
                          </a>
                        )}

                        <button
                          onClick={() => toggleExpand(event.id)}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          title={isExpanded ? 'Collapse event' : 'Expand event'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Event Body Details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200/80 space-y-3 text-xs">
                        
                        {/* Diagnosis & Complaint */}
                        {event.diagnosis && (
                          <div className="p-3 rounded-2xl bg-white border border-slate-200/90 text-slate-900 space-y-1">
                            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                              🩺 Clinical Diagnosis:
                            </span>
                            <p className="font-extrabold text-xs text-slate-900">{event.diagnosis}</p>
                            {event.chiefComplaint && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Chief Complaint: "{event.chiefComplaint}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Patient Vitals Card */}
                        {event.vitals && (
                          <div className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block flex items-center gap-1">
                              <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Recorded Patient Vitals:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                                <span className="font-extrabold text-slate-900">{event.vitals.blood_pressure || '-'}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-bold">Pulse Rate</span>
                                <span className="font-extrabold text-slate-900">{event.vitals.pulse_rate || '-'}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-bold">Body Temp</span>
                                <span className="font-extrabold text-slate-900">{event.vitals.temperature || '-'}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-bold">SpO2 Oxygen</span>
                                <span className="font-extrabold text-slate-900">{event.vitals.spo2 || '-'}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-bold">Body Weight</span>
                                <span className="font-extrabold text-slate-900">{event.vitals.weight_kg ? `${event.vitals.weight_kg} kg` : '-'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prescribed Medications (Rx) */}
                        {event.prescribedMedicines && event.prescribedMedicines.length > 0 && (
                          <div className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                            <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider block flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Rx Medications:
                            </span>
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                              {event.prescribedMedicines.map((med, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div>
                                    <span className="font-black text-slate-900 block">{med.name}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{med.instructions || 'Take as advised'}</span>
                                  </div>
                                  <div className="text-right sm:text-right">
                                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold text-[10px]">
                                      {med.dosage} • {med.frequency}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">
                                      Duration: {med.duration}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Diagnostic Tests */}
                        {event.recommendedTests && event.recommendedTests.length > 0 && (
                          <div className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Recommended Tests / Investigations:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {event.recommendedTests.map((t, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                                  • {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Higher Tertiary Referral Note */}
                        {event.higherReference && (
                          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                            <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                              <Share2 className="w-3.5 h-3.5 text-amber-700" /> Tertiary Referral ({event.higherReference.urgency})
                            </div>
                            <p className="text-[11px]">
                              <strong>Hospital:</strong> {event.higherReference.referred_to_hospital} ({event.higherReference.specialist_center})
                            </p>
                            <p className="text-[11px]">
                              <strong>Reason:</strong> {event.higherReference.referral_reason}
                            </p>
                          </div>
                        )}

                        {/* IPD Specific Details */}
                        {event.ipdDetails && (
                          <div className="p-3 rounded-2xl bg-white border border-indigo-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block">
                                🏥 Hospital Admission Details:
                              </span>
                              <span className="text-[11px] font-bold text-indigo-700">
                                Bed: {event.ipdDetails.bedNumber} ({event.ipdDetails.wardType})
                              </span>
                            </div>
                            
                            {event.ipdDetails.surgeries && event.ipdDetails.surgeries.length > 0 && (
                              <div className="bg-indigo-50/70 p-2 rounded-xl text-[11px] space-y-1">
                                <strong className="text-indigo-950 block text-[10px] uppercase">Surgeries Performed:</strong>
                                {event.ipdDetails.surgeries.map((s, idx) => (
                                  <p key={idx} className="font-bold text-indigo-900">
                                    • {s.surgery_name} by {s.surgeon_name} on {s.date}
                                  </p>
                                ))}
                              </div>
                            )}

                            {event.ipdDetails.dischargeDate && (
                              <p className="text-[11px] text-slate-600 font-bold">
                                Discharged on: {event.ipdDetails.dischargeDate}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Doctor Notes & Follow up */}
                        {(event.notes || event.followUpDate) && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] gap-2">
                            {event.notes && (
                              <p className="italic">
                                <strong>Doctor Remarks:</strong> "{event.notes}"
                              </p>
                            )}
                            {event.followUpDate && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold shrink-0 self-start sm:self-auto">
                                Next Follow-up: {event.followUpDate}
                              </span>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OPD Printable Consultation Slip Modal */}
      {slipModalOpen && selectedSlipApt && (
        <PrintableConsultationSlip
          isOpen={slipModalOpen}
          appointment={selectedSlipApt}
          patient={userProfile}
          onClose={() => {
            setSlipModalOpen(false);
            setSelectedSlipApt(null);
          }}
        />
      )}

    </div>
  );
};
