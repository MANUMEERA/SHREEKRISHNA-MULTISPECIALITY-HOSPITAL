import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { KeyRound, Mail, Phone, Lock, CheckCircle2, AlertCircle, X, ShieldCheck, ArrowRight, RefreshCw, Send } from 'lucide-react';

interface PatientForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess?: (email: string) => void;
}

export const PatientForgotPasswordModal: React.FC<PatientForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess
}) => {
  const [step, setStep] = useState<'verify_account' | 'enter_otp' | 'reset_password' | 'success'>('verify_account');
  const [identifier, setIdentifier] = useState(''); // Email, Phone or Patient Code
  const [matchedPatient, setMatchedPatient] = useState<User | null>(null);
  
  const [otpCode, setOtpCode] = useState('');
  const [generatedMockOtp, setGeneratedMockOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Step 1: Find Patient by Email / Phone / Patient Code
  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (!identifier.trim()) {
      setError('Please enter your registered Email address, Phone number, or Patient Code.');
      return;
    }

    setLoading(true);
    try {
      const users = await api.getUsers();
      const q = identifier.trim().toLowerCase();
      
      const found = users.find(u => 
        u.role === 'patient' && (
          u.email.toLowerCase() === q ||
          (u.phone && u.phone.replaceAll(' ', '').includes(q.replaceAll(' ', ''))) ||
          (u.patient_code && u.patient_code.toLowerCase() === q)
        )
      );

      if (!found) {
        // Create demo mock fallback if patient not found
        setError('No registered Patient account found matching this details. Please check your Patient ID Code or Email.');
        setLoading(false);
        return;
      }

      setMatchedPatient(found);
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedMockOtp(randomOtp);
      setOtpCode(randomOtp); // Autofill for ease of demo
      setInfoMsg(`Verification OTP sent to registered mobile (${found.phone || '+91 98*** ****5'}) and Email (${found.email}).`);
      setStep('enter_otp');
    } catch (err: any) {
      setError('An error occurred while locating patient account.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate OTP Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode || otpCode.trim() !== generatedMockOtp) {
      setError('Invalid OTP Verification Code. Please check the 6-digit code.');
      return;
    }
    setStep('reset_password');
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      if (matchedPatient) {
        await api.resetPatientPassword(matchedPatient.email, newPassword);
      }
      setStep('success');
    } catch (err: any) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('verify_account');
    setIdentifier('');
    setMatchedPatient(null);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfoMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-black">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Patient Password Recovery</h3>
              <p className="text-[11px] text-slate-500">Shree Krishna Hospital Patient Portal Self-Service</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
            title="Close Password Recovery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: VERIFY PATIENT ACCOUNT */}
        {step === 'verify_account' && (
          <form onSubmit={handleVerifyAccount} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed font-medium">
              🔑 Enter your registered <strong>Patient Email Address</strong>, <strong>Mobile Phone Number</strong>, or <strong>Patient ID Code</strong> (e.g. <code>SKMH-2026-PAT-101</code>) to receive a password reset verification code.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Patient Email / Phone / Patient Code *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. patient@skmh.org or SKMH-2026-PAT-101"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow flex items-center gap-1.5"
              >
                {loading ? 'Searching Record...' : 'Send Verification OTP'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER OTP CODE */}
        {step === 'enter_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Patient Record Confirmed!</span>
              </div>
              <p>Found Patient: <strong>{matchedPatient?.full_name}</strong> ({matchedPatient?.patient_code})</p>
              <p className="text-[10px] text-blue-700 font-mono mt-1">
                📲 Mock OTP Code: <strong className="text-blue-900 bg-blue-200 px-1.5 py-0.5 rounded font-black text-xs">{generatedMockOtp}</strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Enter 6-Digit Verification OTP *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-center font-mono font-black text-base tracking-widest focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('verify_account')}
                className="text-[11px] font-bold text-slate-500 hover:underline"
              >
                ← Back
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow flex items-center gap-1.5"
              >
                Verify Code & Proceed
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESET NEW PASSWORD */}
        {step === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 font-semibold">
              🔒 Create a new secure password for <strong>{matchedPatient?.full_name}</strong>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow flex items-center justify-center gap-1.5"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">Password Reset Successfully!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your password for patient account <strong className="text-slate-900">{matchedPatient?.email}</strong> has been updated. You can now log in with your new credentials.
              </p>
            </div>

            <button
              onClick={() => {
                if (matchedPatient && onPasswordResetSuccess) {
                  onPasswordResetSuccess(matchedPatient.email);
                }
                handleClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-xs shadow hover:bg-slate-800 transition-colors"
            >
              Sign In To Patient Portal Now →
            </button>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};
