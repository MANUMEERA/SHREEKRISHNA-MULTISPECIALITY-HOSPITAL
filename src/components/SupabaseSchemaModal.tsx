import React, { useState } from 'react';
import { Database, Copy, Check, Download, X, Server, Shield, Table, Key, Code, Sparkles, Layers, FileCode } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'client'>('tables');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shree_krishna_hospital_supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tableDefinitions = [
    {
      name: 'public.users',
      description: 'Master User directory for Patients, Doctors, Staff, Receptionists, Admins & Super Admins',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Auto-generated unique user ID' },
        { name: 'patient_code', type: 'VARCHAR(50)', key: 'UNIQUE', desc: 'Hospital Patient Code (e.g., SKMH-PAT-101)' },
        { name: 'email', type: 'VARCHAR(255)', key: 'UNIQUE / NOT NULL', desc: 'Login & communication email address' },
        { name: 'full_name', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Full legal name of patient/user' },
        { name: 'role', type: 'VARCHAR(50)', key: 'CHECK constraint', desc: 'patient | doctor | staff | admin | super_admin | receptionist' },
        { name: 'phone', type: 'VARCHAR(20)', key: '-', desc: '10-digit mobile contact number' },
        { name: 'blood_group', type: 'VARCHAR(10)', key: '-', desc: 'A+, B+, O+, AB+, A-, B-, O-, AB-' },
        { name: 'allergies', type: 'TEXT[]', key: 'ARRAY', desc: 'Array of drug or food allergy tags' },
        { name: 'chronic_conditions', type: 'TEXT[]', key: 'ARRAY', desc: 'Array of pre-existing conditions (Diabetes, Hypertension)' },
        { name: 'address', type: 'TEXT', key: '-', desc: 'Residential address with PIN code' }
      ]
    },
    {
      name: 'public.doctors',
      description: 'Doctor credentials, department specs, OPD timings, availability status & digital signatures',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Doctor record ID' },
        { name: 'user_id', type: 'UUID', key: 'FOREIGN KEY -> users(id)', desc: 'Link to authenticated user account' },
        { name: 'name', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Full doctor name with titles (e.g. Dr. Rajesh Krishna)' },
        { name: 'department', type: 'VARCHAR(100)', key: 'NOT NULL', desc: 'Cardiology, Orthopedics, Pediatrics, Neurology, etc.' },
        { name: 'specialization', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Clinical sub-speciality & fellowship details' },
        { name: 'consultation_fee', type: 'NUMERIC(10,2)', key: 'DEFAULT 500.00', desc: 'OPD visit fee in INR' },
        { name: 'availability_status', type: 'VARCHAR(50)', key: 'DEFAULT Available', desc: 'Available | In OPD | In OT / Surgery | On Leave | Off Duty' },
        { name: 'signature_url', type: 'TEXT', key: '-', desc: 'Authorized doctor digital signature image URL' },
        { name: 'stamp_url', type: 'TEXT', key: '-', desc: 'Official doctor seal & registration stamp image URL' },
        { name: 'registration_number', type: 'VARCHAR(100)', key: '-', desc: 'Medical Council registration ID (e.g. GMC-48912/2012)' }
      ]
    },
    {
      name: 'public.appointments',
      description: 'OPD Consultation Bookings, Vitals, Diagnoses, Prescriptions & Higher Referral Notes',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Appointment ID' },
        { name: 'user_id', type: 'UUID', key: 'FOREIGN KEY -> users(id)', desc: 'Patient user ID' },
        { name: 'doctor_id', type: 'UUID', key: 'FOREIGN KEY -> doctors(id)', desc: 'Consulting doctor ID' },
        { name: 'appointment_date', type: 'DATE', key: 'NOT NULL', desc: 'Scheduled consultation date' },
        { name: 'time_slot', type: 'VARCHAR(50)', key: 'NOT NULL', desc: 'Selected OPD time slot (e.g., 10:00 AM - 10:30 AM)' },
        { name: 'status', type: 'VARCHAR(20)', key: 'CHECK', desc: 'pending | confirmed | completed | cancelled' },
        { name: 'vitals', type: 'JSONB', key: 'JSONB Object', desc: 'BP, Pulse, Temp, SpO2, Sugar, Weight' },
        { name: 'prescribed_medicines', type: 'JSONB', key: 'JSONB Array', desc: 'Rx medicines list with dosage, frequency, duration' },
        { name: 'higher_reference', type: 'JSONB', key: 'JSONB Object', desc: 'Referral hospital, reason, urgency, doctor signature notes' },
        { name: 'recommend_admission', type: 'BOOLEAN', key: 'DEFAULT FALSE', desc: 'Flag if doctor recommends IPD admission' }
      ]
    },
    {
      name: 'public.admitted_patients',
      description: 'IPD Inpatient Admissions, Bed/Ward Allocation, Daily Routine Vitals, Doses & Surgeries',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'IPD admission record ID' },
        { name: 'patient_id', type: 'UUID', key: 'FOREIGN KEY -> users(id)', desc: 'Admitted patient user ID' },
        { name: 'patient_code', type: 'VARCHAR(50)', key: 'NOT NULL', desc: 'Patient ID code' },
        { name: 'doctor_id', type: 'UUID', key: 'FOREIGN KEY -> doctors(id)', desc: 'Primary treating consultant doctor' },
        { name: 'ward_type', type: 'VARCHAR(100)', key: 'NOT NULL', desc: 'Deluxe Ward | Super Deluxe Suite | General Ward | ICU Critical Care' },
        { name: 'bed_number', type: 'VARCHAR(50)', key: 'NOT NULL', desc: 'Allocated bed / room number' },
        { name: 'daily_bed_charge', type: 'NUMERIC(10,2)', key: 'DEFAULT 1500', desc: 'Per-day ward bed fee' },
        { name: 'status', type: 'VARCHAR(20)', key: 'CHECK', desc: 'Admitted | Discharged | Transferred' },
        { name: 'daily_routine_checkups', type: 'JSONB', key: 'JSONB Array', desc: 'Daily nursing/doctor vitals checkups log' },
        { name: 'daily_doses', type: 'JSONB', key: 'JSONB Array', desc: 'Daily medicine & IV fluid dose execution log' },
        { name: 'surgeries_performed', type: 'JSONB', key: 'JSONB Array', desc: 'OT surgeries log with surgeon names & charges' },
        { name: 'is_locked', type: 'BOOLEAN', key: 'DEFAULT TRUE', desc: 'Locked after admission to prevent non-authorized edits' }
      ]
    },
    {
      name: 'public.medicines',
      description: 'Pharmacy Master Inventory Stock & Price Thresholds',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Medicine item ID' },
        { name: 'name', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Drug trade / generic name' },
        { name: 'category', type: 'VARCHAR(50)', key: 'CHECK', desc: 'Tablet | Capsule | Syrup | Injection | Ointment | Saline | Drops | Other' },
        { name: 'stock_count', type: 'INT', key: 'DEFAULT 0', desc: 'Available stock quantity' },
        { name: 'min_threshold', type: 'INT', key: 'DEFAULT 20', desc: 'Low stock notification trigger count' },
        { name: 'unit_price', type: 'NUMERIC(10,2)', key: 'DEFAULT 10.00', desc: 'Selling unit rate in INR' },
        { name: 'location', type: 'VARCHAR(100)', key: '-', desc: 'Pharmacy shelf / cold storage bay location' }
      ]
    },
    {
      name: 'public.payment_receipts',
      description: 'Official OPD & IPD Payment Transactions & Audit Receipts',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Receipt ID' },
        { name: 'receipt_number', type: 'VARCHAR(50)', key: 'UNIQUE', desc: 'Official bill receipt number (e.g., SKMH-RCP-2026-809)' },
        { name: 'patient_id', type: 'UUID', key: 'FOREIGN KEY -> users(id)', desc: 'Billed patient user ID' },
        { name: 'payment_mode', type: 'VARCHAR(50)', key: 'CHECK', desc: 'Cash | UPI (QR Code) | Card | Net Banking' },
        { name: 'items', type: 'JSONB', key: 'JSONB Array', desc: 'Line items list with service description, category & amount' },
        { name: 'subtotal', type: 'NUMERIC(10,2)', key: 'NOT NULL', desc: 'Bill gross subtotal' },
        { name: 'total_paid', type: 'NUMERIC(10,2)', key: 'NOT NULL', desc: 'Final net collected amount' },
        { name: 'collected_by', type: 'VARCHAR(255)', key: '-', desc: 'Accountant or front desk officer' }
      ]
    },
    {
      name: 'public.accounting_entries',
      description: 'Hospital Financial Ledger for Income & Expense Tracking',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Ledger transaction ID' },
        { name: 'date', type: 'DATE', key: 'DEFAULT CURRENT_DATE', desc: 'Transaction booking date' },
        { name: 'type', type: 'VARCHAR(20)', key: 'CHECK', desc: 'Income | Expense' },
        { name: 'source_category', type: 'VARCHAR(100)', key: 'NOT NULL', desc: 'OPD Consultation | IPD Admission | Pharmacy | Surgery | Staff Salary, etc.' },
        { name: 'amount', type: 'NUMERIC(10,2)', key: 'NOT NULL', desc: 'Transaction value' },
        { name: 'department', type: 'VARCHAR(100)', key: 'NOT NULL', desc: 'Originating hospital department' }
      ]
    },
    {
      name: 'public.staff_designations',
      description: 'Hospital Administrative, Nursing, Paramedical & Technician Personnel Roles',
      columns: [
        { name: 'id', type: 'UUID', key: 'PRIMARY KEY', desc: 'Designation ID' },
        { name: 'title', type: 'VARCHAR(255)', key: 'NOT NULL', desc: 'Designation title (e.g., Senior ICU Charge Nurse)' },
        { name: 'category_id', type: 'UUID', key: 'FOREIGN KEY -> staff_categories(id)', desc: 'Link to staff category' },
        { name: 'department', type: 'VARCHAR(100)', key: 'NOT NULL', desc: 'Assigned hospital department' },
        { name: 'shift_timing', type: 'VARCHAR(100)', key: '-', desc: 'Morning / Evening / Night / OPD Duty Shift' },
        { name: 'contact_phone', type: 'VARCHAR(20)', key: '-', desc: 'Staff mobile number' },
        { name: 'email', type: 'VARCHAR(255)', key: '-', desc: 'Staff email address' }
      ]
    }
  ];

  const filteredTables = tableDefinitions.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.columns.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-5xl w-full max-h-[92vh] my-auto overflow-hidden shadow-2xl flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  Supabase Ready
                </span>
                <span className="text-xs text-slate-400 font-mono">PostgreSQL 15+</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">Supabase PostgreSQL Database Schema & DDL Details</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSql}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Download .sql DDL migration script"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Download .sql</span>
            </button>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied SQL!' : 'Copy Complete SQL Script'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
              title="Close Schema Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'tables' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Table Dictionary ({tableDefinitions.length})
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'sql' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Complete SQL Script
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'client' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Supabase Client Setup
            </button>
          </div>

          {activeTab === 'tables' && (
            <input
              type="text"
              placeholder="Search tables or columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
            />
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {filteredTables.map((tbl, idx) => (
                <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-mono font-bold text-sm text-emerald-300">{tbl.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {tbl.columns.length} Columns
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 italic">{tbl.description}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Column Name</th>
                          <th className="p-2">Data Type</th>
                          <th className="p-2">Key / Constraint</th>
                          <th className="p-2">Description / Domain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                        {tbl.columns.map((col, cIdx) => (
                          <tr key={cIdx} className="hover:bg-slate-900/40">
                            <td className="p-2 font-bold text-white">{col.name}</td>
                            <td className="p-2 text-indigo-300">{col.type}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                col.key.includes('PRIMARY') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                col.key.includes('FOREIGN') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {col.key}
                              </span>
                            </td>
                            <td className="p-2 text-slate-400 font-sans">{col.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Copy and run this SQL script directly in your <strong>Supabase SQL Editor</strong> dashboard:</span>
                <span className="font-mono text-emerald-400">PostgreSQL DDL • RLS Enabled</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-all">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'client' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-indigo-200 space-y-2">
                <h4 className="font-bold text-sm text-indigo-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> How to Connect Shree Krishna Hospital App to Supabase
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Your new Supabase credentials for project <code className="text-emerald-300 font-mono">zvvnpjlekfsfrxcdyexo</code> have been configured in the app!</li>
                  <li>Open your project SQL Editor: <a href="https://supabase.com/dashboard/project/zvvnpjlekfsfrxcdyexo/editor" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold underline">https://supabase.com/dashboard/project/zvvnpjlekfsfrxcdyexo/editor</a></li>
                  <li>Click <strong>New Query</strong>, paste the complete DDL script from the <strong>"Complete SQL Script"</strong> tab above, and click <strong>RUN</strong>.</li>
                  <li>All 19 tables will be created automatically, and newly registered patients & appointments will show up directly in your Supabase Table Editor!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">Sample React / TypeScript Supabase Client Helper (<code className="text-emerald-400 font-mono">src/lib/supabaseClient.ts</code>)</h4>
                <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Example Data Fetching Query for Doctors & OPD Queue
export async function fetchActiveDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data;
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Includes Row-Level Security (RLS) & Realtime Publication triggers for Notifications & Queue</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
