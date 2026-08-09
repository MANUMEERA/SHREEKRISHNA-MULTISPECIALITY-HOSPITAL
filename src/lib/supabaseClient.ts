import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://futenbzwzrkkloizoekj.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dGVuYnp3enJra2xvaXpvZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTQ5NTEsImV4cCI6MjEwMTgzMDk1MX0.g5UjdQNyVXTWyrCaPWgyuSZWJDqp6BoRyGUWEFRYADk';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const SUPABASE_SQL_SCHEMA = `-- Shree Krishna Multispecialty Hospital Database Schema for Supabase
-- Copy and paste this script into your Supabase SQL Editor to initialize all tables and policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table (Extends Supabase auth.users or custom profile)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'staff', 'admin', 'super_admin')),
  phone TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  age INTEGER,
  blood_group TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 1,
  consultation_fee NUMERIC NOT NULL DEFAULT 500,
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 0,
  photo_url TEXT,
  bio TEXT,
  availability_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  time_slots TEXT[] DEFAULT ARRAY['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'],
  phone TEXT,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_email TEXT NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Medical Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Blood Test', 'Radiology / X-Ray', 'MRI Scan', 'Prescription', 'Discharge Summary', 'Lab Result', 'Other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL,
  doctor_notes TEXT,
  uploaded_by_role TEXT DEFAULT 'patient',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for Security
-- Public can read active doctors
CREATE POLICY "Public doctors view" ON public.doctors FOR SELECT USING (is_active = true);

-- Users can access their own profile
CREATE POLICY "Users view own data" ON public.users FOR SELECT USING (auth.uid() = id);

-- Patients access own appointments
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

-- Patients create own appointments
CREATE POLICY "Users create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients view own reports
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);

-- Admins and Staff full access
CREATE POLICY "Admins full appointments" ON public.appointments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin'))
);
`;
