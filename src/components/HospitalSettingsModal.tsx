import React, { useState, useEffect } from 'react';
import { HospitalStampConfig, HospitalPolicy } from '../types';
import { api } from '../lib/api';
import { X, ShieldCheck, FileText, Image as ImageIcon, CheckCircle2, Save, Upload, Stamp } from 'lucide-react';

interface HospitalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalSettingsModal: React.FC<HospitalSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'stamp' | 'policies'>('stamp');

  const [stampConfig, setStampConfig] = useState<HospitalStampConfig>({
    stamp_url: '',
    signature_url: '',
    authorized_doctor_name: 'Dr. Rajesh Krishna',
    registration_number: 'GMC-SILVASSA-REG-2012-8841',
    designation: 'Medical Superintendent & Senior Cardiologist'
  });

  const [policies, setPolicies] = useState<HospitalPolicy>({
    privacy_policy: '',
    terms_of_service: '',
    patients_charter: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.getHospitalStampConfig().then(setStampConfig).catch(console.error);
    api.getHospitalPolicies().then(setPolicies).catch(console.error);
  }, []);

  const handleSaveStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveHospitalStampConfig(stampConfig);
      setSuccessMsg('Hospital Digital Stamp and Doctor Signature updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveHospitalPolicies(policies);
      setSuccessMsg('Privacy Policy, Terms of Service, and Patients Charter updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Hospital Compliance, Stamp & Legal Policy Console
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Manage Hospital Seal, Medical Officer Signature, Privacy Policy, and Patients Charter
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('stamp')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'stamp'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" /> Digital Stamp & Signature Manager
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'policies'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" /> Hospital Policies & Patient Charter
          </button>
        </div>

        {/* TAB 1: STAMP & SIGNATURE */}
        {activeTab === 'stamp' && (
          <form onSubmit={handleSaveStamp} className="space-y-5 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="block font-black text-slate-900 uppercase">Hospital Official Seal Stamp URL</label>
                <input
                  type="text"
                  required
                  value={stampConfig.stamp_url}
                  onChange={(e) => setStampConfig({ ...stampConfig, stamp_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                  placeholder="https://..."
                />
                {stampConfig.stamp_url && (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <img src={stampConfig.stamp_url} alt="Stamp Preview" className="h-20 object-contain" />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="block font-black text-slate-900 uppercase">Authorized Doctor Signature URL</label>
                <input
                  type="text"
                  required
                  value={stampConfig.signature_url}
                  onChange={(e) => setStampConfig({ ...stampConfig, signature_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                  placeholder="https://..."
                />
                {stampConfig.signature_url && (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <img src={stampConfig.signature_url} alt="Signature Preview" className="h-16 object-contain" />
                  </div>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Authorized Doctor Name</label>
                <input
                  type="text"
                  value={stampConfig.authorized_doctor_name}
                  onChange={(e) => setStampConfig({ ...stampConfig, authorized_doctor_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">GMC Registration Number</label>
                <input
                  type="text"
                  value={stampConfig.registration_number}
                  onChange={(e) => setStampConfig({ ...stampConfig, registration_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  value={stampConfig.designation}
                  onChange={(e) => setStampConfig({ ...stampConfig, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Stamp & Signature Configuration
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: POLICIES */}
        {activeTab === 'policies' && (
          <form onSubmit={handleSavePolicies} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-extrabold uppercase text-slate-900 mb-1">Privacy Policy & EHR Data Security</label>
              <textarea
                rows={4}
                value={policies.privacy_policy}
                onChange={(e) => setPolicies({ ...policies, privacy_policy: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-extrabold uppercase text-slate-900 mb-1">Terms of Service & Hospital OPD Rules</label>
              <textarea
                rows={4}
                value={policies.terms_of_service}
                onChange={(e) => setPolicies({ ...policies, terms_of_service: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-extrabold uppercase text-slate-900 mb-1">Patients' Charter of Rights</label>
              <textarea
                rows={4}
                value={policies.patients_charter}
                onChange={(e) => setPolicies({ ...policies, patients_charter: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Legal Policies & Charter
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
