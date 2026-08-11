/**
 * Complete Supabase PostgreSQL Schema DDL Script for Shree Krishna Hospital Management System
 */

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- SHREE KRISHNA MULTISPECIALITY HOSPITAL - SUPABASE POSTGRESQL SCHEMA
-- Generated for full compatibility with Supabase Auth, Row-Level Security (RLS) & Realtime
-- ====================================================================

-- Enable required UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NOTE: We use CREATE TABLE IF NOT EXISTS to prevent Supabase Studio cached table OID errors ("Unable to find table with ID XXXX").
-- Existing table schema will be safely preserved.

-- --------------------------------------------------------------------
-- 1. USERS TABLE (Patients, Doctors, Staff, Admins, Receptionists)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  phone VARCHAR(20),
  gender VARCHAR(20),
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

-- Safely add any missing user columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS patient_code VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locality VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS past_medical_history TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS medical_history_notes TEXT;

-- --------------------------------------------------------------------
-- 2. DOCTORS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  account_status VARCHAR(20) DEFAULT 'active',
  total_logins_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add any missing doctors columns
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS login_password VARCHAR(255);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS total_logins_count INT DEFAULT 0;

-- --------------------------------------------------------------------
-- 3. DOCTOR LOGIN AUDIT LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  status VARCHAR(50) DEFAULT 'Success',
  device_info TEXT
);

-- --------------------------------------------------------------------
-- 4. DEPARTMENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status VARCHAR(20) DEFAULT 'confirmed',
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

-- Safely add any missing appointments columns
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_code VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS report_ids UUID[];
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vitals JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS prescribed_medicines JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recommended_tests TEXT[];
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS higher_reference JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recommend_admission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admission_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recommended_ward VARCHAR(100);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admitted_patient_id UUID;

-- --------------------------------------------------------------------
-- 6. ADMITTED PATIENTS TABLE (IPD Inpatient Manager)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admitted_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_code VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialty VARCHAR(100),
  department VARCHAR(100) DEFAULT 'General Ward',
  ward_type VARCHAR(100) NOT NULL,
  bed_number VARCHAR(50) NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Admitted',
  diagnosis_at_admission TEXT,
  daily_bed_charge NUMERIC(10,2) DEFAULT 1500.00,
  extra_services JSONB,
  is_locked BOOLEAN DEFAULT TRUE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  daily_routine_checkups JSONB DEFAULT '[]'::jsonb,
  daily_doses JSONB DEFAULT '[]'::jsonb,
  surgeries_performed JSONB DEFAULT '[]'::jsonb,
  total_paid_amount NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add any missing admitted_patients columns
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'General Ward';
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(100);
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS daily_routine_checkups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS daily_doses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS surgeries_performed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admitted_patients ADD COLUMN IF NOT EXISTS total_paid_amount NUMERIC(10,2) DEFAULT 0.00;

-- --------------------------------------------------------------------
-- 7. MEDICINES INVENTORY STOCK TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'Tablet',
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Pathology / Lab',
  price NUMERIC(10,2) DEFAULT 500.00,
  turnaround_time VARCHAR(50) DEFAULT '2 Hours',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- --------------------------------------------------------------------
-- 9. HOSPITAL CHARGE CATEGORIES TABLE (Billing Master)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_charge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_code VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  admitted_patient_id UUID REFERENCES public.admitted_patients(id) ON DELETE SET NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  transaction_ref VARCHAR(100),
  items JSONB NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(20) DEFAULT 'Income',
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'Blood Test',
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  doctor_notes TEXT,
  uploaded_by_role VARCHAR(20) DEFAULT 'doctor'
);

-- --------------------------------------------------------------------
-- 14. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 15. STAFF CATEGORIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 16. STAFF DESIGNATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 17. AI DESK CHATBOT FIXED Q&A KNOWLEDGE BASE (bot_faqs)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category VARCHAR(100) DEFAULT 'OPD & Timings',
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 18. PROFILES TABLE (Supabase Auth user profile mirror)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 19. HOSPITAL SETTINGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name VARCHAR(255) DEFAULT 'Shree Krishna Multispeciality Hospital',
  tagline VARCHAR(255) DEFAULT 'Compassionate Care & Advanced Healthcare Excellence',
  contact_phone VARCHAR(50) DEFAULT '+91 260 2640000',
  emergency_helpline VARCHAR(50) DEFAULT '+91 98000 12345',
  email VARCHAR(255) DEFAULT 'shreekrishnamultispeciality.sil@gmail.com',
  address TEXT DEFAULT 'Opp. Circuit House, Silvassa - Vapi Main Road, Silvassa, Dadra & Nagar Haveli - 396230',
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- UNRESTRICTED ACCESS SETUP (DISABLE RLS & GRANT PERMISSIONS FOR PUBLIC SCHEMA)
-- --------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

DO $$
DECLARE
  tbl RECORD;
  pol RECORD;
BEGIN
  -- 1. Drop all existing security policies on all tables in public schema
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  -- 2. Dynamically DISABLE ROW LEVEL SECURITY on every table in public schema
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END $$;

-- --------------------------------------------------------------------
-- SEED INITIAL MASTER DATA
-- --------------------------------------------------------------------
-- Hospital Settings Seed
INSERT INTO public.hospital_settings (hospital_name, tagline, contact_phone, emergency_helpline, email, address)
VALUES (
  'Shree Krishna Multispeciality Hospital',
  'Compassionate Care & Advanced Healthcare Excellence',
  '+91 260 2640000',
  '+91 98000 12345',
  'shreekrishnamultispeciality.sil@gmail.com',
  'Opp. Circuit House, Silvassa - Vapi Main Road, Silvassa, Dadra & Nagar Haveli - 396230'
)
ON CONFLICT DO NOTHING;

-- Departments Seed
INSERT INTO public.departments (name, icon_name, description, lead_doctor, total_doctors, beds_count) VALUES
('Cardiology', 'Heart', 'Comprehensive cardiac care including angioplasty, pacemaker, and ICU care.', 'Dr. Rajesh Krishna', 4, 25),
('Orthopedics', 'Bone', 'Advanced joint replacements, arthroscopy, and trauma fracture surgery.', 'Dr. Amit Shah', 3, 20),
('Pediatrics', 'Baby', 'Neonatal ICU, child immunization, and pediatric subspecialties.', 'Dr. Priya Sharma', 3, 15),
('Neurology', 'Brain', 'Advanced stroke management, epilepsy care, and neuro-rehabilitation.', 'Dr. Vikram Patel', 2, 12),
('Obstetrics & Gynecology', 'Activity', 'Maternal health, high-risk pregnancy, and laparoscopic surgeries.', 'Dr. Sunita Mehta', 3, 18),
('General Surgery', 'Scissors', 'Laparoscopic hernia, appendectomy, gallbladder, and emergency surgeries.', 'Dr. Sanjay Joshi', 4, 20),
('Emergency & Trauma', 'AlertCircle', '24x7 Level 1 Trauma Center with dedicated ICU and ambulance service.', 'Dr. Rajesh Krishna', 5, 10),
('General Medicine', 'Stethoscope', 'Comprehensive internal medicine, diabetes management, and routine care.', 'Dr. Ananya Roy', 4, 25)
ON CONFLICT (name) DO NOTHING;

-- Doctors Seed
INSERT INTO public.doctors (id, name, department, specialization, qualification, experience_years, consultation_fee, rating, reviews_count, photo_url, bio, availability_days, time_slots, phone, email, registration_number, designation) VALUES
('11111111-1111-4111-8111-111111111111', 'Dr. Rajesh Krishna', 'Cardiology', 'Interventional Cardiology & Electrophysiology', 'MD, DM (Cardiology), FACC', 18, 800.00, 4.9, 342, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80', 'Senior Chief Interventional Cardiologist with over 18 years of expertise in complex coronary angioplasty and cardiac emergencies.', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM'], '+91 98250 11223', 'dr.rajesh@shreekrishnahospital.com', 'GMC-48912/2008', 'Chief Consultant Cardiologist'),
('22222222-2222-4222-8222-222222222222', 'Dr. Priya Sharma', 'Pediatrics', 'Pediatric Intensive Care & Neonatology', 'MD (Pediatrics), DNB, Fellowship (PICU)', 12, 600.00, 4.8, 215, 'https://images.unsplash.com/photo-1594824813566-78a01103f6f1?auto=format&fit=crop&w=600&q=80', 'Expert pediatrician specializing in critical care, infant growth monitoring, and pediatric vaccinations.', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ARRAY['10:00 AM - 02:00 PM', '05:00 PM - 08:00 PM'], '+91 98250 22334', 'dr.priya@shreekrishnahospital.com', 'GMC-51204/2012', 'Senior Pediatrician'),
('33333333-3333-4333-8333-333333333333', 'Dr. Amit Shah', 'Orthopedics', 'Robotic Joint Replacement & Arthroscopy', 'MS (Ortho), MCh (UK), Fellowship (Arthroplasty)', 15, 700.00, 4.9, 189, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80', 'Renowned orthopedic surgeon specializing in robotic total knee & hip replacement and sports injury recovery.', ARRAY['Mon', 'Wed', 'Thu', 'Fri', 'Sat'], ARRAY['09:30 AM - 01:30 PM', '04:30 PM - 07:30 PM'], '+91 98250 33445', 'dr.amit@shreekrishnahospital.com', 'GMC-45102/2009', 'Lead Orthopedic Surgeon'),
('44444444-4444-4444-8444-444444444444', 'Dr. Sunita Mehta', 'Obstetrics & Gynecology', 'High-Risk Pregnancy & Laparoscopy', 'MD (OBGYN), FICOG, Diploma in Gynec Laparoscopy', 14, 650.00, 4.8, 276, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80', 'Senior gynecologist expert in painless childbirth, high-risk maternal delivery, and minimally invasive pelvic surgery.', ARRAY['Mon', 'Tue', 'Wed', 'Fri', 'Sat'], ARRAY['10:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'], '+91 98250 44556', 'dr.sunita@shreekrishnahospital.com', 'GMC-49801/2010', 'Consultant Gynecologist')
ON CONFLICT (id) DO NOTHING;

-- Bot FAQs Seed
INSERT INTO public.bot_faqs (question, answer, keywords, category) VALUES
('What are the OPD consultation timings at Shree Krishna Hospital?', 'OPD consultations run from Monday to Saturday, Morning: 09:00 AM to 01:00 PM and Evening: 04:00 PM to 08:00 PM. Emergency & Trauma services operate 24x7.', ARRAY['opd', 'timings', 'hours', 'time', 'schedule'], 'OPD & Timings'),
('How can I book an appointment with a doctor?', 'You can book an appointment directly through this website portal by clicking "Book Appointment", selecting your desired department and specialist doctor, picking an available date and time slot, and confirming your details.', ARRAY['book', 'appointment', 'consultation', 'doctor'], 'OPD & Timings'),
('Is Emergency ambulance service available 24/7?', 'Yes, Shree Krishna Hospital provides 24x7 advanced ICU Ambulance service. You can call our Emergency Helpline immediately at +91 98000 12345.', ARRAY['emergency', 'ambulance', 'helpline', '24x7', 'urgent', 'casualty'], 'Emergency & Care'),
('Which payment modes are accepted at the hospital?', 'We accept Cash, All Major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm, BHIM), and Net Banking across all billing counters.', ARRAY['payment', 'upi', 'cash', 'card', 'billing', 'pay'], 'Billing & Insurance')
ON CONFLICT DO NOTHING;

-- Medicines Seed
INSERT INTO public.medicines (name, category, stock_count, min_threshold, unit, unit_price, location) VALUES
('Paracetamol 650mg (Calpol)', 'Tablet', 450, 50, 'Strips', 25.00, 'Shelf A-1'),
('Amoxicillin 500mg', 'Capsule', 120, 30, 'Strips', 85.00, 'Shelf A-3'),
('Azithromycin 500mg', 'Tablet', 80, 20, 'Strips', 115.00, 'Shelf B-2'),
('Pantoprazole 40mg (Pan-40)', 'Tablet', 300, 40, 'Strips', 65.00, 'Shelf B-1'),
('Metformin 500mg', 'Tablet', 500, 50, 'Strips', 40.00, 'Shelf C-2'),
('Normal Saline 0.9% 500ml', 'Saline', 150, 30, 'Bottles', 45.00, 'Bay IV-1'),
('Cefoperazone + Sulbactam Injection 1.5g', 'Injection', 60, 15, 'Vials', 320.00, 'Cold Storage C-1')
ON CONFLICT DO NOTHING;

-- Enable Supabase Realtime
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

