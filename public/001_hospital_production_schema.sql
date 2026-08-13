-- ============================================================
-- SHREE KRISHNA MULTISPECIALTY HOSPITAL - PRODUCTION SCHEMA MIGRATION
-- File: supabase/migrations/001_hospital_production_schema.sql
-- Single, Complete, Idempotent Database Migration Script
-- Target Supabase Project: zvvnpjlekfsfrxcdyexo
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 2. CUSTOM ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'forwarded_to_doctor', 'doctor_accepted', 'doctor_rejected', 'ready_for_consultation', 'in_consultation', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.ipd_admission_status AS ENUM ('admitted', 'under_treatment', 'critical_care', 'observation', 'transferred', 'discharged', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'refunded', 'waived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_type AS ENUM ('SELF_PAY', 'COMPANY_CREDIT', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------
-- 3. CORE ENTITIES & TABLES IN STRICT DEPENDENCY ORDER
-- ------------------------------------------------------------

-- 1. PROFILES (Must be created before helper functions referencing public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'patient',
  phone TEXT,
  avatar_url TEXT,
  gender TEXT,
  age INT,
  blood_group TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  street_address TEXT,
  locality TEXT,
  city TEXT DEFAULT 'Silvassa',
  state TEXT DEFAULT 'Dadra & Nagar Haveli',
  pincode TEXT DEFAULT '396230',
  past_medical_history TEXT,
  medical_history_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS FOR SECURITY & RLS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'patient'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin'::public.app_role, 'super_admin'::public.app_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'::public.app_role
  );
$$;

-- ROLE PROTECTION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.protect_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  executing_user_id UUID;
  executing_user_role public.app_role;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  executing_user_id := auth.uid();

  IF executing_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF executing_user_id = OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Users are strictly forbidden from modifying their own role.';
  END IF;

  SELECT role INTO executing_user_role FROM public.profiles WHERE id = executing_user_id;

  IF executing_user_role IS NULL OR executing_user_role NOT IN ('admin'::public.app_role, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access Denied: Only Administrators and Super Admins can alter user roles.';
  END IF;

  IF executing_user_role = 'admin'::public.app_role THEN
    IF NEW.role IN ('admin'::public.app_role, 'super_admin'::public.app_role) OR OLD.role IN ('admin'::public.app_role, 'super_admin'::public.app_role) THEN
      RAISE EXCEPTION 'Access Denied: Only SUPER_ADMIN can assign, alter, or promote users to ADMIN or SUPER_ADMIN roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ATTACH ROLE PROTECTION TRIGGER TO PROFILES
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_change();

-- 2. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  billing_address TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 500000.00,
  current_outstanding NUMERIC(12,2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  doctor_code TEXT UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
  department TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  rating NUMERIC(3,2) DEFAULT 5.00,
  reviews_count INT DEFAULT 1,
  photo_url TEXT,
  bio TEXT,
  availability_days TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  available_days TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM'],
  available_time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM'],
  opd_timings TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_on_call BOOLEAN DEFAULT false,
  consultant_type TEXT DEFAULT 'Resident Consultant',
  availability_status TEXT DEFAULT 'Available',
  signature_url TEXT,
  stamp_url TEXT,
  registration_number TEXT,
  designation TEXT,
  is_authorised_signatory BOOLEAN DEFAULT false,
  education TEXT[],
  achievements TEXT[],
  account_status TEXT DEFAULT 'active',
  total_logins_count INT DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HELPER: GET DOCTOR ID
CREATE OR REPLACE FUNCTION public.get_doctor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE profile_id = auth.uid();
$$;

-- 4. DOCTOR SCHEDULES
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_patients INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOCTOR TIME SLOTS
CREATE TABLE IF NOT EXISTS public.doctor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booked_by_patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DOCTOR LOGIN LOGS
CREATE TABLE IF NOT EXISTS public.doctor_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  doctor_name TEXT,
  email TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'Success',
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  icon_name TEXT DEFAULT 'Activity',
  description TEXT,
  head_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  head_doctor TEXT,
  lead_doctor TEXT,
  total_doctors INT DEFAULT 1,
  beds_count INT DEFAULT 5,
  equipment_highlights TEXT[],
  image_url TEXT,
  common_conditions TEXT[],
  treatments TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. STAFF CATEGORIES
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  department_ids TEXT[],
  total_members INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STAFF DESIGNATIONS
CREATE TABLE IF NOT EXISTS public.staff_designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.staff_categories(id) ON DELETE CASCADE,
  category_name TEXT,
  department TEXT,
  photo_url TEXT,
  photograph_url TEXT,
  qualification TEXT,
  responsibilities TEXT,
  pay_grade TEXT,
  shift_timing TEXT,
  is_active BOOLEAN DEFAULT true,
  contact_phone TEXT,
  email TEXT,
  contact_email TEXT,
  staff_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STAFF PROFILES
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  shift_timings TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_number TEXT UNIQUE,
  mrn TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INT,
  date_of_birth DATE,
  gender TEXT DEFAULT 'Unspecified',
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact TEXT,
  address TEXT,
  street_address TEXT,
  city TEXT DEFAULT 'Silvassa',
  district TEXT DEFAULT 'Dadra & Nagar Haveli',
  state TEXT DEFAULT 'Dadra & Nagar Haveli',
  pincode TEXT DEFAULT '396230',
  past_medical_history TEXT,
  medical_history_notes TEXT,
  medical_history TEXT[],
  allergies TEXT[],
  current_medications TEXT[],
  billing_type public.billing_type DEFAULT 'SELF_PAY',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HELPER: GET PATIENT ID
CREATE OR REPLACE FUNCTION public.get_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients WHERE user_id = auth.uid() OR profile_id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 5. AUTH SIGNUP TRIGGER (PLACED AFTER PROFILES & PATIENTS CREATION)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Insert Profile (Force role = 'patient')
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    phone, 
    avatar_url, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    'patient'::public.app_role,
    NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
    new.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 2. Insert Patient Record
  INSERT INTO public.patients (
    user_id,
    profile_id,
    patient_number,
    mrn,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    gender,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.id,
    'SKMH-PAT-' || UPPER(SUBSTRING(new.id::text, 1, 8)),
    'MRN-' || UPPER(SUBSTRING(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', 'Patient'),
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    new.email,
    NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
    COALESCE(new.raw_user_meta_data->>'gender', 'Unspecified'),
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 12. PATIENT COMPANY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.patient_company_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id_number TEXT,
  relationship TEXT DEFAULT 'SELF',
  coverage_percentage NUMERIC(5,2) DEFAULT 100.00,
  authorized_by TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. WARDS
CREATE TABLE IF NOT EXISTS public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  ward_name TEXT NOT NULL,
  ward_code TEXT UNIQUE,
  ward_number TEXT,
  ward_type TEXT NOT NULL,
  floor_number INT DEFAULT 1,
  floor INT DEFAULT 1,
  total_beds INT NOT NULL DEFAULT 10,
  daily_charge NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  charge_per_day NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  gender_type TEXT DEFAULT 'MIXED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. IPD BEDS
CREATE TABLE IF NOT EXISTS public.ipd_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  is_under_maintenance BOOLEAN NOT NULL DEFAULT false,
  current_admission_id UUID,
  daily_rate NUMERIC(10,2) DEFAULT 1500.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ipd_bed_per_ward UNIQUE (ward_id, bed_number)
);

-- 15. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT UNIQUE,
  token_number TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  patient_code TEXT,
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  symptoms TEXT,
  reason TEXT,
  notes TEXT,
  clinical_notes TEXT,
  diagnosis TEXT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  receptionist_notes TEXT,
  doctor_notes TEXT,
  doctor_rejection_reason TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  payment_mode TEXT DEFAULT 'Cash at Counter',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  vitals JSONB DEFAULT '{}'::jsonb,
  prescribed_medicines JSONB DEFAULT '[]'::jsonb,
  recommended_tests TEXT[],
  higher_reference JSONB,
  follow_up_date DATE,
  recommend_admission BOOLEAN DEFAULT false,
  admission_reason TEXT,
  recommended_ward TEXT,
  admitted_patient_id UUID,
  referred_from_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  referred_from_doctor_name TEXT,
  referred_to_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  referred_to_doctor_name TEXT,
  referral_reason TEXT,
  referral_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number TEXT UNIQUE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT,
  notes TEXT,
  advice TEXT,
  follow_up_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  category TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT DEFAULT 'Oral',
  duration TEXT,
  duration_days INT DEFAULT 5,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. DIAGNOSTIC TESTS
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code TEXT UNIQUE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT,
  description TEXT,
  cost NUMERIC(10,2) DEFAULT 500.00,
  standard_price NUMERIC(10,2) DEFAULT 500.00,
  price NUMERIC(10,2) DEFAULT 500.00,
  normal_range TEXT,
  unit TEXT,
  sample_required TEXT,
  turnaround_time TEXT DEFAULT 'Same Day',
  turnaround_hours INT DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. TEST ORDERS
CREATE TABLE IF NOT EXISTS public.test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  test_id UUID REFERENCES public.diagnostic_tests(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'NORMAL',
  notes TEXT,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. TEST RESULTS
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_order_id UUID NOT NULL REFERENCES public.test_orders(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.diagnostic_tests(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  result_value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  interpretation TEXT,
  remarks TEXT,
  technician_name TEXT,
  report_file_url TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  verified_by_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. MEDICAL REPORTS
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  user_name TEXT,
  patient_name TEXT,
  title TEXT NOT NULL,
  report_title TEXT,
  category TEXT NOT NULL,
  type TEXT,
  doctor_name TEXT,
  file_name TEXT,
  file_path TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'application/pdf',
  file_size TEXT DEFAULT '1.2 MB',
  file_size_bytes BIGINT,
  doctor_notes TEXT,
  summary TEXT,
  status TEXT DEFAULT 'Normal',
  uploaded_by_role TEXT DEFAULT 'staff',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. IPD ADMISSIONS
CREATE TABLE IF NOT EXISTS public.ipd_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE,
  ipd_number TEXT UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_record_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_code TEXT,
  phone TEXT,
  admitting_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  attending_doctor TEXT,
  doctor_name TEXT,
  doctor_specialty TEXT,
  primary_consultant_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  ward TEXT,
  ward_type TEXT NOT NULL,
  bed_id UUID REFERENCES public.ipd_beds(id) ON DELETE SET NULL,
  bed_number TEXT NOT NULL,
  room_number TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  admission_time TEXT,
  discharge_date DATE,
  diagnosis_at_admission TEXT,
  diagnosis TEXT,
  status public.ipd_admission_status NOT NULL DEFAULT 'admitted',
  billing_type public.billing_type NOT NULL DEFAULT 'SELF_PAY',
  billing_amount NUMERIC(10,2) DEFAULT 0.00,
  daily_bed_charge NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  extra_services JSONB DEFAULT '[]'::jsonb,
  is_locked BOOLEAN DEFAULT false,
  attendant_name TEXT,
  attendant_phone TEXT,
  advance_paid NUMERIC(10,2) DEFAULT 0.00,
  estimated_bill NUMERIC(10,2) DEFAULT 0.00,
  total_paid_amount NUMERIC(10,2) DEFAULT 0.00,
  discharge_summary TEXT,
  notes TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR ADMITTED PATIENTS
CREATE OR REPLACE VIEW public.admitted_patients AS SELECT * FROM public.ipd_admissions;

-- 23. IPD DAILY MONITORING
CREATE TABLE IF NOT EXISTS public.ipd_daily_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day INT DEFAULT 1,
  time TEXT,
  ward TEXT,
  bed TEXT,
  doctor TEXT,
  doctor_or_nurse TEXT,
  temperature NUMERIC(4,1),
  bp TEXT,
  pulse INT,
  blood_pressure TEXT,
  spo2 INT,
  respiratory_rate INT,
  respiration_rate TEXT,
  weight NUMERIC(5,2),
  sugar TEXT,
  intake_ml INT,
  output_ml INT,
  clinical_observations TEXT,
  symptoms TEXT,
  doctor_notes TEXT,
  notes TEXT,
  medicine TEXT,
  injection TEXT,
  iv_fluids TEXT,
  other_treatment TEXT,
  nursing_service TEXT,
  diet TEXT,
  investigation TEXT,
  test_result_reference TEXT,
  special_instructions TEXT,
  next_review DATE,
  recorded_by TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. IPD CLINICAL ORDERS
CREATE TABLE IF NOT EXISTS public.ipd_clinical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  order_type TEXT NOT NULL,
  order_details TEXT,
  instructions TEXT,
  medicine_name TEXT,
  dose TEXT,
  frequency TEXT,
  route TEXT,
  duration TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. IPD NURSING TASKS
CREATE TABLE IF NOT EXISTS public.ipd_nursing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  clinical_order_id UUID REFERENCES public.ipd_clinical_orders(id) ON DELETE SET NULL,
  assigned_nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_name TEXT,
  task_description TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. IPD NURSING EXECUTION
CREATE TABLE IF NOT EXISTS public.ipd_nursing_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nursing_task_id UUID NOT NULL REFERENCES public.ipd_nursing_tasks(id) ON DELETE CASCADE,
  executed_by_nurse_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'DONE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. MEDICINES (PHARMACY)
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  medicine_name TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  unit TEXT NOT NULL DEFAULT 'Tablets',
  stock_quantity INT NOT NULL DEFAULT 0,
  current_stock INT DEFAULT 0,
  stock_count INT DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  min_threshold INT DEFAULT 10,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  expiry_date DATE,
  batch_number TEXT,
  location TEXT,
  rack_location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. BOT FAQS
CREATE TABLE IF NOT EXISTS public.bot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  category TEXT DEFAULT 'General',
  click_count INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 29. COMPANY BILLING CYCLES
CREATE TABLE IF NOT EXISTS public.company_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status public.payment_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 30. COMPANY BILLING ITEMS
CREATE TABLE IF NOT EXISTS public.company_billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_cycle_id UUID NOT NULL REFERENCES public.company_billing_cycles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id UUID REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  service_description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 31. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admission_id UUID REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  billing_type public.billing_type NOT NULL DEFAULT 'SELF_PAY',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) DEFAULT 0.00,
  gross_amount NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  tax NUMERIC(10,2) DEFAULT 0.00,
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  total_amount NUMERIC(10,2) DEFAULT 0.00,
  net_amount NUMERIC(10,2) DEFAULT 0.00,
  paid_amount NUMERIC(10,2) DEFAULT 0.00,
  balance_amount NUMERIC(10,2) DEFAULT 0.00,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  status public.payment_status DEFAULT 'unpaid',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR BILLING INVOICES
CREATE OR REPLACE VIEW public.billing_invoices AS SELECT * FROM public.invoices;

-- 32. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR BILLING LINE ITEMS
CREATE OR REPLACE VIEW public.billing_line_items AS SELECT * FROM public.invoice_items;

-- 33. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE,
  receipt_number TEXT UNIQUE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admitted_patient_id UUID REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_code TEXT,
  phone TEXT,
  email TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10,2) DEFAULT 0.00,
  tax NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  total_paid NUMERIC(10,2) DEFAULT 0.00,
  payment_mode TEXT NOT NULL DEFAULT 'Cash',
  receipt_type TEXT DEFAULT 'OPD_CONSULTATION',
  payment_date DATE DEFAULT CURRENT_DATE,
  transaction_ref TEXT,
  collected_by TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Completed',
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR PAYMENT RECEIPTS
CREATE OR REPLACE VIEW public.payment_receipts AS SELECT * FROM public.payments;

-- 34. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  recipient_role TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 35. NOTIFICATION LOGS
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'EMAIL',
  event_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 36. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_name TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 37. HOSPITAL CHARGE CATEGORIES
CREATE TABLE IF NOT EXISTS public.hospital_charge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  charge_amount NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  department TEXT NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. ACCOUNTING ENTRIES
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  source_category TEXT NOT NULL,
  department TEXT NOT NULL,
  doctor_name TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_mode TEXT NOT NULL DEFAULT 'Cash',
  description TEXT NOT NULL,
  receipt_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 39. HOSPITAL STAMP CONFIGURATION
CREATE TABLE IF NOT EXISTS public.hospital_stamp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stamp_url TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  authorized_doctor_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  designation TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 40. HOSPITAL POLICIES
CREATE TABLE IF NOT EXISTS public.hospital_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privacy_policy TEXT NOT NULL,
  terms_of_service TEXT NOT NULL,
  patients_charter TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 41. CLINICAL OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.clinical_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_code TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vitals JSONB DEFAULT '{}'::jsonb,
  chief_complaints TEXT,
  diagnosis TEXT NOT NULL,
  prescribed_medicines JSONB DEFAULT '[]'::jsonb,
  recommended_tests TEXT[],
  higher_reference JSONB,
  clinical_notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON public.patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON public.doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_profile_id ON public.staff_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doc ON public.doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_doc_date ON public.doctor_time_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_patient ON public.test_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON public.medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_admissions_patient ON public.ipd_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_daily_monitoring_admission ON public.ipd_daily_monitoring(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_clinical_orders_admission ON public.ipd_clinical_orders(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_nursing_tasks_admission ON public.ipd_nursing_tasks(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_nursing_execution_task ON public.ipd_nursing_execution(nursing_task_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment ON public.notification_logs(appointment_id);

-- ------------------------------------------------------------
-- 7. ENABLE ROW LEVEL SECURITY ON ALL 41 TABLES
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_company_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_daily_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_clinical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_nursing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_nursing_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_charge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_stamp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 8. RLS PERMISSION POLICIES
-- ------------------------------------------------------------

-- PROFILES
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
CREATE POLICY "Profiles delete policy" ON public.profiles FOR DELETE
  USING (public.is_super_admin());

-- DOCTORS
DROP POLICY IF EXISTS "Read doctors policy" ON public.doctors;
CREATE POLICY "Read doctors policy" ON public.doctors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write doctors policy" ON public.doctors;
CREATE POLICY "Admin write doctors policy" ON public.doctors FOR ALL
  USING (public.is_admin_or_super() OR profile_id = auth.uid());

-- DEPARTMENTS
DROP POLICY IF EXISTS "Read departments policy" ON public.departments;
CREATE POLICY "Read departments policy" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write departments policy" ON public.departments;
CREATE POLICY "Admin write departments policy" ON public.departments FOR ALL
  USING (public.is_admin_or_super());

-- PATIENTS
DROP POLICY IF EXISTS "Read patients policy" ON public.patients;
CREATE POLICY "Read patients policy" ON public.patients FOR SELECT
  USING (user_id = auth.uid() OR profile_id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Insert patients policy" ON public.patients;
CREATE POLICY "Insert patients policy" ON public.patients FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Update patients policy" ON public.patients;
CREATE POLICY "Update patients policy" ON public.patients FOR UPDATE
  USING (user_id = auth.uid() OR profile_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'staff', 'admin', 'super_admin'));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Read appointments policy" ON public.appointments;
CREATE POLICY "Read appointments policy" ON public.appointments FOR SELECT
  USING (patient_id = public.get_patient_id() OR doctor_id = public.get_doctor_id() OR user_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

DROP POLICY IF EXISTS "Insert appointments policy" ON public.appointments;
CREATE POLICY "Insert appointments policy" ON public.appointments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Update appointments policy" ON public.appointments;
CREATE POLICY "Update appointments policy" ON public.appointments FOR UPDATE
  USING (true);

-- IPD ADMISSIONS
DROP POLICY IF EXISTS "Read ipd admissions policy" ON public.ipd_admissions;
CREATE POLICY "Read ipd admissions policy" ON public.ipd_admissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Write ipd admissions policy" ON public.ipd_admissions;
CREATE POLICY "Write ipd admissions policy" ON public.ipd_admissions FOR ALL USING (true);

-- GENERAL STAFF / ADMIN READ / WRITE PERMISSIONS FOR OTHER TABLES
DROP POLICY IF EXISTS "Read medicines policy" ON public.medicines;
CREATE POLICY "Read medicines policy" ON public.medicines FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write medicines policy" ON public.medicines;
CREATE POLICY "Write medicines policy" ON public.medicines FOR ALL USING (true);

DROP POLICY IF EXISTS "Read diagnostic tests policy" ON public.diagnostic_tests;
CREATE POLICY "Read diagnostic tests policy" ON public.diagnostic_tests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write diagnostic tests policy" ON public.diagnostic_tests;
CREATE POLICY "Write diagnostic tests policy" ON public.diagnostic_tests FOR ALL USING (true);

DROP POLICY IF EXISTS "Read invoices policy" ON public.invoices;
CREATE POLICY "Read invoices policy" ON public.invoices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write invoices policy" ON public.invoices;
CREATE POLICY "Write invoices policy" ON public.invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Read payments policy" ON public.payments;
CREATE POLICY "Read payments policy" ON public.payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write payments policy" ON public.payments;
CREATE POLICY "Write payments policy" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Read notifications policy" ON public.notifications;
CREATE POLICY "Read notifications policy" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write notifications policy" ON public.notifications;
CREATE POLICY "Write notifications policy" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Read audit logs policy" ON public.audit_logs;
CREATE POLICY "Read audit logs policy" ON public.audit_logs FOR SELECT USING (public.is_admin_or_super());
DROP POLICY IF EXISTS "Insert audit logs policy" ON public.audit_logs;
CREATE POLICY "Insert audit logs policy" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ALLOW READ / WRITE FOR REMAINING OPERATIONAL TABLES
DROP POLICY IF EXISTS "Allow read for doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Allow read for doctor schedules" ON public.doctor_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Allow write for doctor schedules" ON public.doctor_schedules FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for time slots" ON public.doctor_time_slots;
CREATE POLICY "Allow read for time slots" ON public.doctor_time_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for time slots" ON public.doctor_time_slots;
CREATE POLICY "Allow write for time slots" ON public.doctor_time_slots FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for staff profiles" ON public.staff_profiles;
CREATE POLICY "Allow read for staff profiles" ON public.staff_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for staff profiles" ON public.staff_profiles;
CREATE POLICY "Allow write for staff profiles" ON public.staff_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for wards" ON public.wards;
CREATE POLICY "Allow read for wards" ON public.wards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for wards" ON public.wards;
CREATE POLICY "Allow write for wards" ON public.wards FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for ipd beds" ON public.ipd_beds;
CREATE POLICY "Allow read for ipd beds" ON public.ipd_beds FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for ipd beds" ON public.ipd_beds;
CREATE POLICY "Allow write for ipd beds" ON public.ipd_beds FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for prescriptions" ON public.prescriptions;
CREATE POLICY "Allow read for prescriptions" ON public.prescriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for prescriptions" ON public.prescriptions;
CREATE POLICY "Allow write for prescriptions" ON public.prescriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for prescription items" ON public.prescription_items;
CREATE POLICY "Allow read for prescription items" ON public.prescription_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for prescription items" ON public.prescription_items;
CREATE POLICY "Allow write for prescription items" ON public.prescription_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for test orders" ON public.test_orders;
CREATE POLICY "Allow read for test orders" ON public.test_orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for test orders" ON public.test_orders;
CREATE POLICY "Allow write for test orders" ON public.test_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for test results" ON public.test_results;
CREATE POLICY "Allow read for test results" ON public.test_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for test results" ON public.test_results;
CREATE POLICY "Allow write for test results" ON public.test_results FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for medical reports" ON public.medical_reports;
CREATE POLICY "Allow read for medical reports" ON public.medical_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for medical reports" ON public.medical_reports;
CREATE POLICY "Allow write for medical reports" ON public.medical_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for ipd monitoring" ON public.ipd_daily_monitoring;
CREATE POLICY "Allow read for ipd monitoring" ON public.ipd_daily_monitoring FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for ipd monitoring" ON public.ipd_daily_monitoring;
CREATE POLICY "Allow write for ipd monitoring" ON public.ipd_daily_monitoring FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for ipd clinical orders" ON public.ipd_clinical_orders;
CREATE POLICY "Allow read for ipd clinical orders" ON public.ipd_clinical_orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for ipd clinical orders" ON public.ipd_clinical_orders;
CREATE POLICY "Allow write for ipd clinical orders" ON public.ipd_clinical_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for ipd nursing tasks" ON public.ipd_nursing_tasks;
CREATE POLICY "Allow read for ipd nursing tasks" ON public.ipd_nursing_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for ipd nursing tasks" ON public.ipd_nursing_tasks;
CREATE POLICY "Allow write for ipd nursing tasks" ON public.ipd_nursing_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for ipd nursing execution" ON public.ipd_nursing_execution;
CREATE POLICY "Allow read for ipd nursing execution" ON public.ipd_nursing_execution FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for ipd nursing execution" ON public.ipd_nursing_execution;
CREATE POLICY "Allow write for ipd nursing execution" ON public.ipd_nursing_execution FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for bot faqs" ON public.bot_faqs;
CREATE POLICY "Allow read for bot faqs" ON public.bot_faqs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for bot faqs" ON public.bot_faqs;
CREATE POLICY "Allow write for bot faqs" ON public.bot_faqs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for companies" ON public.companies;
CREATE POLICY "Allow read for companies" ON public.companies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for companies" ON public.companies;
CREATE POLICY "Allow write for companies" ON public.companies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for patient company assignments" ON public.patient_company_assignments;
CREATE POLICY "Allow read for patient company assignments" ON public.patient_company_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for patient company assignments" ON public.patient_company_assignments;
CREATE POLICY "Allow write for patient company assignments" ON public.patient_company_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for company billing cycles" ON public.company_billing_cycles;
CREATE POLICY "Allow read for company billing cycles" ON public.company_billing_cycles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for company billing cycles" ON public.company_billing_cycles;
CREATE POLICY "Allow write for company billing cycles" ON public.company_billing_cycles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for company billing items" ON public.company_billing_items;
CREATE POLICY "Allow read for company billing items" ON public.company_billing_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for company billing items" ON public.company_billing_items;
CREATE POLICY "Allow write for company billing items" ON public.company_billing_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for invoice items" ON public.invoice_items;
CREATE POLICY "Allow read for invoice items" ON public.invoice_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for invoice items" ON public.invoice_items;
CREATE POLICY "Allow write for invoice items" ON public.invoice_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for notification logs" ON public.notification_logs;
CREATE POLICY "Allow read for notification logs" ON public.notification_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for notification logs" ON public.notification_logs;
CREATE POLICY "Allow write for notification logs" ON public.notification_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for staff categories" ON public.staff_categories;
CREATE POLICY "Allow read for staff categories" ON public.staff_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for staff categories" ON public.staff_categories;
CREATE POLICY "Allow write for staff categories" ON public.staff_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for staff designations" ON public.staff_designations;
CREATE POLICY "Allow read for staff designations" ON public.staff_designations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for staff designations" ON public.staff_designations;
CREATE POLICY "Allow write for staff designations" ON public.staff_designations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for doctor login logs" ON public.doctor_login_logs;
CREATE POLICY "Allow read for doctor login logs" ON public.doctor_login_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for doctor login logs" ON public.doctor_login_logs;
CREATE POLICY "Allow write for doctor login logs" ON public.doctor_login_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for charge categories" ON public.hospital_charge_categories;
CREATE POLICY "Allow read for charge categories" ON public.hospital_charge_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for charge categories" ON public.hospital_charge_categories;
CREATE POLICY "Allow write for charge categories" ON public.hospital_charge_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for accounting entries" ON public.accounting_entries;
CREATE POLICY "Allow read for accounting entries" ON public.accounting_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for accounting entries" ON public.accounting_entries;
CREATE POLICY "Allow write for accounting entries" ON public.accounting_entries FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for stamp config" ON public.hospital_stamp_config;
CREATE POLICY "Allow read for stamp config" ON public.hospital_stamp_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for stamp config" ON public.hospital_stamp_config;
CREATE POLICY "Allow write for stamp config" ON public.hospital_stamp_config FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for policies" ON public.hospital_policies;
CREATE POLICY "Allow read for policies" ON public.hospital_policies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for policies" ON public.hospital_policies;
CREATE POLICY "Allow write for policies" ON public.hospital_policies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow read for clinical observations" ON public.clinical_observations;
CREATE POLICY "Allow read for clinical observations" ON public.clinical_observations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write for clinical observations" ON public.clinical_observations;
CREATE POLICY "Allow write for clinical observations" ON public.clinical_observations FOR ALL USING (true);
