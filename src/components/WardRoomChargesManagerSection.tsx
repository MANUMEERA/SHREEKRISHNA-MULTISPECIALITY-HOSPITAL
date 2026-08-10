import React, { useState, useEffect, useRef } from 'react';
import { HospitalChargeCategory } from '../types';
import { api } from '../lib/api';
import { BedDouble, Search, Plus, Trash2, Edit, FileSpreadsheet, Upload, Download, Check, X, Building2, AlertCircle, RefreshCw, DollarSign, Stethoscope } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';

export const WardRoomChargesManagerSection: React.FC<{
  onChargesUpdated?: () => void;
}> = ({ onChargesUpdated }) => {
  const [charges, setCharges] = useState<HospitalChargeCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMasterTab, setActiveMasterTab] = useState<'all' | 'ward_rooms' | 'additional_amenities'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal State for Add / Edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<HospitalChargeCategory | null>(null);
  const [chargeForm, setChargeForm] = useState({
    service_name: '',
    category_name: 'Ward Stay',
    charge_amount: 2500,
    department: 'Inpatient (IPD)',
    doctor_name: '',
    description: ''
  });

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<HospitalChargeCategory>[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCharges();
  }, []);

  const loadCharges = async () => {
    try {
      const data = await api.getChargeCategories();
      setCharges(data || []);
      if (onChargesUpdated) onChargesUpdated();
    } catch (err) {
      console.error('Failed to load charge categories', err);
    }
  };

  const handleSaveCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCharge) {
        const updated = await api.updateChargeCategory({
          ...editingCharge,
          ...chargeForm
        });
        setCharges(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await api.addChargeCategory(chargeForm);
        setCharges(prev => [created, ...prev]);
      }
      setShowAddModal(false);
      setEditingCharge(null);
      resetForm();
      if (onChargesUpdated) onChargesUpdated();
    } catch (err) {
      console.error('Failed to save charge item', err);
    }
  };

  const handleDeleteCharge = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from hospital ward & room charges master?`)) return;
    try {
      await api.deleteChargeCategory(id);
      setCharges(prev => prev.filter(c => c.id !== id));
      if (onChargesUpdated) onChargesUpdated();
    } catch (err) {
      console.error('Failed to delete charge item', err);
    }
  };

  const openAddModal = () => {
    setEditingCharge(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: HospitalChargeCategory) => {
    setEditingCharge(item);
    setChargeForm({
      service_name: item.service_name,
      category_name: item.category_name || 'Ward Stay',
      charge_amount: item.charge_amount,
      department: item.department || 'Inpatient (IPD)',
      doctor_name: item.doctor_name || '',
      description: item.description || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setChargeForm({
      service_name: '',
      category_name: 'Ward Stay',
      charge_amount: 2500,
      department: 'Inpatient (IPD)',
      doctor_name: '',
      description: ''
    });
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    downloadSampleCSV(
      'SKMH_Room_Ward_Hospital_Charges_Master_Template.csv',
      ['Service or Ward Name', 'Category Name', 'Daily Charge Amount', 'Department', 'Description or Amenities'],
      [
        ['General Ward Bed Charge', 'Ward Stay', '1000', 'Inpatient (IPD)', 'Shared general ward with 24x7 nursing'],
        ['Semi-Private Room Charge', 'Ward Stay', '1800', 'Inpatient (IPD)', '2-Bed room with attached bathroom & AC'],
        ['Deluxe AC Ward Room Charge', 'Ward Stay', '2500', 'Inpatient (IPD)', 'Private AC room, LED TV, Attendant sofa couch'],
        ['Super Deluxe Suite Charge', 'Ward Stay', '4500', 'Inpatient (IPD)', 'Luxury suite, refrigerator, personal nurse call system'],
        ['ICU Critical Care Bed Charge', 'Ward Stay', '6000', 'Inpatient (IPD)', 'Intensive care unit with ventilator & continuous monitor']
      ]
    );
  };

  // CSV Import handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { rows } = parseCSV(text);

        if (rows.length === 0) {
          setCsvError('The uploaded CSV file appears to be empty.');
          return;
        }

        const items: Partial<HospitalChargeCategory>[] = [];
        for (const row of rows) {
          const service_name = row['service or ward name'] || row['service name'] || row['ward name'] || row['name'];
          if (!service_name) continue;

          items.push({
            service_name,
            category_name: row['category name'] || row['category'] || 'Ward Stay',
            charge_amount: parseFloat(row['daily charge amount'] || row['charge amount'] || row['rate'] || row['charge'] || '2000'),
            department: row['department'] || 'Inpatient (IPD)',
            description: row['description or amenities'] || row['description'] || 'Hospital tariff room rate'
          });
        }

        if (items.length === 0) {
          setCsvError('No valid charge records found. Please ensure column "Service or Ward Name" exists.');
          return;
        }

        setParsedPreview(items);
        setShowCsvModal(true);
      } catch (err: any) {
        setCsvError(`Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      for (const item of parsedPreview) {
        await api.addChargeCategory({
          service_name: item.service_name || 'Room Charge',
          category_name: item.category_name || 'Ward Stay',
          charge_amount: item.charge_amount || 2000,
          department: item.department || 'Inpatient (IPD)',
          description: item.description || ''
        });
      }
      await loadCharges();
      setShowCsvModal(false);
      setParsedPreview([]);
    } catch (err) {
      console.error('Failed to import charges from CSV', err);
      setCsvError('An error occurred while saving imported charge items.');
    } finally {
      setImporting(false);
    }
  };

  // Filter charges by category and search
  const categoriesList = ['All', 'Ward Stay', 'Amenities & Services', 'Nursing / Care', 'Consultation', 'Surgery', 'X-Ray', 'Other'];

  const filteredCharges = charges.filter(item => {
    const matchesSearch = 
      item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeMasterTab === 'ward_rooms') {
      return item.category_name === 'Ward Stay' || item.category_name === 'ICU Stay' || item.department.includes('IPD');
    }

    if (activeMasterTab === 'additional_amenities') {
      return item.category_name === 'Amenities & Services' || item.category_name === 'Nursing / Care' || item.category_name === 'Other';
    }

    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'Ward Stay') return item.category_name === 'Ward Stay' || item.category_name === 'ICU Stay' || item.department.includes('IPD');
    return item.category_name === categoryFilter;
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 space-y-6">
      
      {/* SECTION HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Room, Ward & Service Charges Master</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase tracking-wide">
                Live Tariff Master
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Configure and manage per-day Ward Room rates, ICU charges, OPD consultation fees, and OT surgical tariffs.
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Room / Ward Charge
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download Excel / CSV template for bulk importing room charges"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> CSV Template
          </button>

          <label className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> Bulk Import
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={loadCharges}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Refresh Room Rates List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MASTER CATEGORY SUB-TABS (ROOM RATES vs ADDITIONAL SERVICES & AMENITIES) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setActiveMasterTab('all'); setCategoryFilter('All'); }}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeMasterTab === 'all'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>All Hospital Tariff Master</span>
        </button>

        <button
          onClick={() => { setActiveMasterTab('ward_rooms'); setCategoryFilter('Ward Stay'); }}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeMasterTab === 'ward_rooms'
              ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BedDouble className="w-4 h-4 text-emerald-300" />
          <span>🛏️ Room & Ward Bed Tariffs</span>
        </button>

        <button
          onClick={() => { setActiveMasterTab('additional_amenities'); setCategoryFilter('Amenities & Services'); }}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeMasterTab === 'additional_amenities'
              ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-700/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-indigo-300" />
          <span>🩺 Additional Ward Services & Amenities</span>
        </button>
      </div>

      {/* SEARCH AND CATEGORY FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveMasterTab('all'); setCategoryFilter(cat); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                categoryFilter === cat && activeMasterTab === 'all'
                  ? 'bg-slate-900 text-emerald-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ward / Room / Service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* ROOM & WARD CHARGES TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5 border-r border-slate-800">Room / Service Name</th>
              <th className="p-3.5 border-r border-slate-800">Category</th>
              <th className="p-3.5 border-r border-slate-800">Department</th>
              <th className="p-3.5 border-r border-slate-800 text-right">Per Day / Fee (₹)</th>
              <th className="p-3.5 border-r border-slate-800">Amenities & Notes</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
            {filteredCharges.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                  No room/ward charges match your search criteria. Click "+ Add Room / Ward Charge" to create one.
                </td>
              </tr>
            ) : (
              filteredCharges.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-emerald-50/30'}>
                  <td className="p-3.5 border-r border-slate-100 font-extrabold text-slate-900">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item.service_name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 border-r border-slate-100">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      item.category_name === 'Ward Stay' || item.category_name === 'ICU Stay'
                        ? 'bg-blue-100 text-blue-900'
                        : item.category_name === 'Surgery'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {item.category_name || 'Ward Stay'}
                    </span>
                  </td>
                  <td className="p-3.5 border-r border-slate-100 font-medium text-slate-600">
                    {item.department || 'Inpatient (IPD)'}
                  </td>
                  <td className="p-3.5 border-r border-slate-100 text-right font-black text-emerald-700 text-sm">
                    ₹{item.charge_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 border-r border-slate-100 text-slate-500 max-w-xs truncate">
                    {item.description || '—'}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit Room/Ward Charge"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharge(item.id, item.service_name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Room/Ward Charge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT ROOM CHARGE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    {editingCharge ? 'Edit Room / Ward Charge' : 'Add New Room / Ward Charge'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set per-day daily bed fees and service rates for hospital IPD wards.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCharge} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service / Ward Room Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe AC Ward Room, Semi-Private Room, ICU Bed"
                  value={chargeForm.service_name}
                  onChange={(e) => setChargeForm({ ...chargeForm, service_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={chargeForm.category_name}
                    onChange={(e) => setChargeForm({ ...chargeForm, category_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Ward Stay">Ward Stay (Room Rate)</option>
                    <option value="Amenities & Services">Amenities & Additional Ward Services</option>
                    <option value="ICU Stay">ICU / Critical Care</option>
                    <option value="Nursing / Care">Nursing Care & Procedures</option>
                    <option value="Consultation">Doctor Consultation Fee</option>
                    <option value="Surgery">Surgery / OT Charge</option>
                    <option value="X-Ray">X-Ray & Radiology</option>
                    <option value="Other">Other Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Rate / Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={chargeForm.charge_amount}
                    onChange={(e) => setChargeForm({ ...chargeForm, charge_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Inpatient (IPD), Critical Care Unit, General Surgery"
                  value={chargeForm.department}
                  onChange={(e) => setChargeForm({ ...chargeForm, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room Amenities & Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Air Conditioned, LED TV, Attendant Sofa Couch, Attached Restroom, Nurse Call Bell System"
                  value={chargeForm.description}
                  onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" /> Save Room Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT PREVIEW MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Bulk CSV Import Preview ({parsedPreview.length} Records)</h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {csvError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold border-b border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {csvError}
              </div>
            )}

            <div className="p-4 overflow-y-auto space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Review room charges parsed from CSV before adding to hospital master tariff:
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 border-b">Room / Service Name</th>
                      <th className="p-2 border-b">Category</th>
                      <th className="p-2 border-b text-right">Daily Charge (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{item.service_name}</td>
                        <td className="p-2 text-slate-600">{item.category_name}</td>
                        <td className="p-2 text-right font-black text-emerald-700">₹{item.charge_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Confirm Bulk Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
