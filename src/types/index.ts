export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin' | 'super_admin';

export interface User {
  id: string;
  patient_code?: string; // e.g. "SKMH-2026-PAT-101"
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  blood_group?: string;
  avatar_url?: string;
  created_at: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  street_address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  past_medical_history?: string;
  medical_history_notes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  rating: number;
  reviews_count: number;
  photo_url: string;
  bio: string;
  availability_days: string[];
  time_slots: string[];
  opd_timings?: string;
  phone: string;
  email: string;
  is_active: boolean;
  is_on_call?: boolean;
  consultant_type?: 'Resident Consultant' | 'Visiting / On-Call';
  education?: string[];
  achievements?: string[];
  
  // Security & Super Admin Monitoring
  login_password?: string;
  last_login_at?: string;
  last_login_ip?: string;
  account_status?: 'active' | 'suspended' | 'locked';
  total_logins_count?: number;
}

export interface DoctorLoginLog {
  id: string;
  doctor_id: string;
  doctor_name: string;
  email: string;
  login_time: string;
  ip_address: string;
  status: 'Success' | 'Failed Attempt' | 'Locked Out';
  device_info: string;
}

export interface Department {
  id: string;
  name: string;
  icon_name: string;
  description: string;
  lead_doctor: string;
  total_doctors: number;
  beds_count: number;
  equipment_highlights: string[];
  image_url: string;
  common_conditions: string[];
  treatments: string[];
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string; // e.g. "500 mg", "1 tablet"
  frequency: string; // e.g. "1-0-1 (Twice Daily)"
  duration: string; // e.g. "5 Days", "1 Week"
  instructions?: string; // e.g. "After meals"
}

export interface HigherReference {
  referred_to_hospital: string; // e.g. "AIIMS New Delhi / Civil Hospital Surat"
  specialist_center?: string; // e.g. "Advanced Cardiothoracic Surgery Unit"
  referral_reason: string; // e.g. "For emergency tertiary evaluation and angiography"
  urgency: 'Routine' | 'Urgent' | 'Emergency Higher Referral';
  reference_date: string;
  doctor_signature_notes?: string;
}

export interface PatientVitals {
  blood_pressure?: string;
  pulse_rate?: string;
  temperature?: string;
  spo2?: string;
  weight_kg?: string;
}

export interface ClinicalObservation {
  id: string;
  appointment_id?: string;
  patient_id: string;
  patient_code?: string;
  doctor_id?: string;
  doctor_name: string;
  department: string;
  visit_date: string;
  vitals?: PatientVitals;
  chief_complaints?: string;
  diagnosis: string;
  prescribed_medicines: PrescribedMedicine[];
  recommended_tests: string[];
  higher_reference?: HigherReference;
  clinical_notes?: string;
  follow_up_date?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  patient_code?: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  time_slot: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  report_ids?: string[];
  created_at: string;

  // Visit Observations & Prescription Details
  vitals?: PatientVitals;
  diagnosis?: string;
  prescribed_medicines?: PrescribedMedicine[];
  recommended_tests?: string[];
  higher_reference?: HigherReference;
  follow_up_date?: string;
}

export type ReportCategory = 'Blood Test' | 'Radiology / X-Ray' | 'MRI Scan' | 'Prescription' | 'Discharge Summary' | 'Lab Result' | 'Other';

export interface MedicalReport {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  category: ReportCategory;
  file_name: string;
  file_url: string;
  file_size: string;
  uploaded_at: string;
  doctor_notes?: string;
  uploaded_by_role: 'patient' | 'doctor' | 'admin';
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'report' | 'system';
  read: boolean;
  created_at: string;
}

export interface AnalyticsStats {
  total_patients: number;
  today_appointments: number;
  pending_appointments: number;
  total_doctors: number;
  completed_this_month: number;
  estimated_revenue: number;
  department_distribution: { name: string; count: number }[];
  appointment_status_distribution: { status: string; count: number }[];
  monthly_booking_trend: { month: string; bookings: number; revenue: number }[];
}

export interface StaffCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  department_ids?: string[];
  total_members?: number;
}

export interface StaffDesignation {
  id: string;
  title: string;
  category_id: string;
  category_name: string;
  department: string;
  photo_url?: string;
  qualification: string;
  responsibilities: string;
  pay_grade?: string;
  shift_timing?: string;
  is_active: boolean;
  contact_phone?: string;
  email?: string;
}

