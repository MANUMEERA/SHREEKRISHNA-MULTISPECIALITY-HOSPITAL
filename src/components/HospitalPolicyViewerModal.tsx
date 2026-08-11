import React, { useState, useEffect } from 'react';
import { HospitalPolicy } from '../types';
import { api } from '../lib/api';
import { X, ShieldCheck, FileText, Printer, Building2, CheckCircle2, Lock, Scale, HeartHandshake } from 'lucide-react';
import { HospitalLogo } from './common/HospitalLogo';

export type PolicyType = 'privacy' | 'terms' | 'charter';

interface HospitalPolicyViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyType;
}

export const HospitalPolicyViewerModal: React.FC<HospitalPolicyViewerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);
  const [policies, setPolicies] = useState<HospitalPolicy>({
    privacy_policy: '',
    terms_of_service: '',
    patients_charter: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadPolicies();
    }

    const handlePolicyUpdate = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        setPolicies(customEv.detail);
      } else {
        loadPolicies();
      }
    };

    window.addEventListener('policies_updated', handlePolicyUpdate);
    return () => window.removeEventListener('policies_updated', handlePolicyUpdate);
  }, [isOpen]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getHospitalPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load hospital policies:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getActiveTitle = () => {
    switch (activeTab) {
      case 'privacy':
        return 'Privacy Policy & EHR Data Protection';
      case 'terms':
        return 'Terms of Service & OPD Regulations';
      case 'charter':
        return 'Patients Charter of Rights & Responsibilities';
    }
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'privacy':
        return policies.privacy_policy;
      case 'terms':
        return policies.terms_of_service;
      case 'charter':
        return policies.patients_charter;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl my-auto border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full">
        
        {/* Sticky Modal Header (Hidden on print) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Hospital Compliance & Legal Document
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ADMIN SYNCED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official document maintained by Admin & Super Administrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Hidden on print) */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center gap-2 shrink-0 print:hidden text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" /> Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" /> Terms of Service
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charter')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'charter'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> Patients Charter
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          
          {/* Hospital Header for Printable Document */}
          <div className="border-b-2 border-slate-900 pb-5 flex items-center justify-between gap-4">
            <HospitalLogo size="md" variant="full" theme="light" />
            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-block">
                OFFICIAL HOSPITAL COMPLIANCE
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Silvassa, Dadra & Nagar Haveli • Reg: SKMH/LEG/2026
              </p>
            </div>
          </div>

          {/* Active Document Header */}
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
              {getActiveTitle()}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Effective Date: August 2026 • Verified & Approved by Medical Superintendent
            </p>
          </div>

          {/* Content Loading or Body */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold animate-pulse">
              Loading official policy document from Admin records...
            </div>
          ) : (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
              {getActiveContent()
                ? getActiveContent().split('\n').map((paragraph, idx) => (
                    <p key={idx} className={paragraph.trim().startsWith('1.') || paragraph.trim().startsWith('2.') || paragraph.trim().startsWith('3.') || paragraph.trim().startsWith('4.') ? 'font-bold text-slate-900 pt-1' : ''}>
                      {paragraph}
                    </p>
                  ))
                : (
                  <p className="text-slate-400 italic">
                    No custom policy text set. Admin can configure this policy in the Admin Dashboard &gt; Hospital Settings Console.
                  </p>
                )}
            </div>
          )}

          {/* Verification Footer Note */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Directly synchronized with Admin & Governance Control Panel</span>
            </div>
            <p className="text-slate-400">© 2026 Shree Krishna Multispeciality Hospital</p>
          </div>

        </div>

        {/* Modal Footer Bar (Hidden on print) */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            To edit this content: Login as Admin &gt; Admin Panel &gt; Hospital Settings &gt; Policies
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
};
