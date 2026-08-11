import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { Lock, Mail, User, ShieldCheck, CheckCircle2, UserCheck, AlertCircle, ArrowRight, KeyRound, Database, FileCode } from 'lucide-react';
import { HospitalLogo } from '../components/common/HospitalLogo';
import { PatientForgotPasswordModal } from '../components/PatientForgotPasswordModal';
import { SupabaseSchemaModal } from '../components/SupabaseSchemaModal';

interface LoginPageProps {
  setActiveTab: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const { login, signup, switchUserRole } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaNotice, setSchemaNotice] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleSchemaNeeded = (e: any) => {
      setSchemaNotice(e?.detail?.message || 'Supabase tables need to be created using SQL Editor.');
    };
    window.addEventListener('supabase-schema-needed', handleSchemaNeeded);
    return () => window.removeEventListener('supabase-schema-needed', handleSchemaNeeded);
  }, []);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  
  // Patient Detailed Address & History Registration States
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState<number | ''>(32);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [streetAddress, setStreetAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Silvassa');
  const [stateName, setStateName] = useState('Dadra & Nagar Haveli');
  const [pincode, setPincode] = useState('396230');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [selectedChronic, setSelectedChronic] = useState<string[]>([]);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const CHRONIC_OPTIONS = [
    'Hypertension (High BP)',
    'Type 2 Diabetes',
    'Asthma / Bronchitis',
    'Thyroid Disorder',
    'Heart Disease',
    'High Cholesterol',
    'None / Healthy'
  ];

  const handleToggleChronic = (item: string) => {
    if (item === 'None / Healthy') {
      setSelectedChronic(['None / Healthy']);
      return;
    }
    const filtered = selectedChronic.filter(c => c !== 'None / Healthy');
    if (filtered.includes(item)) {
      setSelectedChronic(filtered.filter(c => c !== item));
    } else {
      setSelectedChronic([...filtered, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!email || !fullName) {
          setError('Please provide email and full name');
          setLoading(false);
          return;
        }

        const formattedEmergency = emergencyContactName 
          ? `${emergencyContactPhone ? `${emergencyContactPhone} ` : ''}(${emergencyContactName})`
          : phone;

        await signup({
          email,
          full_name: fullName,
          role: selectedRole,
          phone,
          gender,
          age: Number(age) || 30,
          blood_group: bloodGroup,
          street_address: streetAddress,
          locality,
          city,
          state: stateName,
          pincode,
          past_medical_history: pastMedicalHistory,
          allergies: allergiesText ? allergiesText.split(',').map(a => a.trim()) : ['None'],
          chronic_conditions: selectedChronic.length > 0 ? selectedChronic : ['None'],
          emergency_contact: formattedEmergency,
          emergency_phone: emergencyContactPhone
        });
      } else {
        if (!email) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        await login(email, selectedRole);
      }

      if (selectedRole === 'admin' || selectedRole === 'staff' || selectedRole === 'super_admin' || selectedRole === 'receptionist') {
        setActiveTab('admin');
      } else if (selectedRole === 'doctor') {
        setActiveTab('doctor_panel');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      await switchUserRole(role);
      if (role === 'admin' || role === 'super_admin' || role === 'receptionist') {
        setActiveTab('admin');
      } else if (role === 'doctor') {
        setActiveTab('doctor_panel');
      } else {
        setActiveTab('dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Header Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <HospitalLogo size="lg" variant="full" theme="light" />
          <p className="text-xs text-slate-500 font-semibold mt-1">Multispeciality Patient & Staff Portal</p>
        </div>

        {/* Supabase Status Indicator & SQL Setup Trigger */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-500'}`} />
              <div>
                <span className="font-bold text-slate-800">Database Engine: </span>
                <span className="text-slate-600">{isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Local Persistence'}</span>
              </div>
            </div>
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 transition-all"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              SQL Schema
            </button>
          </div>

          {schemaNotice && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
              <span>⚠️ Supabase tables missing! Run the SQL script in your Supabase SQL Editor.</span>
              <button
                onClick={() => setIsSchemaModalOpen(true)}
                className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px] whitespace-nowrap hover:bg-amber-700 transition-colors"
              >
                Copy SQL
              </button>
            </div>
          )}
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Toggle Login / Register */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isSignup ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignup(true); setSelectedRole('patient'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isSignup ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Picker (Only shown on Sign In) or Registration Role Banner */}
            {!isSignup ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white text-slate-800"
                >
                  <option value="patient">Patient Portal Account</option>
                  <option value="receptionist">Receptionist / Front Desk (Appointment Booking Only)</option>
                  <option value="doctor">Consultant Doctor</option>
                  <option value="admin">Hospital Admin Panel</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                    <User className="w-4 h-4 text-amber-700" />
                    Patient Registration Only
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                    Portal Account
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  <strong>Notice:</strong> Online self-registration is available <strong>ONLY for Patients</strong>. Doctor, Reception, and Hospital Staff credentials are created & assigned by the <strong>Super Administrator</strong> in the Admin Panel.
                </p>
              </div>
            )}

            {isSignup && (
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-[11px] text-emerald-900 font-semibold flex items-center justify-between">
                  <span>New Patient Online Registration</span>
                  <span className="font-mono text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full font-bold">Auto Patient ID</span>
                </div>

                {/* Personal Info Grid */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="e.g. 35"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Detailed Address Section */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-900">
                    📍 Detailed Residential Address
                  </label>
                  
                  <input
                    type="text"
                    placeholder="Flat / House No. / Building Name / Street"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Area / Locality / Landmark"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="City / Taluka (e.g. Silvassa)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="State"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="Pincode (e.g. 396230)"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-900">
                    🩺 Patient Medical History & Allergies
                  </label>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-600 mb-1">Select Existing Chronic Conditions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CHRONIC_OPTIONS.map((item) => {
                        const isChecked = selectedChronic.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => handleToggleChronic(item)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              isChecked 
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Past Illnesses, Surgeries or Medical History Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Underwent appendectomy in 2022, history of hypertension..."
                      value={pastMedicalHistory}
                      onChange={(e) => setPastMedicalHistory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Known Drug / Food Allergies:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Sulfa drugs, Peanuts (or None)"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Emergency Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Spouse / Parent Name"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Emergency Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 98000 00000"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <KeyRound className="w-3 h-3" />
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In To Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick One-Click Demo Logins */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
              Fast Demo One-Click Logins
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDemoLogin('patient')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800 text-center transition-colors"
              >
                👤 Patient
              </button>
              <button
                onClick={() => handleQuickDemoLogin('receptionist')}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold text-purple-800 text-center transition-colors"
              >
                📋 Receptionist
              </button>
              <button
                onClick={() => handleQuickDemoLogin('doctor')}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold text-blue-800 text-center transition-colors"
              >
                🩺 Doctor
              </button>
              <button
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-amber-800 text-center transition-colors"
              >
                ⚙️ Admin
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Patient Forgot Password Self-Service Modal */}
      <PatientForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onPasswordResetSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setSelectedRole('patient');
          setIsSignup(false);
        }}
      />

      {/* Supabase Schema DDL Modal */}
      <SupabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
