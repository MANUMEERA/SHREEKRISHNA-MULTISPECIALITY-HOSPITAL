import React, { useState, useEffect } from 'react';
import { Doctor, DoctorLoginLog } from '../types';
import { api } from '../lib/api';
import { 
  ShieldCheck, Lock, Unlock, KeyRound, Eye, EyeOff, Search, Clock, 
  AlertTriangle, CheckCircle2, UserX, UserCheck, RefreshCw, X, ShieldAlert,
  Smartphone, Laptop, Globe, History, Check, Edit, User, Stethoscope,
  Upload, Building2, Phone, Mail, Award, DollarSign, FileText, Image as ImageIcon
} from 'lucide-react';

interface DoctorSecurityMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorUpdated?: () => void;
}

export const DoctorSecurityMonitorModal: React.FC<DoctorSecurityMonitorModalProps> = ({
  isOpen,
  onClose,
  onDoctorUpdated
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'credentials' | 'audit_logs' | 'change_passkey'>('credentials');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [logs, setLogs] = useState<DoctorLoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor Password Change Modal
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});

  // Full Doctor Profile Edit Modal
  const [fullEditDoctor, setFullEditDoctor] = useState<Doctor | null>(null);
  const [fullEditFormData, setFullEditFormData] = useState({
    name: '',
    specialization: '',
    department: '',
    qualification: '',
    experience_years: 10,
    consultation_fee: 500,
    phone: '',
    email: '',
    bio: '',
    photo_url: '',
    opd_timings: '',
    is_on_call: false,
    consultant_type: 'Resident Consultant'
  });
  const [savingFullEdit, setSavingFullEdit] = useState(false);

  // Change Passkey State
  const [newSuperPasskey, setNewSuperPasskey] = useState('');
  const [passkeySuccessMsg, setPasskeySuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && isUnlocked) {
      loadSecurityData();
    }
  }, [isOpen, isUnlocked]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const docs = await api.getDoctors();
      const auditLogs = await api.getDoctorLoginLogs();
      setDoctors(docs);
      setLogs(auditLogs);
    } catch (err) {
      console.error('Error loading doctor security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError('');
    const isValid = await api.verifySuperAdminPasskey(passkeyInput);
    if (isValid) {
      setIsUnlocked(true);
    } else {
      setPasskeyError('Invalid Security Passkey. Please try again.');
    }
  };

  const handleTogglePasswordVisibility = (docId: string) => {
    setShowPasswordsMap(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const handleSavePassword = async () => {
    if (!editingDoctor || !newPassword) return;
    try {
      await api.updateDoctorSecurity(editingDoctor.id, { login_password: newPassword });
      setEditingDoctor(null);
      setNewPassword('');
      loadSecurityData();
      onDoctorUpdated?.();
    } catch (err) {
      alert('Failed to update doctor password.');
    }
  };

  const handleOpenFullDoctorEdit = (doc: Doctor) => {
    setFullEditDoctor(doc);
    setFullEditFormData({
      name: doc.name,
      specialization: doc.specialization,
      department: doc.department,
      qualification: doc.qualification,
      experience_years: doc.experience_years,
      consultation_fee: doc.consultation_fee,
      phone: doc.phone,
      email: doc.email,
      bio: doc.bio,
      photo_url: doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      opd_timings: doc.opd_timings || 'Mon - Sat (09:00 AM - 08:30 PM • After 8:30 PM Emergency Only)',
      is_on_call: doc.is_on_call || false,
      consultant_type: doc.consultant_type || (doc.is_on_call ? 'Visiting / On-Call' : 'Resident Consultant')
    });
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFullEditFormData(prev => ({ ...prev, photo_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFullDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullEditDoctor) return;
    setSavingFullEdit(true);
    try {
      const isOnCall = fullEditFormData.consultant_type === 'Visiting / On-Call';
      await api.updateDoctor(fullEditDoctor.id, {
        ...fullEditFormData,
        is_on_call: isOnCall,
        consultant_type: fullEditFormData.consultant_type
      });
      setFullEditDoctor(null);
      await loadSecurityData();
      onDoctorUpdated?.();
    } catch (err) {
      alert('Failed to save doctor details. Please try again.');
    } finally {
      setSavingFullEdit(false);
    }
  };

  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const nextStatus = doctor.account_status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.updateDoctorSecurity(doctor.id, { account_status: nextStatus });
      loadSecurityData();
    } catch (err) {
      alert('Failed to update doctor account status.');
    }
  };

  const handleChangeSuperPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuperPasskey || newSuperPasskey.length < 4) {
      alert('Passkey must be at least 4 characters long.');
      return;
    }
    await api.setSuperAdminPasskey(newSuperPasskey);
    setPasskeySuccessMsg('Super Administrator Passkey updated successfully!');
    setNewSuperPasskey('');
    setTimeout(() => setPasskeySuccessMsg(''), 3000);
  };

  if (!isOpen) return null;

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-6 pt-10 sm:pt-14">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Super Administrator Security Console</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                  Passkey Guarded
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Monitor Doctor Login Credentials, Access Passwords, Account Status, and Real-Time Audit Trail
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsUnlocked(false);
              setPasskeyInput('');
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shrink-0 hover:scale-110 active:scale-95 cursor-pointer border border-white/20 shadow-md"
            title="Close Security Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED STATE: Passkey Prompt */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Security Verification Required</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the Super Administrator Passkey to view confidential Doctor login credentials and security logs.
              </p>
            </div>

            <form onSubmit={handleVerifyPasskey} className="space-y-4">
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter Security Passkey..."
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 font-mono text-sm focus:outline-none focus:border-emerald-600 text-center tracking-widest"
                />
              </div>

              {passkeyError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {passkeyError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Unlock Security Monitor
              </button>
            </form>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Default Passkey Hint:
              </span>
              <p className="font-mono text-slate-800">Passkey: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-emerald-800">SKMH-SUPER-2026</code> or <code className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-emerald-800">123456</code></p>
            </div>
          </div>
        ) : (
          /* UNLOCKED STATE: Doctor Security Dashboard */
          <div className="p-6 space-y-6">
            
            {/* Top Navigation Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setActiveSubTab('credentials')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === 'credentials'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" /> Doctor Login Credentials ({doctors.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('audit_logs')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === 'audit_logs'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-4 h-4 text-blue-600" /> Access Audit Trail ({logs.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('change_passkey')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSubTab === 'change_passkey'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-600" /> Passkey Configuration
                </button>
              </div>

              <button
                onClick={loadSecurityData}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* TAB 1: Doctor Login Credentials & Status */}
            {activeSubTab === 'credentials' && (
              <div className="space-y-4">
                
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search doctor by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Doctors Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Doctor & Specialty</th>
                        <th className="p-3.5">Login Email</th>
                        <th className="p-3.5">Assigned Password</th>
                        <th className="p-3.5">Account Status</th>
                        <th className="p-3.5">Last Login Activity</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDoctors.map((doc) => {
                        const showPass = showPasswordsMap[doc.id] || false;
                        const isSuspended = doc.account_status === 'suspended';

                        return (
                          <tr key={doc.id} className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
                            <td className="p-3.5 font-semibold text-slate-900">
                              <div className="flex items-center gap-3">
                                <img
                                  src={doc.photo_url}
                                  alt={doc.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="font-extrabold text-slate-900">{doc.name}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">{doc.department}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-mono text-slate-800 text-[11px]">
                              {doc.email}
                            </td>

                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {showPass ? (doc.login_password || 'Doctor@123') : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePasswordVisibility(doc.id)}
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>

                            <td className="p-3.5">
                              {isSuspended ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                                  <UserX className="w-3 h-3" /> Suspended
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-[11px] text-slate-600">
                              <div>
                                <span className="font-bold">{doc.last_login_at ? new Date(doc.last_login_at).toLocaleString() : 'Recent'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                IP: {doc.last_login_ip || '192.168.1.104'}
                              </div>
                            </td>

                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenFullDoctorEdit(doc)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit Doctor Profile, Name, Specialty, OPD Fee & Timings"
                              >
                                <Edit className="w-3 h-3 text-blue-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDoctor(doc);
                                  setNewPassword(doc.login_password || '');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Change Doctor Login Password"
                              >
                                <KeyRound className="w-3 h-3 text-emerald-600" />
                                <span>Change Pass</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDoctorStatus(doc)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  isSuspended 
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                                }`}
                                title={isSuspended ? "Unlock Doctor Account" : "Suspend Doctor Account"}
                              >
                                {isSuspended ? 'Unlock' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 2: Doctor Access Audit Logs */}
            {activeSubTab === 'audit_logs' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                  <span>Showing real-time authentication event logs for all medical consultants</span>
                  <span className="text-slate-400 font-mono">Total Events: {logs.length}</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Doctor Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">IP Address</th>
                        <th className="p-3.5">Terminal / Device</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono text-[11px] text-slate-600">
                            {new Date(log.login_time).toLocaleString()}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{log.doctor_name}</td>
                          <td className="p-3.5 font-mono text-slate-600 text-[11px]">{log.email}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-700">{log.ip_address}</td>
                          <td className="p-3.5 text-slate-500 text-[11px]">{log.device_info}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Change Super Passkey */}
            {activeSubTab === 'change_passkey' && (
              <div className="max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" /> Change Super Administrator Security Passkey
                </h3>
                <p className="text-xs text-slate-500">
                  Update the master security passkey required to access this Doctor Security Console.
                </p>

                {passkeySuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {passkeySuccessMsg}
                  </div>
                )}

                <form onSubmit={handleChangeSuperPasskey} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New Security Passkey</label>
                    <input
                      type="password"
                      required
                      placeholder="e.g. SKMH-MASTER-2026"
                      value={newSuperPasskey}
                      onChange={(e) => setNewSuperPasskey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save New Passkey
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Doctor Password Change Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left">
            <button
              onClick={() => setEditingDoctor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-slate-900 text-base pr-6">
              Change Password for {editingDoctor.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Account Email: {editingDoctor.email}
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">New Password / PIN</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL DOCTOR PROFILE EDIT MODAL */}
      {fullEditDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Edit Doctor Profile & Credentials</h3>
                  <p className="text-xs text-slate-400">Modify clinical details, consultation fees, specialty, and contact information.</p>
                </div>
              </div>
              <button
                onClick={() => setFullEditDoctor(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullDoctor} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-left">
              {/* Doctor Avatar / Photo Upload */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative group shrink-0">
                  <img
                    src={fullEditFormData.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                    alt={fullEditFormData.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Doctor Photo Avatar
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload new image or paste image web URL below:
                  </p>
                  <input
                    type="text"
                    value={fullEditFormData.photo_url}
                    onChange={(e) => setFullEditFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doctor Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullEditFormData.name}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Dr. Tushar Patel"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Specialization / Clinical Designation *
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullEditFormData.specialization}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g. Orthopedics & Joint Replacement"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hospital Department *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullEditFormData.department}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Orthopedics"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    />
                  </div>
                </div>

                {/* Login Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Doctor Login Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={fullEditFormData.email}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. dr.tushar.patel@skmh.org"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={fullEditFormData.phone}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 90990 57219"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Medical Qualifications
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={fullEditFormData.qualification}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, qualification: e.target.value }))}
                      placeholder="e.g. MBBS, MS (Ortho), FIJR"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    />
                  </div>
                </div>

                {/* Experience & Fee */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={fullEditFormData.experience_years}
                    onChange={(e) => setFullEditFormData(prev => ({ ...prev, experience_years: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    OPD Consultation Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="text-slate-400 font-bold absolute left-3 top-2 text-xs">₹</span>
                    <input
                      type="number"
                      value={fullEditFormData.consultation_fee}
                      onChange={(e) => setFullEditFormData(prev => ({ ...prev, consultation_fee: Number(e.target.value) }))}
                      className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-black text-emerald-800"
                    />
                  </div>
                </div>

                {/* Consultant Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Consultant Designation Type
                  </label>
                  <select
                    value={fullEditFormData.consultant_type}
                    onChange={(e) => setFullEditFormData(prev => ({ ...prev, consultant_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-semibold cursor-pointer"
                  >
                    <option value="Resident Consultant">Resident Consultant (Full Time)</option>
                    <option value="Visiting / On-Call">Visiting / On-Call Specialist</option>
                  </select>
                </div>

                {/* OPD Timings */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    OPD Schedule / Timings
                  </label>
                  <input
                    type="text"
                    value={fullEditFormData.opd_timings}
                    onChange={(e) => setFullEditFormData(prev => ({ ...prev, opd_timings: e.target.value }))}
                    placeholder="Mon - Sat (09:00 AM - 08:30 PM • After 8:30 PM Emergency Only)"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Bio / Clinical Profile */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Doctor Profile & Clinical Overview
                </label>
                <textarea
                  rows={3}
                  value={fullEditFormData.bio}
                  onChange={(e) => setFullEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Describe doctor clinical specializations, procedural experience, surgical expertise..."
                  className="w-full p-3 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFullEditDoctor(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFullEdit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingFullEdit ? 'Saving Updates...' : 'Save Doctor Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
