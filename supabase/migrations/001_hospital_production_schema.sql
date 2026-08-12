-- ============================================================
-- SHREE KRISHNA MEDICAL HOSPITAL - PRODUCTION SCHEMA MIGRATION
-- File: supabase/migrations/001_hospital_production_schema.sql
-- ============================================================

-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM ('pending', 'forwarded_to_doctor', 'doctor_accepted', 'doctor_rejected', 'ready_for_consultation', 'in_consultation', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.ipd_admission_status AS ENUM ('admitted', 'transferred', 'discharged', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.billing_type AS ENUM ('SELF_PAY', 'COMPANY_CREDIT', 'PARTIAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- HELPER FUNCTIONS FOR SECURITY & RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
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
  -- If role is not being modified, allow update
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  executing_user_id := auth.uid();

  -- Allow system operations without active auth session (e.g. system auth trigger or migration scripts)
  IF executing_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Rule 1: A user must NEVER be able to change their own role (prevents self-escalation)
  IF executing_user_id = OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Users are strictly forbidden from modifying their own role.';
  END IF;

  -- Retrieve executing user's role from profiles
  SELECT role INTO executing_user_role FROM public.profiles WHERE id = executing_user_id;

  -- Non-admins cannot alter user roles
  IF executing_user_role IS NULL OR executing_user_role NOT IN ('admin'::public.app_role, 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access Denied: Only Administrators and Super Admins can alter user roles.';
  END IF;

  -- Rule 2: ADMIN cannot promote anyone to SUPER_ADMIN, nor alter an existing ADMIN or SUPER_ADMIN
  IF executing_user_role = 'admin'::public.app_role THEN
    IF NEW.role IN ('admin'::public.app_role, 'super_admin'::public.app_role) OR OLD.role IN ('admin'::public.app_role, 'super_admin'::public.app_role) THEN
      RAISE EXCEPTION 'Access Denied: Only SUPER_ADMIN can assign, alter, or promote users to ADMIN or SUPER_ADMIN roles.';
    END IF;
  END IF;

  -- Rule 3: Only SUPER_ADMIN can reach here to assign ADMIN or SUPER_ADMIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_doctor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients WHERE user_id = auth.uid();
$$;

-- AUTH TRIGGER: STRICT SECURITY FOR NEW USER SIGNUPS
-- HARDCODES PUBLIC SIGNUPS TO 'patient' ROLE
-- NO DUMMY PHONE DATA - USES NULL IF MISSING
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
    'patient'::public.app_role, -- STRICT: Ignore raw_user_meta_data role to prevent escalation
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
    patient_number,
    first_name,
    last_name,
    email,
    phone,
    gender,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    'SKMH-PAT-' || UPPER(SUBSTRING(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', 'Patient'),
    new.email,
    NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
    COALESCE(new.raw_user_meta_data->>'gender', 'Unspecified'),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'patient',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_change();

-- 2. DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  doctor_code TEXT UNIQUE,
  name TEXT,
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
  availability_days TEXT[],
  available_days TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  time_slots TEXT[],
  available_time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM'],
  opd_timings TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_on_call BOOLEAN DEFAULT false,
  consultant_type TEXT DEFAULT 'FULL_TIME',
  availability_status TEXT DEFAULT 'AVAILABLE',
  signature_url TEXT,
  stamp_url TEXT,
  registration_number TEXT,
  designation TEXT,
  is_authorised_signatory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DOCTOR SCHEDULES
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_patients INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DOCTOR TIME SLOTS
CREATE TABLE IF NOT EXISTS public.doctor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.doctor_schedules(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, slot_date, start_time)
);

-- 5. STAFF PROFILES
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  shift_timing TEXT,
  assigned_ward TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT NOT NULL DEFAULT 'Unspecified',
  blood_group TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'Silvassa',
  district TEXT DEFAULT 'Dadra & Nagar Haveli',
  state TEXT DEFAULT 'Dadra & Nagar Haveli',
  pincode TEXT DEFAULT '396230',
  past_medical_history TEXT,
  medical_history_notes TEXT,
  billing_type public.billing_type NOT NULL DEFAULT 'SELF_PAY',
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  icon_name TEXT DEFAULT 'Activity',
  head_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  lead_doctor TEXT,
  total_doctors INT DEFAULT 1,
  beds_count INT DEFAULT 5,
  description TEXT,
  equipment_highlights TEXT[],
  image_url TEXT,
  common_conditions TEXT[],
  treatments TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. WARDS
CREATE TABLE IF NOT EXISTS public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_name TEXT NOT NULL UNIQUE,
  ward_code TEXT NOT NULL UNIQUE,
  floor_number INT NOT NULL DEFAULT 1,
  total_beds INT NOT NULL DEFAULT 10,
  daily_charge NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  gender_type TEXT DEFAULT 'MIXED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. IPD BEDS
CREATE TABLE IF NOT EXISTS public.ipd_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  is_under_maintenance BOOLEAN NOT NULL DEFAULT false,
  current_admission_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ipd_bed_per_ward UNIQUE (ward_id, bed_number)
);

-- VIEW ALIAS FOR BEDS
CREATE OR REPLACE VIEW public.beds AS SELECT * FROM public.ipd_beds;

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  user_phone TEXT,
  patient_code TEXT,
  doctor_name TEXT,
  department TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  symptoms TEXT,
  reason TEXT,
  notes TEXT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  receptionist_notes TEXT,
  doctor_rejection_reason TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  vitals JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number TEXT NOT NULL UNIQUE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT,
  advice TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  category TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT 'Oral',
  duration_days INT NOT NULL DEFAULT 5,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. DIAGNOSTIC TESTS
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code TEXT NOT NULL UNIQUE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  standard_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  normal_range TEXT,
  sample_required TEXT,
  turnaround_hours INT DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. TEST ORDERS
CREATE TABLE IF NOT EXISTS public.test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'NORMAL',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TEST RESULTS
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_order_id UUID NOT NULL REFERENCES public.test_orders(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.diagnostic_tests(id) ON DELETE CASCADE,
  result_value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  interpretation TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  verified_by_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. MEDICAL REPORTS
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  title TEXT,
  report_title TEXT,
  category TEXT NOT NULL,
  file_name TEXT,
  file_path TEXT,
  file_url TEXT,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size TEXT,
  file_size_bytes BIGINT,
  doctor_notes TEXT,
  uploaded_by_role TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. IPD ADMISSIONS
CREATE TABLE IF NOT EXISTS public.ipd_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  patient_code TEXT,
  phone TEXT,
  admitting_doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  attending_doctor TEXT,
  doctor_name TEXT,
  primary_consultant_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
  ward_type TEXT,
  bed_id UUID REFERENCES public.ipd_beds(id) ON DELETE CASCADE,
  bed_number TEXT,
  room_number TEXT,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  diagnosis_at_admission TEXT,
  diagnosis TEXT,
  status public.ipd_admission_status NOT NULL DEFAULT 'admitted',
  billing_type public.billing_type NOT NULL DEFAULT 'SELF_PAY',
  billing_amount NUMERIC(10,2) DEFAULT 0.00,
  daily_bed_charge NUMERIC(10,2) DEFAULT 1500.00,
  company_id UUID,
  advance_paid NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR ADMITTED PATIENTS
CREATE OR REPLACE VIEW public.admitted_patients AS SELECT * FROM public.ipd_admissions;

-- 18. IPD DAILY MONITORING (COMPLETE 29 FIELDS)
CREATE TABLE IF NOT EXISTS public.ipd_daily_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day INT NOT NULL DEFAULT 1,
  ward TEXT,
  bed TEXT,
  doctor TEXT,
  temperature NUMERIC(4,1),
  pulse INT,
  blood_pressure TEXT,
  spo2 INT,
  respiratory_rate INT,
  weight NUMERIC(5,2),
  clinical_observations TEXT,
  symptoms TEXT,
  doctor_notes TEXT,
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
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. IPD CLINICAL ORDERS (DOCTOR DIRECTIVES)
CREATE TABLE IF NOT EXISTS public.ipd_clinical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL,
  instructions TEXT NOT NULL,
  medicine_name TEXT,
  dose TEXT,
  frequency TEXT,
  route TEXT,
  duration TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. IPD NURSING TASKS
CREATE TABLE IF NOT EXISTS public.ipd_nursing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL REFERENCES public.ipd_admissions(id) ON DELETE CASCADE,
  clinical_order_id UUID REFERENCES public.ipd_clinical_orders(id) ON DELETE SET NULL,
  assigned_nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_description TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. IPD NURSING EXECUTION
CREATE TABLE IF NOT EXISTS public.ipd_nursing_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nursing_task_id UUID NOT NULL REFERENCES public.ipd_nursing_tasks(id) ON DELETE CASCADE,
  executed_by_nurse_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'DONE', -- 'DONE' or 'NOT_DONE'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. MEDICINES
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name TEXT,
  name TEXT,
  category TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  current_stock INT DEFAULT 0,
  stock_count INT DEFAULT 0,
  min_threshold INT DEFAULT 10,
  unit TEXT DEFAULT 'Tablets',
  location TEXT,
  rack_location TEXT,
  expiry_date DATE,
  unit_price NUMERIC(10,2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. BOT FAQS
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

-- 24. COMPANIES (CORPORATE BILLING)
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

-- 25. PATIENT COMPANY ASSIGNMENTS
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

-- 26. COMPANY BILLING CYCLES
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

-- 27. COMPANY BILLING ITEMS
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

-- 28. INVOICES (BILLING INVOICES)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admission_id UUID REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  billing_type public.billing_type NOT NULL DEFAULT 'SELF_PAY',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  net_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0.00,
  status public.payment_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR BILLING INVOICES
CREATE OR REPLACE VIEW public.billing_invoices AS SELECT * FROM public.invoices;

-- 29. INVOICE ITEMS (BILLING LINE ITEMS)
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

-- 30. PAYMENTS (PAYMENT RECEIPTS)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE,
  receipt_number TEXT UNIQUE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_code TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'CASH',
  receipt_type TEXT DEFAULT 'OPD_CONSULTATION',
  transaction_ref TEXT,
  collected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VIEW ALIAS FOR PAYMENT RECEIPTS
CREATE OR REPLACE VIEW public.payment_receipts AS SELECT * FROM public.payments;

-- 31. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32. NOTIFICATION LOGS (EMAIL AUDIT TRAIL)
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

-- 33. AUDIT LOGS (STRICT APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
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

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_company_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- PROFILES
CREATE POLICY "Profiles viewable by owner or authorized staff" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin'));

CREATE POLICY "Profiles updatable by owner or admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin_or_super());

CREATE POLICY "Super admin delete profiles" ON public.profiles
  FOR DELETE USING (public.is_super_admin());

-- DOCTORS, SCHEDULES, SLOTS
CREATE POLICY "Public read active doctors" ON public.doctors FOR SELECT USING (is_active = true OR public.is_admin_or_super());
CREATE POLICY "Admin manage doctors" ON public.doctors FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read doctor schedules" ON public.doctor_schedules FOR SELECT USING (true);
CREATE POLICY "Doctor/Admin manage schedules" ON public.doctor_schedules FOR ALL USING (doctor_id = public.get_doctor_id() OR public.is_admin_or_super());

CREATE POLICY "Read doctor time slots" ON public.doctor_time_slots FOR SELECT USING (true);
CREATE POLICY "Doctor/Admin manage time slots" ON public.doctor_time_slots FOR ALL USING (doctor_id = public.get_doctor_id() OR public.is_admin_or_super());

-- STAFF PROFILES
CREATE POLICY "Read staff profiles" ON public.staff_profiles FOR SELECT USING (profile_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Admin manage staff profiles" ON public.staff_profiles FOR ALL USING (public.is_admin_or_super());

-- PATIENTS
CREATE POLICY "Read patients" ON public.patients FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'receptionist', 'admin', 'super_admin'));
CREATE POLICY "Create patients" ON public.patients FOR INSERT WITH CHECK (public.get_user_role() IN ('receptionist', 'staff', 'admin', 'super_admin') OR user_id = auth.uid());
CREATE POLICY "Update patients" ON public.patients FOR UPDATE USING (user_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Delete patients" ON public.patients FOR DELETE USING (public.is_admin_or_super());

-- DEPARTMENTS, WARDS, BEDS
CREATE POLICY "Read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admin manage departments" ON public.departments FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Admin manage wards" ON public.wards FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read IPD beds" ON public.ipd_beds FOR SELECT USING (true);
CREATE POLICY "Staff manage IPD beds" ON public.ipd_beds FOR ALL USING (public.get_user_role() IN ('receptionist', 'nurse', 'staff', 'admin', 'super_admin'));

-- APPOINTMENTS
CREATE POLICY "Read appointments" ON public.appointments FOR SELECT USING (patient_id = public.get_patient_id() OR doctor_id = public.get_doctor_id() OR user_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Create appointments" ON public.appointments FOR INSERT WITH CHECK (patient_id = public.get_patient_id() OR user_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Update appointments" ON public.appointments FOR UPDATE USING (patient_id = public.get_patient_id() OR doctor_id = public.get_doctor_id() OR user_id = auth.uid() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

-- PRESCRIPTIONS & ITEMS
CREATE POLICY "Read prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = public.get_patient_id() OR doctor_id = public.get_doctor_id() OR public.get_user_role() IN ('nurse', 'admin', 'super_admin'));
CREATE POLICY "Doctor manage prescriptions" ON public.prescriptions FOR ALL USING (doctor_id = public.get_doctor_id() OR public.is_admin_or_super());

CREATE POLICY "Read prescription items" ON public.prescription_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_items.prescription_id AND (p.patient_id = public.get_patient_id() OR p.doctor_id = public.get_doctor_id() OR public.get_user_role() IN ('nurse', 'admin', 'super_admin'))));
CREATE POLICY "Doctor manage prescription items" ON public.prescription_items FOR ALL USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_items.prescription_id AND (p.doctor_id = public.get_doctor_id() OR public.is_admin_or_super())));

-- DIAGNOSTICS & TEST ORDERS/RESULTS
CREATE POLICY "Read tests" ON public.diagnostic_tests FOR SELECT USING (true);
CREATE POLICY "Admin manage tests" ON public.diagnostic_tests FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read test orders" ON public.test_orders FOR SELECT USING (patient_id = public.get_patient_id() OR doctor_id = public.get_doctor_id() OR public.get_user_role() IN ('staff', 'receptionist', 'admin', 'super_admin'));
CREATE POLICY "Doctor/Staff create test orders" ON public.test_orders FOR INSERT WITH CHECK (public.get_user_role() IN ('doctor', 'staff', 'admin', 'super_admin'));

CREATE POLICY "Read test results" ON public.test_results FOR SELECT USING (EXISTS (SELECT 1 FROM public.test_orders o WHERE o.id = test_results.test_order_id AND (o.patient_id = public.get_patient_id() OR o.doctor_id = public.get_doctor_id() OR public.get_user_role() IN ('staff', 'admin', 'super_admin'))));

-- MEDICAL REPORTS
CREATE POLICY "Read medical reports" ON public.medical_reports FOR SELECT USING (patient_id = public.get_patient_id() OR user_id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Insert medical reports" ON public.medical_reports FOR INSERT WITH CHECK (patient_id = public.get_patient_id() OR user_id = auth.uid() OR public.get_user_role() IN ('doctor', 'nurse', 'staff', 'admin', 'super_admin'));

-- IPD ADMISSIONS & MONITORING
CREATE POLICY "Read IPD admissions" ON public.ipd_admissions FOR SELECT USING (patient_id = public.get_patient_id() OR admitting_doctor_id = public.get_doctor_id() OR primary_consultant_id = public.get_doctor_id() OR public.get_user_role() IN ('nurse', 'staff', 'receptionist', 'admin', 'super_admin'));
CREATE POLICY "Staff create IPD admissions" ON public.ipd_admissions FOR INSERT WITH CHECK (public.get_user_role() IN ('receptionist', 'doctor', 'admin', 'super_admin'));
CREATE POLICY "Staff update IPD admissions" ON public.ipd_admissions FOR UPDATE USING (admitting_doctor_id = public.get_doctor_id() OR primary_consultant_id = public.get_doctor_id() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

CREATE POLICY "Read IPD monitoring" ON public.ipd_daily_monitoring FOR SELECT USING (patient_id = public.get_patient_id() OR public.get_user_role() IN ('doctor', 'nurse', 'receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Doctor/Nurse insert IPD monitoring" ON public.ipd_daily_monitoring FOR INSERT WITH CHECK (public.get_user_role() IN ('doctor', 'nurse', 'admin', 'super_admin'));
CREATE POLICY "Doctor/Nurse update IPD monitoring" ON public.ipd_daily_monitoring FOR UPDATE USING (public.get_user_role() IN ('doctor', 'nurse', 'admin', 'super_admin'));

-- IPD ORDERS & NURSING EXECUTION
CREATE POLICY "Read IPD orders" ON public.ipd_clinical_orders FOR SELECT USING (public.get_user_role() IN ('doctor', 'nurse', 'receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Doctor manage IPD orders" ON public.ipd_clinical_orders FOR ALL USING (doctor_id = public.get_doctor_id() OR public.is_admin_or_super());

CREATE POLICY "Read nursing tasks" ON public.ipd_nursing_tasks FOR SELECT USING (public.get_user_role() IN ('doctor', 'nurse', 'receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Doctor/Admin manage nursing tasks" ON public.ipd_nursing_tasks FOR ALL USING (public.get_user_role() IN ('doctor', 'admin', 'super_admin'));

CREATE POLICY "Read nursing execution" ON public.ipd_nursing_execution FOR SELECT USING (public.get_user_role() IN ('doctor', 'nurse', 'receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Nurse execute assigned task" ON public.ipd_nursing_execution FOR INSERT WITH CHECK (
  public.get_user_role() IN ('nurse', 'admin', 'super_admin') AND
  EXISTS (
    SELECT 1 FROM public.ipd_nursing_tasks t
    WHERE t.id = ipd_nursing_execution.nursing_task_id
    AND (t.assigned_nurse_id = auth.uid() OR t.assigned_nurse_id IS NULL)
  )
);
CREATE POLICY "Nurse update own execution" ON public.ipd_nursing_execution FOR UPDATE USING (
  executed_by_nurse_id = auth.uid() OR public.is_admin_or_super()
);

-- MEDICINES & BOT FAQS
CREATE POLICY "Read medicines" ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Staff manage medicines" ON public.medicines FOR ALL USING (public.get_user_role() IN ('staff', 'receptionist', 'admin', 'super_admin'));

CREATE POLICY "Read bot faqs" ON public.bot_faqs FOR SELECT USING (true);
CREATE POLICY "Admin manage bot faqs" ON public.bot_faqs FOR ALL USING (public.is_admin_or_super());

-- COMPANIES & CORPORATE BILLING
CREATE POLICY "Read companies" ON public.companies FOR SELECT USING (public.get_user_role() IN ('receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Admin manage companies" ON public.companies FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read company assignments" ON public.patient_company_assignments FOR SELECT USING (patient_id = public.get_patient_id() OR public.get_user_role() IN ('receptionist', 'staff', 'admin', 'super_admin'));
CREATE POLICY "Staff manage company assignments" ON public.patient_company_assignments FOR ALL USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

CREATE POLICY "Read company billing cycles" ON public.company_billing_cycles FOR SELECT USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Admin manage company billing cycles" ON public.company_billing_cycles FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Read company billing items" ON public.company_billing_items FOR SELECT USING (patient_id = public.get_patient_id() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Staff manage company billing items" ON public.company_billing_items FOR ALL USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

-- INVOICES, ITEMS, PAYMENTS
CREATE POLICY "Read invoices" ON public.invoices FOR SELECT USING (patient_id = public.get_patient_id() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Staff manage invoices" ON public.invoices FOR ALL USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

CREATE POLICY "Read invoice items" ON public.invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND (i.patient_id = public.get_patient_id() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'))));
CREATE POLICY "Staff manage invoice items" ON public.invoice_items FOR ALL USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

CREATE POLICY "Read payments" ON public.payments FOR SELECT USING (patient_id = public.get_patient_id() OR public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));
CREATE POLICY "Staff manage payments" ON public.payments FOR ALL USING (public.get_user_role() IN ('receptionist', 'admin', 'super_admin'));

-- NOTIFICATIONS & NOTIFICATION LOGS
CREATE POLICY "User read own notifications" ON public.notifications FOR SELECT USING (recipient_profile_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "User update own notifications" ON public.notifications FOR UPDATE USING (recipient_profile_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Read notification logs" ON public.notification_logs FOR SELECT USING (public.is_admin_or_super());
CREATE POLICY "System insert notification logs" ON public.notification_logs FOR INSERT WITH CHECK (true);

-- AUDIT LOGS (STRICT APPEND-ONLY)
CREATE POLICY "Admin read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin_or_super());
CREATE POLICY "System insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
-- ZERO UPDATE or DELETE policies on audit_logs

-- STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures-stamps', 'signatures-stamps', false) ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Medical reports owner or clinical staff read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-reports' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.get_user_role() IN ('doctor', 'nurse', 'staff', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Medical reports owner or clinical staff upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-reports' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.get_user_role() IN ('doctor', 'nurse', 'staff', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Doctor or admin read signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures-stamps' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin_or_super()
    )
  );

CREATE POLICY "Doctor or admin upload signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures-stamps' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin_or_super()
    )
  );
