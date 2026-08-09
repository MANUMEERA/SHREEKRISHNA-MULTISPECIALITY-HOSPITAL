import React, { useState, useEffect, useRef } from 'react';
import { AccountingEntry } from '../types';
import { api } from '../lib/api';
import { DollarSign, Printer, Download, Plus, Filter, Calendar, TrendingUp, TrendingDown, FileSpreadsheet, Building2, Search, FileText, Check, X, Clock, Upload, AlertTriangle } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';

type DateFilterPreset = 'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const AccountingManagerSection: React.FC = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // CSV Import State for Ledger
  const [showLedgerCsvModal, setShowLedgerCsvModal] = useState(false);
  const [parsedLedgerPreview, setParsedLedgerPreview] = useState<Partial<AccountingEntry>[]>([]);
  const [ledgerCsvError, setLedgerCsvError] = useState<string | null>(null);
  const [importingLedger, setImportingLedger] = useState(false);
  const ledgerFileInputRef = useRef<HTMLInputElement>(null);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Printable Report Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Add entry modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    type: 'Income' as 'Income' | 'Expense',
    source_category: 'OPD Consultation' as any,
    department: 'Cardiology',
    doctor_name: 'Dr. Rajesh Krishna',
    amount: 500,
    payment_mode: 'UPI',
    description: 'OPD Consultation Fee'
  });

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      const data = await api.getAccountingEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.addAccountingEntry({
        date: new Date().toISOString().split('T')[0],
        type: newEntryForm.type,
        source_category: newEntryForm.source_category,
        department: newEntryForm.department,
        doctor_name: newEntryForm.doctor_name,
        amount: parseFloat(newEntryForm.amount as any) || 0,
        payment_mode: newEntryForm.payment_mode,
        description: newEntryForm.description
      });

      setEntries(prev => [created, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Ledger CSV Handlers
  const handleDownloadLedgerTemplate = () => {
    downloadSampleCSV(
      'SKMH_Accounting_Ledger_Import_Template.csv',
      ['Type', 'Source Category', 'Department', 'Doctor Name', 'Amount', 'Payment Mode', 'Description', 'Date'],
      [
        ['Income', 'OPD Consultation', 'Orthopedics', 'Dr. Rajesh Krishna', '800', 'UPI', 'OPD Consultation Fee Collection', '2026-08-08'],
        ['Income', 'Pharmacy Sales', 'Pharmacy & Drug Stores', 'Pharmacy Billing Desk', '2450', 'Cash', 'Counter Medicine Billing Receipt', '2026-08-08'],
        ['Expense', 'Pharmacy Stock Purchase', 'Pharmacy & Drug Stores', 'Supplier - Sun Pharma', '18500', 'Bank Transfer', 'Bulk Antibiotic Stock Procurement', '2026-08-07'],
        ['Expense', 'Biomedical Equipment Maintenance', 'ICU & Critical Care', 'Service Vendor - Siemens', '12000', 'UPI', 'Ventilator Quarterly Calibration Fee', '2026-08-06']
      ]
    );
  };

  const handleLedgerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLedgerCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { rows } = parseCSV(text);

        if (rows.length === 0) {
          setLedgerCsvError('The uploaded ledger CSV is empty.');
          return;
        }

        const items: Partial<AccountingEntry>[] = [];
        const todayStr = new Date().toISOString().split('T')[0];

        for (const row of rows) {
          const typeRaw = row['type'] || row['entry type'] || 'Income';
          const type: 'Income' | 'Expense' = /exp/i.test(typeRaw) ? 'Expense' : 'Income';
          const amount = parseFloat(row['amount'] || row['rs'] || row['value'] || '0');
          if (isNaN(amount) || amount <= 0) continue;

          items.push({
            type,
            source_category: (row['source category'] || row['category'] || 'Other Income') as any,
            department: row['department'] || row['dept'] || 'Hospital General',
            doctor_name: row['doctor name'] || row['doctor'] || row['party name'] || 'Hospital Staff',
            amount,
            payment_mode: row['payment mode'] || row['mode'] || 'UPI',
            description: row['description'] || row['desc'] || row['particulars'] || 'Imported ledger entry',
            date: row['date'] || todayStr
          });
        }

        if (items.length === 0) {
          setLedgerCsvError('No valid accounting entries found. Ensure "Amount" column contains valid numbers.');
          return;
        }

        setParsedLedgerPreview(items);
        setShowLedgerCsvModal(true);
      } catch (err: any) {
        setLedgerCsvError(`Error parsing ledger CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmLedgerImport = async () => {
    if (parsedLedgerPreview.length === 0) return;
    setImportingLedger(true);
    try {
      const addedList: AccountingEntry[] = [];
      for (const item of parsedLedgerPreview) {
        const created = await api.addAccountingEntry({
          type: item.type || 'Income',
          source_category: item.source_category || 'Other Income',
          department: item.department || 'Hospital General',
          doctor_name: item.doctor_name || 'Hospital Staff',
          amount: item.amount || 0,
          payment_mode: item.payment_mode || 'UPI',
          description: item.description || 'Imported Entry',
          date: item.date || new Date().toISOString().split('T')[0]
        });
        addedList.push(created);
      }

      setEntries(prev => [...addedList, ...prev]);
      setShowLedgerCsvModal(false);
      setParsedLedgerPreview([]);
    } catch (err) {
      console.error('Failed to import accounting ledger entries', err);
      setLedgerCsvError('Failed to save imported ledger items into database.');
    } finally {
      setImportingLedger(false);
    }
  };

  // Date filter evaluation helper
  const isWithinDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (datePreset === 'today') {
      return dateStr === todayStr;
    }

    if (datePreset === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return dateStr >= sevenDaysAgoStr && dateStr <= todayStr;
    }

    if (datePreset === 'monthly') {
      const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return dateStr >= startOfMonthStr && dateStr <= todayStr;
    }

    if (datePreset === 'yearly') {
      const startOfYearStr = `${now.getFullYear()}-01-01`;
      return dateStr >= startOfYearStr && dateStr <= todayStr;
    }

    if (datePreset === 'custom') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }

    return true; // 'all'
  };

  const filteredEntries = entries.filter(e => {
    if (!isWithinDateRange(e.date)) return false;
    if (filterType !== 'All' && e.type !== filterType) return false;
    if (filterCategory !== 'All' && e.source_category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.description.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term) ||
        (e.doctor_name && e.doctor_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const totalIncome = filteredEntries.filter(e => e.type === 'Income').reduce((acc, e) => acc + e.amount, 0);
  const totalExpense = filteredEntries.filter(e => e.type === 'Expense').reduce((acc, e) => acc + e.amount, 0);
  const netRevenue = totalIncome - totalExpense;

  // Export CSV / Excel
  const exportCSV = () => {
    const headers = ['Entry ID,Date,Type,Source Category,Department,Doctor Name,Amount (INR),Payment Mode,Description'];
    const rows = filteredEntries.map(e => 
      `"${e.id}","${e.date}","${e.type}","${e.source_category}","${e.department}","${e.doctor_name || ''}","${e.amount}","${e.payment_mode}","${e.description.replace(/"/g, '""')}"`
    );
    const summaryRows = [
      '',
      `"SUMMARY","Total Income: ₹${totalIncome}","Total Expenses: ₹${totalExpense}","Net Revenue: ₹${netRevenue}","Entries Count: ${filteredEntries.length}"`
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows, ...summaryRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKMH_Financial_Ledger_Report_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDatePresetLabel = () => {
    switch (datePreset) {
      case 'today': return 'Today\'s Revenue Report';
      case 'weekly': return 'Weekly Revenue Report (Last 7 Days)';
      case 'monthly': return 'Monthly Revenue Report (This Month)';
      case 'yearly': return 'Yearly Financial Report (This Year)';
      case 'custom': return `Custom Period (${startDate || 'Start'} to ${endDate || 'End'})`;
      default: return 'Complete Financial Ledger (All Time)';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      
      {/* Header & Main Export Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Financial Accounting & Audit Ledger
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {filteredEntries.length} Records
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Accounting, OPD & IPD Revenue Tracker
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={ledgerFileInputRef}
            accept=".csv,.txt"
            onChange={handleLedgerFileChange}
            className="hidden"
          />

          <button
            onClick={handleDownloadLedgerTemplate}
            className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Sample CSV Template for Accounting Ledger Import"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => ledgerFileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            title="Import Income & Expense Ledger Entries from CSV or Excel file"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            title="Export Report to Excel CSV format"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            title="Print or Save Official Financial PDF Report"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print / PDF Report</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* DATE RANGE SELECTION & FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        
        {/* Date Presets Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase text-slate-800 tracking-wide">Report Date Range:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setDatePreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDatePreset('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'today' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'weekly' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Weekly (7 Days)
            </button>
            <button
              onClick={() => setDatePreset('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'monthly' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Monthly (This Month)
            </button>
            <button
              onClick={() => setDatePreset('yearly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'yearly' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Yearly (2026)
            </button>
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                datePreset === 'custom' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Date Range
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs (Visible when Custom is selected) */}
        {datePreset === 'custom' && (
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <span className="font-extrabold text-indigo-950 uppercase text-[10px]">Select Start & End Date:</span>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Filters & Search Sub-row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, doctor, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-2.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Types (Income & Expense)</option>
              <option value="Income">Income Only (+)</option>
              <option value="Expense">Expense Only (-)</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-800 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="OPD Consultation">OPD Consultation</option>
              <option value="IPD Admission">IPD Admission</option>
              <option value="X-Ray & Radiology">X-Ray & Radiology</option>
              <option value="Diagnostic Lab">Diagnostic Lab</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Surgery / OT">Surgery / OT</option>
              <option value="Supplies Purchase">Supplies Purchase</option>
            </select>
          </div>
        </div>

      </div>

      {/* Dynamic Summary Cards for Active Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-md border border-emerald-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Filtered Total Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <strong className="text-2xl font-black block mt-2">₹{totalIncome.toLocaleString()}</strong>
          <span className="text-[10px] text-emerald-200 block mt-1">
            {getDatePresetLabel()}
          </span>
        </div>

        <div className="bg-rose-950 text-white p-5 rounded-3xl shadow-md border border-rose-900">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Filtered Total Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <strong className="text-2xl font-black block mt-2">₹{totalExpense.toLocaleString()}</strong>
          <span className="text-[10px] text-rose-200 block mt-1">
            Medical supplies & operational expenditure
          </span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Net Profit Margin</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <strong className="text-2xl font-black block mt-2 text-amber-300">₹{netRevenue.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-300 block mt-1">
            Audited Hospital Net Operating Margin
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Displaying Financial Ledger Entries</span>
          <span className="text-[11px] font-mono text-slate-500">
            {getDatePresetLabel()} • {filteredEntries.length} Records
          </span>
        </div>

        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Department / Doctor</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Payment Mode</th>
              <th className="p-3.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                  No accounting entries found matching the selected date range and filter criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-800">{e.date}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                      e.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{e.source_category}</td>
                  <td className="p-3.5 text-slate-700">
                    <strong>{e.department}</strong>
                    {e.doctor_name && <span className="block text-[10px] text-slate-500">{e.doctor_name}</span>}
                  </td>
                  <td className="p-3.5 text-slate-800">{e.description}</td>
                  <td className="p-3.5 font-semibold text-slate-600">{e.payment_mode}</td>
                  <td className={`p-3.5 text-right font-black text-sm ${e.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {e.type === 'Income' ? '+' : '-'}₹{e.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Add New Accounting Ledger Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Type *</label>
                  <select
                    value={newEntryForm.type}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="Income">Income (+)</option>
                    <option value="Expense">Expense (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newEntryForm.amount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Source Category *</label>
                <select
                  value={newEntryForm.source_category}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, source_category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="OPD Consultation">OPD Consultation</option>
                  <option value="IPD Admission">IPD Admission</option>
                  <option value="X-Ray & Radiology">X-Ray & Radiology</option>
                  <option value="Diagnostic Lab">Diagnostic Lab</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Surgery / OT">Surgery / OT</option>
                  <option value="Supplies Purchase">Supplies Purchase</option>
                  <option value="Staff Salary">Staff Salary</option>
                  <option value="Utilities / Other">Utilities / Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={newEntryForm.description}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-xs cursor-pointer hover:bg-emerald-500">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT / PDF AUDIT REPORT VIEW ================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 print:shadow-none print:m-0 print:w-full print:max-w-none print:p-4 border border-slate-200">
            
            {/* Screen Controls Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Official Hospital Financial & Revenue Audit Report Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Box */}
            <div className="border-2 border-slate-900 p-8 rounded-3xl space-y-6 bg-white text-slate-900">
              
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">SHREE KRISHNA MULTISPECIALTY HOSPITAL</h1>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Opp. Horizon tower, Kilvani Road, Mitu Apartment, Silvassa - 396230 (UT) • Financial Audit Division
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider">
                    FINANCIAL REPORT
                  </span>
                  <p className="text-[10px] font-mono font-bold text-slate-600 mt-1">
                    Generated: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Report Parameters Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 uppercase">Report Period:</span>
                  <strong className="text-emerald-700 font-black">{getDatePresetLabel()}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span>Applied Category Filter: <strong>{filterCategory}</strong></span>
                  <span>Type Filter: <strong>{filterType}</strong></span>
                </div>
              </div>

              {/* Financial Executive Summary Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-black uppercase text-emerald-800">Total Income</span>
                  <strong className="text-lg font-black text-emerald-900 block mt-0.5">₹{totalIncome.toLocaleString()}</strong>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-black uppercase text-rose-800">Total Expenses</span>
                  <strong className="text-lg font-black text-rose-900 block mt-0.5">₹{totalExpense.toLocaleString()}</strong>
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300">
                  <span className="text-[10px] font-black uppercase text-slate-800">Net Profit Margin</span>
                  <strong className="text-lg font-black text-slate-900 block mt-0.5">₹{netRevenue.toLocaleString()}</strong>
                </div>
              </div>

              {/* Audit Table */}
              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase border-b border-slate-300 pb-1 text-slate-900">
                  Itemized Financial Transactions ({filteredEntries.length} Items)
                </h4>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 font-bold text-slate-900">
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-1">Type</th>
                      <th className="py-2 px-1">Category</th>
                      <th className="py-2 px-1">Department / Doctor</th>
                      <th className="py-2 px-1">Description</th>
                      <th className="py-2 px-1">Mode</th>
                      <th className="py-2 px-1 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredEntries.map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 px-1 font-mono">{e.date}</td>
                        <td className="py-2 px-1 font-bold">{e.type}</td>
                        <td className="py-2 px-1">{e.source_category}</td>
                        <td className="py-2 px-1">{e.department} {e.doctor_name ? `(${e.doctor_name})` : ''}</td>
                        <td className="py-2 px-1">{e.description}</td>
                        <td className="py-2 px-1">{e.payment_mode}</td>
                        <td className={`py-2 px-1 text-right font-extrabold ${e.type === 'Income' ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {e.type === 'Income' ? '+' : '-'}₹{e.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Seal / Signature Footer */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 italic">This is a system-generated hospital financial audit statement.</p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b-2 border-slate-900 mb-1 inline-block"></div>
                  <p className="font-extrabold text-slate-900">Authorized Accountant / Auditor</p>
                  <p className="text-[10px] text-slate-600">Shree Krishna Multispecialty Hospital</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* LEDGER CSV IMPORT PREVIEW MODAL */}
      {showLedgerCsvModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Import Accounting Ledger Transactions via CSV / Excel</h3>
                  <p className="text-xs text-slate-400">Preview {parsedLedgerPreview.length} income & expense entries parsed from uploaded ledger sheet</p>
                </div>
              </div>
              <button onClick={() => setShowLedgerCsvModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {ledgerCsvError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{ledgerCsvError}</span>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Department / Doctor</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedLedgerPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.date}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                            item.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{item.source_category}</td>
                        <td className="p-2.5 text-slate-600">{item.department} ({item.doctor_name})</td>
                        <td className="p-2.5 text-slate-500">{item.description}</td>
                        <td className={`p-2.5 text-right font-extrabold font-mono ${
                          item.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.type === 'Income' ? '+' : '-'}₹{item.amount?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500">
                Ready to commit <strong className="text-slate-900">{parsedLedgerPreview.length}</strong> transactions into Financial Audit Ledger.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLedgerCsvModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLedgerImport}
                  disabled={importingLedger}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {importingLedger ? 'Importing Ledger...' : `Confirm Import (${parsedLedgerPreview.length} Entries)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

