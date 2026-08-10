import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SQL_SCHEMA } from './supabaseSchema';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zvvnpjlekfsfrxcdyexo.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dm5wamxla2ZzZnJ4Y2R5ZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTExMTUsImV4cCI6MjEwMTkyNzExNX0.bO5UM_t3Wduj5IZtFRIKHAmS3NI4Qtvkdu363PcStjI';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export { SUPABASE_SQL_SCHEMA };
