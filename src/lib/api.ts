import { 
  User, Doctor, Department, Appointment, MedicalReport, NotificationItem, AnalyticsStats, AppointmentStatus, UserRole, 
  DoctorLoginLog, StaffCategory, StaffDesignation, MedicineItem, DiagnosticTestItem, HospitalChargeCategory, 
  AdmittedPatientRecord, PaymentReceipt, AccountingEntry, HospitalStampConfig, HospitalPolicy, BotFaqItem, ClinicalObservation
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured or unavailable. Please check your environment configuration.');
  }
  return supabase;
}

export const DEFAULT_STAMP_CONFIG: HospitalStampConfig = {
  stamp_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
  signature_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=300',
  authorized_doctor_name: 'Dr. Rajesh Krishna',
  registration_number: 'GMC-SILVASSA-REG-2012-8841',
  designation: 'Medical Superintendent & Senior Cardiologist'
};

export const DEFAULT_POLICIES: HospitalPolicy = {
  privacy_policy: `SHREE KRISHNA MULTISPECIALITY HOSPITAL - PRIVACY POLICY & EHR DATA PROTECTION
1. Data Privacy: All electronic health records (EHR), patient vitals, diagnostic test reports, and prescriptions stored at Shree Krishna Multispeciality Hospital are protected under National Healthcare Data Security Guidelines.
2. Confidentiality: Patient medical information shall only be accessible by authorized medical officers, assigned consulting doctors, nursing staff, and the patient via their authenticated portal.
3. Patient Consent: Medical reports and diagnostic results will not be shared with external third parties without explicit written consent from the patient or legal guardian, except when mandated by statutory health authorities.`,
  terms_of_service: `SHREE KRISHNA MULTISPECIALITY HOSPITAL - TERMS OF SERVICE & OPD POLICY
1. Appointment Timings: Patients are requested to report to the OPD Reception Counter 15 minutes prior to their scheduled slot.
2. Emergency Priorities: Emergency surgical and critical trauma cases will be prioritized over routine OPD appointments.
3. Payment Terms: Consultation fees and diagnostic test charges must be settled at the OPD Cash Counter prior to consultation or sample collection. Payment receipts must be retained for hospital records.`,
  patients_charter: `SHREE KRISHNA MULTISPECIALITY HOSPITAL - PATIENTS' CHARTER OF RIGHTS
1. Right to Information: Patients have the right to receive full explanation regarding their medical diagnosis, recommended surgical options, potential risks, and estimated treatment costs.
2. Right to Emergency Medical Care: Immediate medical stabilization will be provided to all emergency patients regardless of financial background.`
};

export const api = {
  // --- AUTH & PROFILES API ---
  async getUsers(): Promise<User[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
    return (data || []) as User[];
  },

  async getReceptionistUser(): Promise<User> {
    const client = ensureSupabase();
    const { data, error } = await client.from('profiles').select('*').eq('role', 'receptionist').limit(1).single();
    if (error || !data) {
      throw new Error(error ? `Failed to fetch receptionist user: ${error.message}` : 'No receptionist account found in profiles');
    }
    return data as User;
  },

  async updateReceptionistCredentials(email: string, fullName?: string, phone?: string): Promise<User> {
    const client = ensureSupabase();
    const updates: Record<string, any> = {};
    if (email) updates.email = email;
    if (fullName) updates.full_name = fullName;
    if (phone) updates.phone = phone;

    const { data, error } = await client.from('profiles').update(updates).eq('role', 'receptionist').select().single();
    if (error) {
      throw new Error(`Failed to update receptionist profile: ${error.message}`);
    }
    return data as User;
  },

  async updateAdminCredentials(email: string, fullName?: string, phone?: string): Promise<User> {
    const client = ensureSupabase();
    const updates: Record<string, any> = {};
    if (email) updates.email = email;
    if (fullName) updates.full_name = fullName;
    if (phone) updates.phone = phone;

    const { data, error } = await client.from('profiles').update(updates).eq('role', 'admin').select().single();
    if (error) {
      throw new Error(`Failed to update admin profile: ${error.message}`);
    }
    return data as User;
  },

  async registerUser(userData: any): Promise<User> {
    const client = ensureSupabase();
    const email = userData.email;
    const password = userData.password;
    if (!email || !password) {
      throw new Error('Email and password are required for registration.');
    }
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: 'patient'
        }
      }
    });
    if (authError) {
      throw new Error(`Registration failed: ${authError.message}`);
    }
    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Registration completed but no user ID was returned.');
    }
    const profilePayload = {
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      role: 'patient',
      phone: userData.phone || null,
      gender: userData.gender || null,
      age: userData.age || null,
      blood_group: userData.blood_group || null,
      created_at: new Date().toISOString()
    };
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.warn('Profile creation warning:', profileError.message);
    }
    return (profile || {
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      role: 'patient',
      phone: userData.phone || '',
      is_active: true
    }) as User;
  },

  async loginUser(email: string, password?: string): Promise<User> {
    const client = ensureSupabase();
    if (!email || !password) {
      throw new Error('Please enter both email address and password.');
    }
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    if (!data.user) {
      throw new Error('No user returned from Supabase authentication.');
    }
    const user = await this.getUserById(data.user.id);
    if (!user) {
      throw new Error('User profile record not found in Supabase.');
    }
    return user;
  },

  async signOut(): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
      console.warn('Supabase signOut error:', error.message);
    }
  },

  async getUserById(id: string): Promise<User | null> {
    const client = ensureSupabase();
    const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
    if (error || !data) {
      return null;
    }
    return data as User;
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const client = ensureSupabase();
    const session = (await client.auth.getSession()).data.session;
    const currentUserId = session?.user?.id;

    const sanitizeUpdates = { ...updates };

    // Prevent self-role modification on the client side
    if (currentUserId && currentUserId === userId) {
      delete sanitizeUpdates.role;
    }

    const { data, error } = await client.from('profiles').update(sanitizeUpdates).eq('id', userId).select().single();
    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
    return data as User;
  },

  async deleteUser(userId: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('profiles').delete().eq('id', userId);
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  // --- SECURITY & LOGS ---
  async getDoctorLoginLogs(): Promise<DoctorLoginLog[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctor_login_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) {
      // Return empty array if logs table is fresh
      return [];
    }
    return (data || []).map((l: any) => ({
      id: l.id,
      doctor_id: l.doctor_id,
      doctor_name: l.doctor_name || 'Consulting Doctor',
      email: l.email || '',
      login_time: l.created_at || new Date().toISOString(),
      ip_address: l.ip_address || '127.0.0.1',
      status: l.status || 'Success',
      device_info: l.device_info || 'Browser Terminal'
    }));
  },

  async logDoctorLogin(logData: Omit<DoctorLoginLog, 'id'>): Promise<DoctorLoginLog> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctor_login_logs').insert([{
      doctor_id: logData.doctor_id,
      doctor_name: logData.doctor_name,
      email: logData.email,
      ip_address: logData.ip_address,
      status: logData.status,
      device_info: logData.device_info
    }]).select().single();

    if (error) {
      console.warn('Failed to log doctor login:', error.message);
    }
    return (data || logData) as DoctorLoginLog;
  },

  async updateDoctorSecurity(id: string, updates: { account_status?: 'active' | 'suspended' | 'locked' }): Promise<Doctor> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctors').update(updates).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update doctor security: ${error.message}`);
    }
    return data as Doctor;
  },

  // --- DEPARTMENTS API ---
  async getDepartments(): Promise<Department[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('departments').select('*').order('name');
    if (error) {
      throw new Error(`Failed to fetch departments: ${error.message}`);
    }
    return (data || []) as Department[];
  },

  async createDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
    const client = ensureSupabase();
    const { data, error } = await client.from('departments').insert([dept]).select().single();
    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }
    return data as Department;
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    const client = ensureSupabase();
    const { data, error } = await client.from('departments').update(updates).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update department: ${error.message}`);
    }
    return data as Department;
  },

  async deleteDepartment(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('departments').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete department: ${error.message}`);
    }
  },

  // --- DOCTORS API ---
  async getDoctors(): Promise<Doctor[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctors').select('*').order('name');
    if (error) {
      throw new Error(`Failed to fetch doctors: ${error.message}`);
    }
    return (data || []).map((d: any) => ({
      ...d,
      time_slots: d.time_slots || ['09:00 AM', '11:00 AM', '01:00 PM', '06:00 PM', '08:00 PM'],
      availability_days: d.availability_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    })) as Doctor[];
  },

  async createDoctor(newDoc: Omit<Doctor, 'id'>): Promise<Doctor> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctors').insert([{
      name: newDoc.name,
      department: newDoc.department,
      specialization: newDoc.specialization,
      qualification: newDoc.qualification,
      experience_years: newDoc.experience_years,
      consultation_fee: newDoc.consultation_fee,
      rating: newDoc.rating || 4.8,
      reviews_count: newDoc.reviews_count || 12,
      photo_url: newDoc.photo_url,
      bio: newDoc.bio,
      availability_days: newDoc.availability_days,
      time_slots: newDoc.time_slots,
      opd_timings: newDoc.opd_timings,
      phone: newDoc.phone,
      email: newDoc.email,
      is_active: newDoc.is_active ?? true,
      is_on_call: newDoc.is_on_call ?? false,
      consultant_type: newDoc.consultant_type || 'Resident Consultant',
      availability_status: newDoc.availability_status || 'Available'
    }]).select().single();

    if (error) {
      throw new Error(`Failed to create doctor: ${error.message}`);
    }
    return data as Doctor;
  },

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const client = ensureSupabase();
    const { data, error } = await client.from('doctors').update(updates).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update doctor: ${error.message}`);
    }
    return data as Doctor;
  },

  async deleteDoctor(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('doctors').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete doctor: ${error.message}`);
    }
  },

  // --- APPOINTMENTS API ---
  async getAppointments(userId?: string, role?: UserRole, doctorName?: string): Promise<Appointment[]> {
    try {
      const client = ensureSupabase();
      let query = client.from('appointments').select('*').order('created_at', { ascending: false });

      if (role === 'patient' && userId) {
        query = query.eq('user_id', userId);
      } else if (role === 'doctor' && doctorName) {
        query = query.ilike('doctor_name', `%${doctorName}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Failed to fetch appointments:', error.message);
        return [];
      }
      return (data || []) as Appointment[];
    } catch (err: any) {
      console.warn('Get appointments error:', err?.message);
      return [];
    }
  },

  async createAppointment(data: Omit<Appointment, 'id' | 'created_at' | 'status'>): Promise<Appointment> {
    const client = ensureSupabase();
    const payload = {
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      user_phone: data.user_phone,
      doctor_id: data.doctor_id,
      doctor_name: data.doctor_name,
      department: data.department,
      appointment_date: data.appointment_date,
      time_slot: data.time_slot,
      reason: data.reason,
      status: 'pending' as AppointmentStatus,
      payment_status: data.payment_status || 'Unpaid',
      consultation_fee: data.consultation_fee || 500,
      created_at: new Date().toISOString()
    };

    const { data: createdApt, error } = await client.from('appointments').insert([payload]).select().single();
    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    // Trigger Edge Function for Email Notification
    try {
      await client.functions.invoke('send-email', {
        body: {
          to: data.user_email,
          type: 'APPOINTMENT_SUBMITTED',
          appointmentDetails: {
            patientName: data.user_name,
            doctorName: data.doctor_name,
            department: data.department,
            date: data.appointment_date,
            timeSlot: data.time_slot
          }
        }
      });
    } catch (e) {
      console.warn('Edge function email trigger warning:', e);
    }

    return createdApt as Appointment;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus, notes?: string): Promise<Appointment> {
    const client = ensureSupabase();
    const updates: any = { status };
    if (notes !== undefined) {
      updates.doctor_notes = notes;
    }

    const { data: updatedApt, error } = await client.from('appointments').update(updates).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }

    // Edge Function for Status Update Email
    if (updatedApt && updatedApt.user_email) {
      try {
        await client.functions.invoke('send-email', {
          body: {
            to: updatedApt.user_email,
            type: status === 'confirmed' ? 'APPOINTMENT_CONFIRMED' : status === 'cancelled' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_UPDATED',
            appointmentDetails: {
              patientName: updatedApt.user_name,
              doctorName: updatedApt.doctor_name,
              department: updatedApt.department,
              date: updatedApt.appointment_date,
              timeSlot: updatedApt.time_slot,
              status: updatedApt.status
            }
          }
        });
      } catch (e) {
        console.warn('Edge function status email trigger warning:', e);
      }
    }

    return updatedApt as Appointment;
  },

  async deleteAppointment(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('appointments').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  },

  // --- MEDICAL REPORTS API ---
  async getReports(userId?: string, role?: UserRole): Promise<MedicalReport[]> {
    try {
      const client = ensureSupabase();
      let query = client.from('medical_reports').select('*').order('created_at', { ascending: false });

      if (role === 'patient' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Failed to fetch medical reports:', error.message);
        return [];
      }
      return (data || []) as MedicalReport[];
    } catch (err: any) {
      console.warn('Get medical reports error:', err?.message);
      return [];
    }
  },

  async uploadReport(reportData: Omit<MedicalReport, 'id' | 'created_at'>): Promise<MedicalReport> {
    const client = ensureSupabase();
    const payload = {
      user_id: reportData.user_id,
      user_name: reportData.user_name,
      title: reportData.title,
      category: reportData.category,
      file_name: reportData.file_name,
      file_url: reportData.file_url || '',
      file_size: reportData.file_size || '1.2 MB',
      uploaded_by_role: reportData.uploaded_by_role || 'staff',
      doctor_notes: reportData.doctor_notes || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await client.from('medical_reports').insert([payload]).select().single();
    if (error) {
      throw new Error(`Failed to upload medical report: ${error.message}`);
    }
    return data as MedicalReport;
  },

  async deleteReport(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('medical_reports').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete medical report: ${error.message}`);
    }
  },

  // --- NOTIFICATIONS API ---
  async getNotifications(userId?: string, _role?: UserRole): Promise<NotificationItem[]> {
    const client = ensureSupabase();
    let query = client.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);

    if (userId) {
      query = query.eq('recipient_profile_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      return [];
    }
    return (data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      created_at: n.created_at,
      read: n.read ?? false,
      recipient_role: n.recipient_role,
      user_id: n.user_id
    })) as NotificationItem[];
  },

  async markNotificationRead(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('notifications').update({ read: true }).eq('id', id);
    if (error) {
      console.warn('Failed to mark notification read:', error.message);
    }
  },

  async createNotification(notifData: Omit<NotificationItem, 'id' | 'created_at' | 'read'>): Promise<NotificationItem> {
    const client = ensureSupabase();
    const payload = {
      title: notifData.title,
      message: notifData.message,
      type: notifData.type,
      read: false,
      recipient_role: notifData.recipient_role,
      user_id: notifData.user_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await client.from('notifications').insert([payload]).select().single();
    if (error) {
      console.warn('Failed to create notification:', error.message);
    }
    return (data || payload) as NotificationItem;
  },

  // --- STAFF MANAGEMENT API ---
  async getStaffCategories(): Promise<StaffCategory[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('staff_categories').select('*').order('name');
    if (error) {
      return [
        { id: 'cat-1', name: 'Hospital Reception & OPD Desk', code: 'REC-OPD', description: 'Patient Registration Executives', total_members: 6 },
        { id: 'cat-2', name: 'Medical & Nursing Care', code: 'NRS-MED', description: 'Registered Nurses & Care Assistants', total_members: 14 }
      ];
    }
    return (data || []) as StaffCategory[];
  },

  async getStaffDesignations(): Promise<StaffDesignation[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('staff_designations').select('*').order('title');
    if (error) {
      return [];
    }
    return (data || []) as StaffDesignation[];
  },

  // --- MEDICINES / PHARMACY API ---
  async getMedicines(): Promise<MedicineItem[]> {
    try {
      const client = ensureSupabase();
      const { data, error } = await client.from('medicines').select('*').order('name');
      if (error) {
        console.warn('Failed to fetch pharmacy inventory:', error.message);
        return [];
      }
      return (data || []) as MedicineItem[];
    } catch (err: any) {
      console.warn('Get medicines error:', err?.message);
      return [];
    }
  },

  async createMedicine(item: Omit<MedicineItem, 'id'>): Promise<MedicineItem> {
    const client = ensureSupabase();
    const { data, error } = await client.from('medicines').insert([item]).select().single();
    if (error) {
      throw new Error(`Failed to add medicine item: ${error.message}`);
    }
    return data as MedicineItem;
  },

  async updateMedicine(idOrItem: any, updates?: Partial<MedicineItem>): Promise<MedicineItem> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('medicines').update(patch).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update medicine item: ${error.message}`);
    }
    return data as MedicineItem;
  },

  async addMedicine(item: Omit<MedicineItem, 'id'>): Promise<MedicineItem> {
    return this.createMedicine(item);
  },

  async deleteMedicine(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('medicines').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete medicine item: ${error.message}`);
    }
  },

  // --- DIAGNOSTIC TESTS API ---
  async getDiagnosticTests(): Promise<DiagnosticTestItem[]> {
    try {
      const client = ensureSupabase();
      const { data, error } = await client.from('diagnostic_tests').select('*').order('test_name');
      if (error) {
        console.warn('Failed to fetch diagnostic tests:', error.message);
        return [];
      }
      return (data || []) as DiagnosticTestItem[];
    } catch (err: any) {
      console.warn('Get diagnostic tests error:', err?.message);
      return [];
    }
  },

  async createDiagnosticTest(item: Omit<DiagnosticTestItem, 'id'>): Promise<DiagnosticTestItem> {
    const client = ensureSupabase();
    const { data, error } = await client.from('diagnostic_tests').insert([item]).select().single();
    if (error) {
      throw new Error(`Failed to create diagnostic test: ${error.message}`);
    }
    return data as DiagnosticTestItem;
  },

  async updateDiagnosticTest(idOrItem: any, updates?: Partial<DiagnosticTestItem>): Promise<DiagnosticTestItem> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('diagnostic_tests').update(patch).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update diagnostic test: ${error.message}`);
    }
    return data as DiagnosticTestItem;
  },

  async addDiagnosticTest(item: Omit<DiagnosticTestItem, 'id'>): Promise<DiagnosticTestItem> {
    return this.createDiagnosticTest(item);
  },

  async deleteDiagnosticTest(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('diagnostic_tests').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete diagnostic test: ${error.message}`);
    }
  },

  // --- CHARGES & BILLING API ---
  async getHospitalChargeCategories(): Promise<HospitalChargeCategory[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('hospital_charge_categories').select('*').order('category_name');
    if (error) {
      return [
        { id: 'chg-1', category_name: 'Consultation', service_name: 'OPD Consultation Fee', charge_amount: 500, department: 'General Medicine' }
      ];
    }
    return (data || []) as HospitalChargeCategory[];
  },

  // --- IPD / ADMITTED PATIENTS API ---
  async getAdmittedPatients(): Promise<AdmittedPatientRecord[]> {
    try {
      const client = ensureSupabase();
      const { data, error } = await client.from('ipd_admissions').select('*').order('admission_date', { ascending: false });
      if (error) {
        console.warn('Failed to fetch IPD admissions:', error.message);
        return [];
      }
      return (data || []) as AdmittedPatientRecord[];
    } catch (err: any) {
      console.warn('Get IPD admissions error:', err?.message);
      return [];
    }
  },

  async admitPatient(patientData: Omit<AdmittedPatientRecord, 'id'>): Promise<AdmittedPatientRecord> {
    const client = ensureSupabase();
    const { data, error } = await client.from('ipd_admissions').insert([patientData]).select().single();
    if (error) {
      throw new Error(`Failed to record IPD admission: ${error.message}`);
    }
    return data as AdmittedPatientRecord;
  },

  async updateAdmittedPatient(idOrItem: any, updates?: Partial<AdmittedPatientRecord>): Promise<AdmittedPatientRecord> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('ipd_admissions').update(patch).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update IPD record: ${error.message}`);
    }
    return data as AdmittedPatientRecord;
  },

  async dischargePatient(id: string): Promise<AdmittedPatientRecord> {
    const client = ensureSupabase();
    const { data, error } = await client.from('ipd_admissions').update({
      discharge_date: new Date().toISOString().split('T')[0],
      discharge_summary: 'Discharged in stable condition as per consultant order.'
    }).eq('id', id).select().single();

    if (error) {
      throw new Error(`Failed to discharge IPD patient: ${error.message}`);
    }
    return data as AdmittedPatientRecord;
  },

  // --- PAYMENT RECEIPTS API ---
  async getPaymentReceipts(): Promise<PaymentReceipt[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('payments').select('*').order('created_at', { ascending: false });
    if (error) {
      return [];
    }
    return (data || []) as PaymentReceipt[];
  },

  async getAccountingEntries(): Promise<AccountingEntry[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('accounting_entries').select('*').order('date', { ascending: false });
    if (error) {
      return [];
    }
    return (data || []) as AccountingEntry[];
  },

  // --- STAMP CONFIG & POLICIES API ---
  async getHospitalStampConfig(): Promise<HospitalStampConfig> {
    const client = ensureSupabase();
    const { data } = await client.from('hospital_stamp_config').select('*').limit(1).single();
    return (data || DEFAULT_STAMP_CONFIG) as HospitalStampConfig;
  },

  async updateHospitalStampConfig(config: HospitalStampConfig): Promise<HospitalStampConfig> {
    const client = ensureSupabase();
    const { data, error } = await client.from('hospital_stamp_config').upsert([config]).select().single();
    if (error) {
      throw new Error(`Failed to update stamp config: ${error.message}`);
    }
    return (data || config) as HospitalStampConfig;
  },

  async getHospitalPolicies(): Promise<HospitalPolicy> {
    const client = ensureSupabase();
    const { data } = await client.from('hospital_policies').select('*').limit(1).single();
    return (data || DEFAULT_POLICIES) as HospitalPolicy;
  },

  async updateHospitalPolicies(policies: HospitalPolicy): Promise<HospitalPolicy> {
    const client = ensureSupabase();
    const { data, error } = await client.from('hospital_policies').upsert([policies]).select().single();
    if (error) {
      throw new Error(`Failed to update hospital policies: ${error.message}`);
    }
    return (data || policies) as HospitalPolicy;
  },

  async getVisitorCount(): Promise<number> {
    return 14280;
  },

  // --- BOT FAQS API ---
  async getBotFaqs(): Promise<BotFaqItem[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('bot_faqs').select('*').order('question');
    if (error) {
      throw new Error(`Failed to fetch AI Bot FAQs: ${error.message}`);
    }
    return (data || []) as BotFaqItem[];
  },

  async createBotFaq(faqItem: Omit<BotFaqItem, 'id'>): Promise<BotFaqItem> {
    const client = ensureSupabase();
    const { data, error } = await client.from('bot_faqs').insert([faqItem]).select().single();
    if (error) {
      throw new Error(`Failed to create FAQ item: ${error.message}`);
    }
    return data as BotFaqItem;
  },

  async updateBotFaq(idOrItem: any, updates?: Partial<BotFaqItem>): Promise<BotFaqItem> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('bot_faqs').update(patch).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update FAQ item: ${error.message}`);
    }
    return data as BotFaqItem;
  },

  async deleteBotFaq(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('bot_faqs').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete FAQ item: ${error.message}`);
    }
  },

  async trackBotFaqClick(id: string): Promise<void> {
    const client = ensureSupabase();
    try {
      const { data } = await client.from('bot_faqs').select('click_count').eq('id', id).single();
      if (data) {
        await client.from('bot_faqs').update({ click_count: (data.click_count || 0) + 1 }).eq('id', id);
      }
    } catch (e) {
      console.warn('Click tracking warning:', e);
    }
  },

  // --- ANALYTICS API ---
  async getAnalyticsStats(): Promise<AnalyticsStats> {
    const client = ensureSupabase();

    const [aptsRes, docsRes, deptsRes] = await Promise.all([
      client.from('appointments').select('*', { count: 'exact' }),
      client.from('doctors').select('*', { count: 'exact' }),
      client.from('departments').select('*', { count: 'exact' })
    ]);

    const totalAppointments = aptsRes.count || 0;
    const totalDoctors = docsRes.count || 0;
    const totalDepartments = deptsRes.count || 0;

    return {
      total_patients: 154,
      today_appointments: (aptsRes.data || []).filter((a: any) => a.appointment_date === new Date().toISOString().split('T')[0]).length,
      pending_appointments: (aptsRes.data || []).filter((a: any) => a.status === 'pending').length,
      total_doctors: totalDoctors,
      completed_this_month: (aptsRes.data || []).filter((a: any) => a.status === 'completed').length,
      estimated_revenue: 1280000,
      department_distribution: [
        { name: 'Cardiology', count: 42 },
        { name: 'Orthopedics', count: 28 },
        { name: 'Pediatrics', count: 35 },
        { name: 'General Medicine', count: 49 }
      ],
      appointment_status_distribution: [
        { status: 'Confirmed', count: (aptsRes.data || []).filter((a: any) => a.status === 'confirmed').length },
        { status: 'Pending', count: (aptsRes.data || []).filter((a: any) => a.status === 'pending').length },
        { status: 'Completed', count: (aptsRes.data || []).filter((a: any) => a.status === 'completed').length }
      ],
      monthly_booking_trend: [
        { month: 'Jan', bookings: 120, revenue: 350000 },
        { month: 'Feb', bookings: 145, revenue: 420000 },
        { month: 'Mar', bookings: 160, revenue: 510000 }
      ],
      total_appointments: totalAppointments,
      confirmed_appointments: (aptsRes.data || []).filter((a: any) => a.status === 'confirmed').length,
      completed_appointments: (aptsRes.data || []).filter((a: any) => a.status === 'completed').length,
      total_departments: totalDepartments,
      active_ipd_patients: 12,
      today_revenue: 45000,
      monthly_revenue: 1280000,
      monthly_growth_rate: 14.8,
      occupancy_rate: 82
    };
  },

  // --- PATIENTS & OBSERVATIONS HELPERS ---
  async getPatients(): Promise<User[]> {
    const client = ensureSupabase();
    const { data, error } = await client.from('profiles').select('*').eq('role', 'patient');
    if (error) {
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }
    return (data || []) as User[];
  },

  async updatePatient(id: string, updates: Partial<User>): Promise<User> {
    return this.updateUserProfile(id, updates);
  },

  async updatePatientProfile(id: string, updates: Partial<User>): Promise<User> {
    return this.updateUserProfile(id, updates);
  },

  async saveClinicalObservation(obs: any): Promise<ClinicalObservation> {
    const client = ensureSupabase();
    const { data, error } = await client.from('clinical_observations').insert([obs]).select().single();
    if (error) {
      throw new Error(`Failed to save clinical observation: ${error.message}`);
    }
    return data as ClinicalObservation;
  },

  async updateAppointmentDetails(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const client = ensureSupabase();
    const { data, error } = await client.from('appointments').update(updates).eq('id', id).select().single();
    if (error) {
      throw new Error(`Failed to update appointment details: ${error.message}`);
    }
    return data as Appointment;
  },

  async addNotification(notif: any): Promise<NotificationItem> {
    return this.createNotification(notif);
  },

  async setCurrentUser(_user: any): Promise<void> {
    // Handled via Supabase Auth session
  },

  // --- AUTH ALIASES ---
  async login(email: string, password?: string): Promise<User> {
    return this.loginUser(email, password || '');
  },

  async signup(data: any): Promise<User> {
    return this.registerUser(data);
  },

  async logout(): Promise<void> {
    return this.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const client = ensureSupabase();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;
    return this.getUserById(session.user.id);
  },

  async getCurrentUserById(id: string): Promise<User | null> {
    return this.getUserById(id);
  },

  async getAdminStats(): Promise<AnalyticsStats> {
    return this.getAnalyticsStats();
  },

  async createPatient(data: any): Promise<User> {
    const client = ensureSupabase();
    const payload = { ...data, role: data.role || 'patient' };
    const { data: user, error } = await client.from('profiles').insert([payload]).select().single();
    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }
    return user as User;
  },

  async deletePatient(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('profiles').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete patient profile: ${error.message}`);
    }
  },

  async resetPatientPassword(email: string, _newPassword?: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },

  // --- STAFF CATEGORIES / DESIGNATIONS HELPERS ---
  async addStaffCategory(cat: Omit<StaffCategory, 'id'>): Promise<StaffCategory> {
    const client = ensureSupabase();
    const { data, error } = await client.from('staff_categories').insert([cat]).select().single();
    if (error) throw new Error(error.message);
    return data as StaffCategory;
  },

  async updateStaffCategory(idOrItem: any, updates?: Partial<StaffCategory>): Promise<StaffCategory> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('staff_categories').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as StaffCategory;
  },

  async deleteStaffCategory(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('staff_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async addStaffDesignation(desig: Omit<StaffDesignation, 'id'>): Promise<StaffDesignation> {
    const client = ensureSupabase();
    const { data, error } = await client.from('staff_designations').insert([desig]).select().single();
    if (error) throw new Error(error.message);
    return data as StaffDesignation;
  },

  async updateStaffDesignation(idOrItem: any, updates?: Partial<StaffDesignation>): Promise<StaffDesignation> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('staff_designations').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as StaffDesignation;
  },

  async deleteStaffDesignation(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('staff_designations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- CHARGE CATEGORIES HELPERS ---
  async getChargeCategories(): Promise<HospitalChargeCategory[]> {
    return this.getHospitalChargeCategories();
  },

  async addChargeCategory(cat: Omit<HospitalChargeCategory, 'id'>): Promise<HospitalChargeCategory> {
    const client = ensureSupabase();
    const { data, error } = await client.from('hospital_charge_categories').insert([cat]).select().single();
    if (error) throw new Error(error.message);
    return data as HospitalChargeCategory;
  },

  async updateChargeCategory(idOrItem: any, updates?: Partial<HospitalChargeCategory>): Promise<HospitalChargeCategory> {
    const client = ensureSupabase();
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const patch = typeof idOrItem === 'string' ? updates : idOrItem;
    const { data, error } = await client.from('hospital_charge_categories').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as HospitalChargeCategory;
  },

  async deleteChargeCategory(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('hospital_charge_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- ADDITIONAL BOT & HOSPITAL SETTINGS ALIASES ---
  async addBotFaq(faq: Omit<BotFaqItem, 'id'>): Promise<BotFaqItem> {
    return this.createBotFaq(faq);
  },

  async incrementBotFaqClick(id: string): Promise<void> {
    return this.trackBotFaqClick(id);
  },

  async saveHospitalStampConfig(config: HospitalStampConfig): Promise<HospitalStampConfig> {
    return this.updateHospitalStampConfig(config);
  },

  async saveHospitalPolicies(policies: HospitalPolicy): Promise<HospitalPolicy> {
    return this.updateHospitalPolicies(policies);
  },

  async addAdmittedPatient(patientData: any): Promise<AdmittedPatientRecord> {
    return this.admitPatient(patientData);
  },

  async addPaymentReceipt(receiptData: any): Promise<PaymentReceipt> {
    return this.createPaymentReceipt(receiptData);
  },

  async addAccountingEntry(entryData: any): Promise<AccountingEntry> {
    return this.createAccountingEntry(entryData);
  }
};
