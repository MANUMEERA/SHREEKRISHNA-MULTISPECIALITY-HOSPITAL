export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin' | 'super_admin' | 'receptionist';

export interface User {
  id: string;
  patient_code?: string; // e.g. "SKMH-2026-PAT-101"
  email: string;
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

export type DoctorAvailabilityStatus = 'Available' | 'Not Available' | 'In OPD' | 'In OT / Surgery' | 'On Leave' | 'Off Duty';

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  rating?: number;
  reviews_count?: number;
  photo_url: string;
  bio: string;
  availability_days: string[];
  time_slots: string[];
  opd_timings?: string;
  phone: string;
  email: string;
  is_active: boolean;
  is_on_call?: boolean;
  consultant_type?: 'Resident Consultant' | 'Visiting / On-Call' | string;
  availability_status?: DoctorAvailabilityStatus;
  
  // Authorised Signatory & Digital Signature Details
  signature_url?: string;
  stamp_url?: string;
  registration_number?: string;
  designation?: string;
  is_authorised_signatory?: boolean;

  education?: string[];
  achievements?: string[];
  
  // Security & Super Admin Monitoring
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

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'doctor_accepted' | 'ready_for_consultation' | 'forwarded_to_doctor' | 'doctor_rejected';

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
  fasting_sugar?: string;
  pp_sugar?: string;
  random_sugar?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  category: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Saline' | 'Drops' | 'Eye/Nasal Drops' | 'Pharmacy General' | 'Other' | string;
  stock_count: number;
  min_threshold: number;
  unit: string; // e.g. "Nos", "ml", "Vials", "Packs"
  expiry_date: string;
  unit_price: number;
  location?: string; // e.g. "Pharmacy Shelf B-3"
}

export interface DiagnosticTestItem {
  id: string;
  test_name: string;
  category: 'Pathology / Lab' | 'Radiology / X-Ray' | 'Ultrasound / Scan' | 'Cardiology / ECG' | 'Other';
  price: number;
  turnaround_time: string; // e.g. "2 Hours", "Same Day"
  description?: string;
  is_active: boolean;
}

export interface HospitalChargeCategory {
  id: string;
  category_name: string; // e.g. "Consultation", "Ward Stay", "X-Ray", "Surgery", "Nursing"
  service_name: string;
  charge_amount: number;
  department: string;
  doctor_id?: string;
  doctor_name?: string;
  description?: string;
}

export interface IPDDailyRoutineCheckup {
  id: string;
  date: string;
  time: string;
  bp: string;
  pulse: string;
  temp: string;
  sugar: string;
  notes: string;
  doctor_or_nurse: string;
}

export interface IPDDailyDose {
  id: string;
  date: string;
  time: string;
  medicine_name: string;
  dose_amount: string;
  type: 'Medicine' | 'Saline' | 'Injection' | 'Drop' | 'Other';
  given_by: string;
}

export interface IPDSurgeryRecord {
  id: string;
  date: string;
  surgery_name: string;
  surgeon_name: string;
  charge: number;
  notes?: string;
}

export interface AdmittedPatientRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  phone: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty?: string;
  department: string;
  ward_type: 'Deluxe Ward' | 'Super Deluxe Suite' | 'General Ward' | 'ICU Critical Care' | 'Semi-Private Room';
  bed_number: string;
  admission_date: string;
  discharge_date?: string;
  status: 'Admitted' | 'Discharged' | 'Transferred';
  diagnosis_at_admission: string;
  daily_bed_charge: number;
  extra_services?: { name: string; daily_charge: number }[];
  is_locked?: boolean; // Locked after admission - no edits permissible
  appointment_id?: string;
  daily_routine_checkups: IPDDailyRoutineCheckup[];
  daily_doses: IPDDailyDose[];
  surgeries_performed: IPDSurgeryRecord[];
  total_paid_amount: number;
  advance_paid?: number;
  created_at?: string;
  notes?: string;
}

export interface PaymentReceipt {
  id: string;
  receipt_number: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  phone: string;
  email?: string;
  appointment_id?: string;
  admitted_patient_id?: string;
  payment_date: string;
  payment_mode: 'Cash' | 'UPI (QR Code)' | 'Card' | 'Net Banking';
  transaction_ref?: string;
  items: { description: string; category: string; amount: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total_paid: number;
  collected_by: string; // Receptionist / Accountant name
  created_at?: string;
  notes?: string;
}

export interface AccountingEntry {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  source_category: 'OPD Consultation' | 'IPD Admission' | 'X-Ray & Radiology' | 'Diagnostic Lab' | 'Pharmacy' | 'Surgery / OT' | 'Staff Salary' | 'Supplies Purchase' | 'Utilities / Other' | 'Other Income' | string;
  department: string;
  doctor_name?: string;
  amount: number;
  payment_mode: string;
  description: string;
  receipt_ref?: string;
}

export interface HospitalStampConfig {
  stamp_url: string;
  signature_url: string;
  authorized_doctor_name: string;
  registration_number: string;
  designation: string;
}

export interface HospitalPolicy {
  privacy_policy: string;
  terms_of_service: string;
  patients_charter: string;
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
  patient_phone?: string;
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

  // Doctor IPD Admission Recommendation
  recommend_admission?: boolean;
  admission_reason?: string;
  recommended_ward?: string;
  admitted_patient_id?: string;

  // Doctor-to-Doctor Internal Referral
  referred_from_doctor_id?: string;
  referred_from_doctor_name?: string;
  referred_to_doctor_id?: string;
  referred_to_doctor_name?: string;
  referral_reason?: string;
  referral_date?: string;
  payment_status?: string;
  consultation_fee?: number;
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
  uploaded_at?: string;
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
  recipient_role?: string;
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
  total_appointments?: number;
  confirmed_appointments?: number;
  completed_appointments?: number;
  total_departments?: number;
  active_ipd_patients?: number;
  today_revenue?: number;
  monthly_revenue?: number;
  monthly_growth_rate?: number;
  occupancy_rate?: number;
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
  category_name?: string;
  department: string;
  photo_url?: string;
  photograph_url?: string;
  qualification: string;
  responsibilities: string;
  pay_grade?: string;
  shift_timing?: string;
  is_active: boolean;
  contact_phone?: string;
  email?: string;
  contact_email?: string;
  staff_count?: number;
}

export interface BotFaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: 'OPD & Timings' | 'Billing & Insurance' | 'Emergency & Care' | 'Facilities & Admission' | 'General Info';
  is_active: boolean;
  click_count?: number;
  created_at?: string;
}

