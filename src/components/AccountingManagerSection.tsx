import React, { useState, useEffect } from 'react';
import { AccountingEntry } from '../types';
import { api } from '../lib/api';
import { DollarSign, Printer, Download, Plus, Filter, Calendar, TrendingUp, TrendingDown, FileSpreadsheet, Building2, Search } from 'lucide-react';

export const AccountingManagerSection: React.FC = () => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEntries = entries.filter(e => {
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

  const totalIncome = entries.filter(e => e.type === 'Income').reduce((acc, e) => acc + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'Expense').reduce((acc, e) => acc + e.amount, 0);
  const netRevenue = totalIncome - totalExpense;

  const exportCSV = () => {
    const headers = ['ID,Date,Type,Source Category,Department,Doctor,Amount,Payment Mode,Description'];
    const rows = filteredEntries.map(e => 
      `"${e.id}","${e.date}","${e.type}","${e.source_category}","${e.department}","${e.doctor_name || ''}","${e.amount}","${e.payment_mode}","${e.description}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKMH_Hospital_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Financial Accounting & Revenue Ledger
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Accounting, OPD & IPD Revenue Tracker
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Ledger Entry
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-lg border border-emerald-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-emerald-300">Total Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <strong className="text-2xl font-black block mt-2">₹{totalIncome.toLocaleString()}</strong>
          <span className="text-[10px] text-emerald-200">OPD fees, IPD stays, OT & Diagnostics</span>
        </div>

        <div className="bg-rose-950 text-white p-5 rounded-3xl shadow-lg border border-rose-900">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-rose-300">Total Expenses</span>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <strong className="text-2xl font-black block mt-2">₹{totalExpense.toLocaleString()}</strong>
          <span className="text-[10px] text-rose-200">Medical supplies & staff operational costs</span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-amber-300">Net Profit Margin</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <strong className="text-2xl font-black block mt-2 text-amber-300">₹{netRevenue.toLocaleString()}</strong>
          <span className="text-[10px] text-slate-300">Audited Hospital Net Revenue</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by description, doctor, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="p-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-800"
          >
            <option value="All">All Types (Income & Expense)</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-800"
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

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
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
            {filteredEntries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono font-bold text-slate-800">{e.date}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-sm">Add New Accounting Ledger Entry</h3>
            
            <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={newEntryForm.type}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="Income">Income (+)</option>
                    <option value="Expense">Expense (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={newEntryForm.amount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Source Category</label>
                <select
                  value={newEntryForm.source_category}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, source_category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newEntryForm.description}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
