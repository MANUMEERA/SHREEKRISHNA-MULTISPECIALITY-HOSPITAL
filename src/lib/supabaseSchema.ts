/**
 * Complete Supabase PostgreSQL Schema DDL Script for Shree Krishna Hospital Management System
 */

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- SHREE KRISHNA MULTISPECIALTY HOSPITAL - SUPABASE POSTGRESQL SCHEMA
-- Generated for full compatibility with Supabase Auth, Row-Level Security (RLS) & Realtime
-- ====================================================================

-- Enable required UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS TABLE (Patients, Doctors, Staff, Admins, Receptionists)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'staff', 'admin', 'super_admin', 'receptionist')),
  phone VARCHAR(20),
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
  age INT,
  blood_group VARCHAR(10),
  avatar_url TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  address TEXT,
  street_address TEXT,
  locality VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  past_medical_history TEXT,
  medical_history_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. DOCTORS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 500.00,
  rating NUMERIC(3,2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  photo_url TEXT,
  bio TEXT,
  availability_days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM'],
  opd_timings VARCHAR(100) DEFAULT '09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_on_call BOOLEAN DEFAULT FALSE,
  consultant_type VARCHAR(50) DEFAULT 'Resident Consultant',
  availability_status VARCHAR(50) DEFAULT 'Available',
  signature_url TEXT,
  stamp_url TEXT,
  registration_number VARCHAR(100),
  designation VARCHAR(100),
  is_authorised_signatory BOOLEAN DEFAULT TRUE,
  education TEXT[],
  achievements TEXT[],
  login_password VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(45),
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'locked')),
  total_logins_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. DOCTOR LOGIN AUDIT LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_login_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  status VARCHAR(20) CHECK (status IN ('Success', 'Failed Attempt', 'Locked Out')),
  device_info TEXT
);

-- --------------------------------------------------------------------
-- 4. DEPARTMENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  icon_name VARCHAR(50),
  description TEXT,
  lead_doctor VARCHAR(255),
  total_doctors INT DEFAULT 0,
  beds_count INT DEFAULT 0,
  equipment_highlights TEXT[],
  image_url TEXT,
  common_conditions TEXT[],
  treatments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE (OPD Consultations)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_code VARCHAR(50),
  user_name VARCHAR(255) NOT NULL,
  user_phone VARCHAR(20),
  user_email VARCHAR(255),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  reason TEXT,
  notes TEXT,
  report_ids UUID[],
  vitals JSONB, -- { blood_pressure, pulse_rate, temperature, spo2, weight_kg, fasting_sugar, pp_sugar }
  diagnosis TEXT,
  prescribed_medicines JSONB, -- Array of { id, name, dosage, frequency, duration, instructions }
  recommended_tests TEXT[],
  higher_reference JSONB, -- { referred_to_hospital, specialist_center, referral_reason, urgency, reference_date }
  follow_up_date DATE,
  recommend_admission BOOLEAN DEFAULT FALSE,
  admission_reason TEXT,
  recommended_ward VARCHAR(100),
  admitted_patient_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. ADMITTED PATIENTS TABLE (IPD Inpatient Manager)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admitted_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_code VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialty VARCHAR(100),
  department VARCHAR(100) NOT NULL,
  ward_type VARCHAR(100) NOT NULL,
  bed_number VARCHAR(50) NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Admitted' CHECK (status IN ('Admitted', 'Discharged', 'Transferred')),
  diagnosis_at_admission TEXT,
  daily_bed_charge NUMERIC(10,2) DEFAULT 1500.00,
  extra_services JSONB, -- Array of { name, daily_charge }
  is_locked BOOLEAN DEFAULT TRUE, -- Patient admission lock
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  daily_routine_checkups JSONB DEFAULT '[]'::jsonb,
  daily_doses JSONB DEFAULT '[]'::jsonb,
  surgeries_performed JSONB DEFAULT '[]'::jsonb,
  total_paid_amount NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. MEDICINES INVENTORY STOCK TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Saline', 'Drops', 'Other')),
  stock_count INT DEFAULT 0,
  min_threshold INT DEFAULT 20,
  unit VARCHAR(50) DEFAULT 'Nos',
  expiry_date DATE,
  unit_price NUMERIC(10,2) DEFAULT 10.00,
  location VARCHAR(100) DEFAULT 'Pharmacy Shelf A-1',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. DIAGNOSTIC TESTS MASTER TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) CHECK (category IN ('Pathology / Lab', 'Radiology / X-Ray', 'Ultrasound / Scan', 'Cardiology / ECG', 'Other')),
  price NUMERIC(10,2) DEFAULT 500.00,
  turnaround_time VARCHAR(50) DEFAULT '2 Hours',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- --------------------------------------------------------------------
-- 9. HOSPITAL CHARGE CATEGORIES TABLE (Billing Master)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_charge_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_name VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  charge_amount NUMERIC(10,2) NOT NULL,
  department VARCHAR(100) NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  description TEXT
);

-- --------------------------------------------------------------------
-- 10. PAYMENT RECEIPTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_code VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admitted_patient_id UUID REFERENCES public.admitted_patients(id) ON DELETE SET NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_mode VARCHAR(50) CHECK (payment_mode IN ('Cash', 'UPI (QR Code)', 'Card', 'Net Banking')),
  transaction_ref VARCHAR(100),
  items JSONB NOT NULL, -- Array of { description, category, amount }
  subtotal NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  total_paid NUMERIC(10,2) NOT NULL,
  collected_by VARCHAR(255) DEFAULT 'Reception Desk',
  notes TEXT
);

-- --------------------------------------------------------------------
-- 11. ACCOUNTING FINANCIAL LEDGER TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(20) CHECK (type IN ('Income', 'Expense')),
  source_category VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  doctor_name VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'UPI',
  description TEXT NOT NULL,
  receipt_ref VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 12. CLINICAL OBSERVATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_code VARCHAR(50),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  visit_date DATE DEFAULT CURRENT_DATE,
  vitals JSONB,
  chief_complaints TEXT,
  diagnosis TEXT NOT NULL,
  prescribed_medicines JSONB,
  recommended_tests TEXT[],
  higher_reference JSONB,
  clinical_notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. MEDICAL REPORTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('Blood Test', 'Radiology / X-Ray', 'MRI Scan', 'Prescription', 'Discharge Summary', 'Lab Result', 'Other')),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  doctor_notes TEXT,
  uploaded_by_role VARCHAR(20) CHECK (uploaded_by_role IN ('patient', 'doctor', 'admin'))
);

-- --------------------------------------------------------------------
-- 14. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('appointment', 'report', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 15. STAFF CATEGORIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 16. STAFF DESIGNATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_designations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES public.staff_categories(id) ON DELETE CASCADE,
  category_name VARCHAR(100),
  department VARCHAR(100) NOT NULL,
  photo_url TEXT,
  qualification VARCHAR(255),
  responsibilities TEXT,
  pay_grade VARCHAR(50),
  shift_timing VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  contact_phone VARCHAR(20),
  email VARCHAR(255)
);

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- --------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admitted_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies (avoiding "policy already exists" error)
DROP POLICY IF EXISTS "Public Read Doctors" ON public.doctors;
DROP POLICY IF EXISTS "Public Read Departments" ON public.departments;
DROP POLICY IF EXISTS "Public Read Medicines" ON public.medicines;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
DROP POLICY IF EXISTS "Patients can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors/Admins full access to appointments" ON public.appointments;

CREATE POLICY "Public Read Doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public Read Departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public Read Medicines" ON public.medicines FOR SELECT USING (true);

-- Authenticated Users RLS
CREATE POLICY "Users can manage their own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Patients can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors/Admins full access to appointments" ON public.appointments FOR ALL USING (true);

-- --------------------------------------------------------------------
-- IDEMPOTENT COLUMN UPDATES (Safely adds any missing columns to existing tables)
-- --------------------------------------------------------------------
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_authorised_signatory BOOLEAN DEFAULT TRUE;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultant_type VARCHAR(50) DEFAULT 'Resident Consultant';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'Available';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS login_password VARCHAR(255);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS total_logins_count INT DEFAULT 0;

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS higher_reference JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recommend_admission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admission_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recommended_ward VARCHAR(100);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admitted_patient_id UUID;

ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS daily_routine_checkups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS daily_doses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS surgeries_performed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE;

-- Enable Supabase Realtime for Notifications & Queue
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admitted_patients') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admitted_patients;
  END IF;
END $$;

-- ====================================================================
-- END OF SUPABASE POSTGRESQL SCHEMA
-- ====================================================================
`;
