import React, { useState, useEffect, useRef } from 'react';
import { AccountingEntry, Doctor } from '../types';
import { api } from '../lib/api';
import { DollarSign, Printer, Download, Plus, Filter, Calendar, TrendingUp, TrendingDown, FileSpreadsheet, Building2, Search, FileText, Check, X, Clock, Upload, AlertTriangle, Stethoscope, PieChart as PieChartIcon, BarChart3, UserCheck, Activity } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

type DateFilterPreset = 'all' | 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const COLORS = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#ca8a04'];

export const AccountingManagerSection: React.FC = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ledger' | 'doctor_analytics' | 'charts'>('ledger');

  // CSV Import State for Ledger
  const [showLedgerCsvModal, setShowLedgerCsvModal] = useState(false);
  const [parsedLedgerPreview, setParsedLedgerPreview] = useState<Partial<AccountingEntry>[]>([]);
  const [ledgerCsvError, setLedgerCsvError] = useState<string | null>(null);
  const [importingLedger, setImportingLedger] = useState(false);
  const ledgerFileInputRef = useRef<HTMLInputElement>(null);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('monthly');
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
      const [accData, docData] = await Promise.all([
        api.getAccountingEntries(),
        api.getDoctors()
      ]);
      setEntries(accData);
      setDoctorsList(docData);
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

  // ================= DOCTOR INCOME MATRIX CALCULATION =================
  const doctorIncomeBreakdown = doctorsList.map(doc => {
    const docEntries = filteredEntries.filter(e => e.doctor_name && e.doctor_name.toLowerCase().includes(doc.name.toLowerCase()));
    
    const opdIncome = docEntries
      .filter(e => e.type === 'Income' && (e.source_category === 'OPD Consultation' || /opd/i.test(e.description)))
      .reduce((sum, e) => sum + e.amount, 0);

    const ipdIncome = docEntries
      .filter(e => e.type === 'Income' && (e.source_category === 'IPD Admission' || /ipd|admit|ward/i.test(e.description)))
      .reduce((sum, e) => sum + e.amount, 0);

    const otIncome = docEntries
      .filter(e => e.type === 'Income' && (e.source_category === 'Surgery / OT' || /surgery|ot|operation/i.test(e.description)))
      .reduce((sum, e) => sum + e.amount, 0);

    const otherIncome = docEntries
      .filter(e => e.type === 'Income' && !['OPD Consultation', 'IPD Admission', 'Surgery / OT'].includes(e.source_category) && !/opd|ipd|surgery/i.test(e.description))
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDocIncome = opdIncome + ipdIncome + otIncome + otherIncome;

    return {
      doctor_id: doc.id,
      doctor_name: doc.name,
      department: doc.department,
      opd_income: opdIncome,
      ipd_income: ipdIncome,
      ot_income: otIncome,
      other_income: otherIncome,
      total_income: totalDocIncome
    };
  }).sort((a, b) => b.total_income - a.total_income);

  // Chart Data Calculations
  const departmentRevenueMap: Record<string, number> = {};
  filteredEntries.filter(e => e.type === 'Income').forEach(e => {
    departmentRevenueMap[e.department] = (departmentRevenueMap[e.department] || 0) + e.amount;
  });
  const departmentChartData = Object.entries(departmentRevenueMap).map(([dept, total]) => ({
    department: dept,
    Revenue: total
  }));

  const categoryRevenueMap: Record<string, number> = {};
  filteredEntries.filter(e => e.type === 'Income').forEach(e => {
    categoryRevenueMap[e.source_category] = (categoryRevenueMap[e.source_category] || 0) + e.amount;
  });
  const categoryPieData = Object.entries(categoryRevenueMap).map(([cat, total]) => ({
    name: cat,
    value: total
  }));

  // Daily Trend Data
  const dateTrendMap: Record<string, { Income: number; Expense: number }> = {};
  filteredEntries.forEach(e => {
    if (!dateTrendMap[e.date]) dateTrendMap[e.date] = { Income: 0, Expense: 0 };
    if (e.type === 'Income') dateTrendMap[e.date].Income += e.amount;
    else dateTrendMap[e.date].Expense += e.amount;
  });
  const trendChartData = Object.keys(dateTrendMap).sort().map(date => ({
    date,
    Income: dateTrendMap[date].Income,
    Expense: dateTrendMap[date].Expense
  }));

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

  const exportDoctorIncomeCSV = () => {
    const headers = ['Doctor Name,Department,OPD Income (₹),IPD / Admitted Income (₹),OT / Surgery Income (₹),Other Income (₹),Total Doctor Revenue (₹)'];
    const rows = doctorIncomeBreakdown.map(d => 
      `"${d.doctor_name}","${d.department}","${d.opd_income}","${d.ipd_income}","${d.ot_income}","${d.other_income}","${d.total_income}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKMH_Doctor_Income_Breakdown_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`);
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
          {/* View Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mr-2">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Financial Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab('doctor_analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'doctor_analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              <span>Doctor Income</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'charts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Charts & Visuals</span>
            </button>
          </div>

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
            <span className="hidden sm:inline">Sample CSV</span>
          </button>

          <button
            onClick={() => ledgerFileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            title="Import Income & Expense Ledger Entries from CSV or Excel file"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline">Import CSV</span>
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
            <span>Print Report</span>
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

        {/* Custom Date Range Inputs */}
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

      {/* Dynamic Summary Cards */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Net Operating Profit</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <strong className="text-2xl font-black block mt-2 text-amber-300">₹{netRevenue.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-300 block mt-1">
            Audited Hospital Net Operating Margin
          </span>
        </div>
      </div>

      {/* ================= TAB 1: FINANCIAL LEDGER TABLE ================= */}
      {activeTab === 'ledger' && (
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
      )}

      {/* ================= TAB 2: INDIVIDUAL DOCTOR INCOME BREAKDOWN ================= */}
      {activeTab === 'doctor_analytics' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Individual Doctor Income Breakdown (OPD / IPD Admitted / OT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated dynamically for selected date range: <span className="font-bold text-indigo-700">{getDatePresetLabel()}</span>
              </p>
            </div>

            <button
              onClick={exportDoctorIncomeCSV}
              className="px-4 py-2 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export Doctor Income CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Doctor Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-right">OPD Consultation (₹)</th>
                  <th className="p-3.5 text-right">IPD / Admitted (₹)</th>
                  <th className="p-3.5 text-right">OT / Surgery (₹)</th>
                  <th className="p-3.5 text-right">Other Income (₹)</th>
                  <th className="p-3.5 text-right bg-slate-200/60 font-black">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {doctorIncomeBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No doctor revenue records available for the selected period.
                    </td>
                  </tr>
                ) : (
                  doctorIncomeBreakdown.map((doc) => (
                    <tr key={doc.doctor_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900">{doc.doctor_name}</td>
                      <td className="p-3.5 text-slate-600">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">
                          {doc.department}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        ₹{doc.opd_income.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                        ₹{doc.ipd_income.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-purple-700">
                        ₹{doc.ot_income.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ₹{doc.other_income.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 bg-slate-50 text-sm">
                        ₹{doc.total_income.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RECHARTS DATA VISUALIZATIONS ================= */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue by Department Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Revenue Distribution by Medical Department (₹)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Bar dataKey="Revenue" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Categories Pie Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              Revenue Share by Source Category (OPD / IPD / Lab / Pharmacy)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend Area Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Income vs. Expense Operational Cashflow Trend (₹)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  <Legend />
                  <Area type="monotone" dataKey="Income" stroke="#059669" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Expense" stroke="#dc2626" fill="#f43f5e" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

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
                <label className="block font-bold text-slate-700 uppercase mb-1">Doctor Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Krishna"
                  value={newEntryForm.doctor_name}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, doctor_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
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
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">SHREE KRISHNA MULTISPECIALITY HOSPITAL</h1>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Opp. Horizon tower, Kilvani Road, Mitu Apartment, Silvassa - 396230 (UT) • Financial Audit Division
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-wider">
                    FINANCIAL REPORT
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500">Gross Income</span>
                  <strong className="text-lg font-black text-emerald-700 block">₹{totalIncome.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500">Total Expenses</span>
                  <strong className="text-lg font-black text-rose-700 block">₹{totalExpense.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500">Net Operating Margin</span>
                  <strong className="text-lg font-black text-slate-900 block">₹{netRevenue.toLocaleString()}</strong>
                </div>
              </div>

              {/* Ledger Summary Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900 font-extrabold uppercase">
                    <th className="py-2">Date</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Department / Doctor</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEntries.slice(0, 25).map((e) => (
                    <tr key={e.id}>
                      <td className="py-1.5 font-mono">{e.date}</td>
                      <td className="py-1.5 font-bold">{e.source_category}</td>
                      <td className="py-1.5">{e.department} {e.doctor_name ? `(${e.doctor_name})` : ''}</td>
                      <td className={`py-1.5 text-right font-bold ${e.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {e.type === 'Income' ? '+' : '-'}₹{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Doctor Income Section in Print */}
              <div className="pt-4 border-t-2 border-slate-900 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900">Doctor-wise Revenue Breakdown Summary</h4>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-700">
                      <th className="py-1">Doctor Name</th>
                      <th className="py-1">Department</th>
                      <th className="py-1 text-right">OPD (₹)</th>
                      <th className="py-1 text-right">IPD (₹)</th>
                      <th className="py-1 text-right">OT (₹)</th>
                      <th className="py-1 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorIncomeBreakdown.slice(0, 10).map((doc) => (
                      <tr key={doc.doctor_id} className="border-b border-slate-100">
                        <td className="py-1 font-bold">{doc.doctor_name}</td>
                        <td className="py-1 text-slate-600">{doc.department}</td>
                        <td className="py-1 text-right font-mono">₹{doc.opd_income}</td>
                        <td className="py-1 text-right font-mono">₹{doc.ipd_income}</td>
                        <td className="py-1 text-right font-mono">₹{doc.ot_income}</td>
                        <td className="py-1 text-right font-mono font-bold">₹{doc.total_income}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
