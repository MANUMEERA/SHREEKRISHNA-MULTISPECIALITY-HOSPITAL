import React, { useState, useEffect, useRef } from 'react';
import { HospitalStampConfig, HospitalPolicy, Doctor } from '../types';
import { api } from '../lib/api';
import { X, ShieldCheck, FileText, Image as ImageIcon, CheckCircle2, Save, Upload, Stamp, UserCheck, Stethoscope, FileUp, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface HospitalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalSettingsModal: React.FC<HospitalSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'stamp' | 'doctors' | 'policies'>('stamp');

  // Global Hospital Stamp Config
  const [stampConfig, setStampConfig] = useState<HospitalStampConfig>({
    stamp_url: '',
    signature_url: '',
    authorized_doctor_name: 'Dr. Rajesh Krishna',
    registration_number: 'GMC-SILVASSA-REG-2012-8841',
    designation: 'Medical Superintendent & Senior Cardiologist'
  });

  // Doctor Signatory Management State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);

  // Selected Doctor Form
  const [docSignatureUrl, setDocSignatureUrl] = useState<string>('');
  const [docStampUrl, setDocStampUrl] = useState<string>('');
  const [docRegNo, setDocRegNo] = useState<string>('');
  const [docDesignation, setDocDesignation] = useState<string>('');
  const [docIsAuthorised, setDocIsAuthorised] = useState<boolean>(true);

  // Policies State
  const [policies, setPolicies] = useState<HospitalPolicy>({
    privacy_policy: '',
    terms_of_service: '',
    patients_charter: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // File Input Refs
  const hospitalStampFileRef = useRef<HTMLInputElement>(null);
  const hospitalSigFileRef = useRef<HTMLInputElement>(null);
  const doctorSigFileRef = useRef<HTMLInputElement>(null);
  const doctorStampFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [config, pols, docsList] = await Promise.all([
        api.getHospitalStampConfig(),
        api.getHospitalPolicies(),
        api.getDoctors()
      ]);

      setStampConfig(config);
      setPolicies(pols);
      setDoctors(docsList);

      if (docsList.length > 0) {
        const initialDoc = docsList[0];
        setSelectedDocId(initialDoc.id);
        populateDoctorForm(initialDoc);
      }
    } catch (err) {
      console.error('Failed to load settings modal data:', err);
    }
  };

  const populateDoctorForm = (doc: Doctor) => {
    setSelectedDoc(doc);
    setDocSignatureUrl(doc.signature_url || stampConfig.signature_url || '');
    setDocStampUrl(doc.stamp_url || stampConfig.stamp_url || '');
    setDocRegNo(doc.registration_number || 'GMC-SILVASSA-REG-2008-5412');
    setDocDesignation(doc.designation || doc.qualification || 'Senior Medical Officer');
    setDocIsAuthorised(doc.is_authorised_signatory !== undefined ? doc.is_authorised_signatory : true);
  };

  const handleSelectDoctor = (docId: string) => {
    setSelectedDocId(docId);
    const found = doctors.find(d => d.id === docId);
    if (found) {
      populateDoctorForm(found);
    }
  };

  // Base64 File Reader helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHospitalStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveHospitalStampConfig(stampConfig);
      setSuccessMsg('Hospital Global Stamp & Official Signatory updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoctorSignatory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setSaving(true);
    try {
      const updatedFields: Partial<Doctor> = {
        signature_url: docSignatureUrl,
        stamp_url: docStampUrl,
        registration_number: docRegNo,
        designation: docDesignation,
        is_authorised_signatory: docIsAuthorised
      };

      await api.updateDoctor(selectedDoc.id, updatedFields);
      
      // Update local doctors list
      setDoctors(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, ...updatedFields } : d));
      
      setSuccessMsg(`Signatory details & digital signature for ${selectedDoc.name} saved! Synced with OPD Prescriptions.`);
      setTimeout(() => setSuccessMsg(''), 4000);
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
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl my-auto border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Hospital Compliance & Doctor Signatory Console
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Manage Hospital Official Seal, Every Doctor Digital Signature, GMC Registration, and Legal Policies
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

        {/* Success Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('stamp')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'stamp'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stamp className="w-4 h-4 text-emerald-400" /> Global Hospital Seal
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'doctors'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-amber-400" /> Doctor Signatories & Prescriptions
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'policies'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" /> Hospital Policies & Charter
          </button>
        </div>

        {/* TAB 1: GLOBAL HOSPITAL SEAL & STAMP */}
        {activeTab === 'stamp' && (
          <form onSubmit={handleSaveHospitalStamp} className="space-y-5 text-xs">
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
              <strong>Hospital Official Seal & Default Stamp:</strong> This seal and default signature appear on general hospital receipts, IPD billing summaries, and default medical certificates.
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Official Seal Upload Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 uppercase tracking-wider">Hospital Official Seal Stamp</label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Official Seal</span>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 bg-white text-center transition-all">
                  {stampConfig.stamp_url ? (
                    <div className="space-y-3">
                      <img src={stampConfig.stamp_url} alt="Hospital Stamp Preview" className="h-24 mx-auto object-contain" />
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => hospitalStampFileRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5 text-emerald-600" /> Upload New Stamp Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setStampConfig({ ...stampConfig, stamp_url: '' })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-800">Upload Hospital Seal Stamp Image</div>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP, SVG (Max 5MB)</p>
                      <button
                        type="button"
                        onClick={() => hospitalStampFileRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileUp className="w-4 h-4" /> Browse Image File
                      </button>
                    </div>
                  )}

                  <input
                    ref={hospitalStampFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, (url) => setStampConfig(prev => ({ ...prev, stamp_url: url })))}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Or paste Image URL:</span>
                  <input
                    type="text"
                    value={stampConfig.stamp_url}
                    onChange={(e) => setStampConfig({ ...stampConfig, stamp_url: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono text-[10px]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Authorized Default Signature Upload Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 uppercase tracking-wider">Default Medical Officer Signature</label>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded-full">Default Signature</span>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-4 bg-white text-center transition-all">
                  {stampConfig.signature_url ? (
                    <div className="space-y-3">
                      <img src={stampConfig.signature_url} alt="Signature Preview" className="h-20 mx-auto object-contain" />
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => hospitalSigFileRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5 text-teal-600" /> Upload New Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setStampConfig({ ...stampConfig, signature_url: '' })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-800">Upload Default Signature Image</div>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP, SVG (Max 5MB)</p>
                      <button
                        type="button"
                        onClick={() => hospitalSigFileRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileUp className="w-4 h-4" /> Browse Signature File
                      </button>
                    </div>
                  )}

                  <input
                    ref={hospitalSigFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, (url) => setStampConfig(prev => ({ ...prev, signature_url: url })))}
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Or paste Signature Image URL:</span>
                  <input
                    type="text"
                    value={stampConfig.signature_url}
                    onChange={(e) => setStampConfig({ ...stampConfig, signature_url: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono text-[10px]"
                    placeholder="https://..."
                  />
                </div>
              </div>

            </div>

            {/* Global Signatory Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Medical Superintendent / Officer Name</label>
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Designation</label>
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
                <Save className="w-4 h-4" /> Save Global Seal Configuration
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: EVERY DOCTOR SIGNATORY & PRESCRIPTIONS MANAGER */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 text-xs">
            
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950 font-medium leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Every Doctor Dedicated Signatory & Stamp Manager:</strong> Upload direct signature & stamp images for each consulting specialist. Once uploaded here, the doctor's exact digital signature, GMC registration number, and official seal will automatically be captured and printed on their dedicated OPD Prescriptions!
              </div>
            </div>

            {/* Doctor Selection Grid / Tabs */}
            <div>
              <label className="block font-extrabold text-slate-900 uppercase tracking-wider mb-2">Select Doctor to Manage Signatory & Prescription Details:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {doctors.map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  const hasSig = !!doc.signature_url;

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doc.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img src={doc.photo_url} alt={doc.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-emerald-200" />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{doc.department.split('&')[0]}</div>
                        <div className="mt-1 flex items-center gap-1">
                          {hasSig ? (
                            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Signed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                              No Sig
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Doctor Signatory Editor Form */}
            {selectedDoc && (
              <form onSubmit={handleSaveDoctorSignatory} className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-5">
                
                {/* Doctor Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <img src={selectedDoc.photo_url} alt={selectedDoc.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{selectedDoc.name}</h3>
                      <p className="text-xs font-semibold text-emerald-800">{selectedDoc.specialization} • {selectedDoc.department}</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={docIsAuthorised}
                      onChange={(e) => setDocIsAuthorised(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800 text-xs">Authorised Prescription Signatory</span>
                  </label>
                </div>

                {/* Upload Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Doctor Digital Signature File Upload */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-900 uppercase tracking-wider">Doctor Digital Signature</label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Prescription Signature</span>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3 text-center bg-slate-50/50 transition-all">
                      {docSignatureUrl ? (
                        <div className="space-y-2">
                          <img src={docSignatureUrl} alt={`${selectedDoc.name} Signature`} className="h-16 mx-auto object-contain bg-white p-1 rounded border border-slate-200" />
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => doctorSigFileRef.current?.click()}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <FileUp className="w-3 h-3" /> Upload New Signature Image
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocSignatureUrl('')}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <FileUp className="w-7 h-7 text-slate-400 mx-auto" />
                          <div className="font-bold text-slate-800">Upload {selectedDoc.name}'s Signature File</div>
                          <button
                            type="button"
                            onClick={() => doctorSigFileRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" /> Upload Image File
                          </button>
                        </div>
                      )}

                      <input
                        ref={doctorSigFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, (url) => setDocSignatureUrl(url))}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">Or paste Signature Image URL:</span>
                      <input
                        type="text"
                        value={docSignatureUrl}
                        onChange={(e) => setDocSignatureUrl(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 font-mono text-[10px]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Doctor OPD Stamp File Upload */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-900 uppercase tracking-wider">Doctor OPD Official Seal / Stamp</label>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">OPD Stamp</span>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-3 text-center bg-slate-50/50 transition-all">
                      {docStampUrl ? (
                        <div className="space-y-2">
                          <img src={docStampUrl} alt={`${selectedDoc.name} Stamp`} className="h-16 mx-auto object-contain bg-white p-1 rounded border border-slate-200" />
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => doctorStampFileRef.current?.click()}
                              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <FileUp className="w-3 h-3" /> Upload New Stamp Image
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocStampUrl('')}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-3">
                          <FileUp className="w-7 h-7 text-slate-400 mx-auto" />
                          <div className="font-bold text-slate-800">Upload Doctor OPD Stamp File</div>
                          <button
                            type="button"
                            onClick={() => doctorStampFileRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" /> Upload Stamp Image
                          </button>
                        </div>
                      )}

                      <input
                        ref={doctorStampFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, (url) => setDocStampUrl(url))}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">Or paste Stamp Image URL:</span>
                      <input
                        type="text"
                        value={docStampUrl}
                        onChange={(e) => setDocStampUrl(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 font-mono text-[10px]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                </div>

                {/* Registration & Designation Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase mb-1">GMC / Medical Council Reg. No.</label>
                    <input
                      type="text"
                      required
                      value={docRegNo}
                      onChange={(e) => setDocRegNo(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-900"
                      placeholder="e.g. GMC-SILVASSA-REG-2008-5412"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 uppercase mb-1">Prescription Official Designation</label>
                    <input
                      type="text"
                      required
                      value={docDesignation}
                      onChange={(e) => setDocDesignation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                      placeholder="e.g. Senior Orthopedic Surgeon & HOD"
                    />
                  </div>
                </div>

                {/* Dedicated Prescription Signature Box Live Preview */}
                <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                    <span>Rx OPD Prescription Signature Preview</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[9px] font-bold">Live Prescription Preview</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30 flex items-center justify-between text-left">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Consulting Specialist:</div>
                      <strong className="text-sm font-black text-slate-900 block">{selectedDoc.name}</strong>
                      <div className="text-xs text-emerald-900 font-extrabold">{docDesignation}</div>
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5">GMC Reg: {docRegNo}</div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      {docStampUrl && (
                        <img src={docStampUrl} alt="OPD Stamp" className="w-14 h-14 object-contain opacity-85" />
                      )}
                      <div className="text-center border-t border-slate-300 pt-1 w-32">
                        {docSignatureUrl ? (
                          <img src={docSignatureUrl} alt="Signature" className="h-10 mx-auto object-contain mb-1" />
                        ) : (
                          <div className="h-10 text-[9px] text-slate-400 italic flex items-center justify-center">[Signature Here]</div>
                        )}
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Authorized Doctor Sign</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Signatory & Attach to Prescriptions
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* TAB 3: POLICIES */}
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
    </div>
  );
};

