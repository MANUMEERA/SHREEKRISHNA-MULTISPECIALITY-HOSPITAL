import React, { useState, useEffect, useRef } from 'react';
import { MedicineItem } from '../types';
import { api } from '../lib/api';
import { Pill, AlertTriangle, Clock, Plus, Trash2, Edit, Search, CheckCircle2, ShieldAlert, PackageCheck, Upload, Download, FileSpreadsheet, X, Check } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';

export const InventoryManagerSection: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicineItem | null>(null);
  const [medForm, setMedForm] = useState({
    name: '',
    category: 'Tablet' as 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Saline' | 'Drops' | 'Other',
    stock_count: 500,
    min_threshold: 100,
    unit: 'Nos',
    expiry_date: '2027-12-31',
    unit_price: 10,
    location: 'Pharmacy Shelf A-1'
  });

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [parsedMedPreview, setParsedMedPreview] = useState<Partial<MedicineItem>[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await api.getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMed) {
        const updated = await api.updateMedicine({
          ...editingMed,
          ...medForm
        });
        setMedicines(prev => prev.map(m => m.id === updated.id ? updated : m));
      } else {
        const created = await api.addMedicine(medForm);
        setMedicines(prev => [created, ...prev]);
      }
      setShowAddModal(false);
      setEditingMed(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medicine item?')) return;
    await api.deleteMedicine(id);
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const openEditModal = (med: MedicineItem) => {
    setEditingMed(med);
    setMedForm({
      name: med.name,
      category: med.category,
      stock_count: med.stock_count,
      min_threshold: med.min_threshold,
      unit: med.unit,
      expiry_date: med.expiry_date,
      unit_price: med.unit_price,
      location: med.location || 'Pharmacy'
    });
    setShowAddModal(true);
  };

  // CSV Import handlers
  const handleDownloadTemplate = () => {
    downloadSampleCSV(
      'SKMH_Medicine_Stock_Import_Template.csv',
      ['Medicine Name', 'Category', 'Stock Count', 'Min Threshold', 'Unit', 'Expiry Date', 'Unit Price', 'Location'],
      [
        ['Paracetamol 650mg Tab', 'Tablet', '1200', '200', 'Strips', '2028-06-30', '15', 'Shelf A-12'],
        ['Amoxicillin 500mg Cap', 'Capsule', '800', '150', 'Strips', '2027-11-15', '42', 'Shelf B-04'],
        ['Cefoperazone Injection 1g', 'Injection', '250', '50', 'Vials', '2027-09-20', '180', 'Cold Storage Bay 1'],
        ['Pantoprazole IV 40mg', 'Injection', '400', '80', 'Vials', '2028-01-10', '65', 'Shelf C-02'],
        ['Normal Saline 0.9% 500ml', 'Saline', '300', '100', 'Bottles', '2027-12-31', '48', 'Bulk Storage Rack 4']
      ]
    );
  };

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
          setCsvError('The selected CSV file appears to be empty or invalid.');
          return;
        }

        const items: Partial<MedicineItem>[] = [];
        for (const row of rows) {
          const name = row['medicine name'] || row['name'] || row['item name'] || row['drug name'];
          if (!name) continue;

          const categoryRaw = row['category'] || 'Tablet';
          let category: MedicineItem['category'] = 'Tablet';
          if (/capsule/i.test(categoryRaw)) category = 'Capsule';
          else if (/syrup/i.test(categoryRaw)) category = 'Syrup';
          else if (/inject/i.test(categoryRaw)) category = 'Injection';
          else if (/saline/i.test(categoryRaw)) category = 'Saline';
          else if (/drop/i.test(categoryRaw)) category = 'Drops';
          else if (/ointment/i.test(categoryRaw)) category = 'Ointment';
          else if (/other/i.test(categoryRaw)) category = 'Other';

          items.push({
            name,
            category,
            stock_count: parseInt(row['stock count'] || row['stock'] || row['qty'] || '100', 10),
            min_threshold: parseInt(row['min threshold'] || row['threshold'] || row['min_stock'] || '20', 10),
            unit: row['unit'] || 'Nos',
            expiry_date: row['expiry date'] || row['expiry'] || row['exp'] || '2028-12-31',
            unit_price: parseFloat(row['unit price'] || row['price'] || row['rate'] || '10'),
            location: row['location'] || row['rack location'] || row['shelf'] || 'Pharmacy Main Bay'
          });
        }

        if (items.length === 0) {
          setCsvError('No valid medicine records found. Please ensure column "Medicine Name" exists.');
          return;
        }

        setParsedMedPreview(items);
        setShowCsvModal(true);
      } catch (err: any) {
        setCsvError(`Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (e.target) e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (parsedMedPreview.length === 0) return;
    setImporting(true);
    try {
      const addedList: MedicineItem[] = [];
      for (const item of parsedMedPreview) {
        const newMed = await api.addMedicine({
          name: item.name || 'Imported Medicine',
          category: item.category || 'Tablet',
          stock_count: item.stock_count || 100,
          min_threshold: item.min_threshold || 20,
          unit: item.unit || 'Nos',
          expiry_date: item.expiry_date || '2028-12-31',
          unit_price: item.unit_price || 10,
          location: item.location || 'Pharmacy'
        });
        addedList.push(newMed);
      }

      setMedicines(prev => [...addedList, ...prev]);
      setShowCsvModal(false);
      setParsedMedPreview([]);
    } catch (err) {
      console.error(err);
      setCsvError('An error occurred while saving imported medicine stock into database.');
    } finally {
      setImporting(false);
    }
  };

  const lowStockCount = medicines.filter(m => m.stock_count <= m.min_threshold).length;

  const filteredMedicines = medicines.filter(m => {
    if (filterCategory !== 'All' && m.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return m.name.toLowerCase().includes(term) || (m.location && m.location.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Pharmacy & Medical Supplies Inventory
            </span>
            {lowStockCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase flex items-center gap-1 border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> {lowStockCount} Low Stock Alert
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Medicine Stock Master & Expiration Monitor
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Sample CSV Template for Medicine Stock Import"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Import Medicines from Excel or CSV file"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingMed(null);
              setMedForm({
                name: '',
                category: 'Tablet',
                stock_count: 500,
                min_threshold: 100,
                unit: 'Nos',
                expiry_date: '2027-12-31',
                unit_price: 10,
                location: 'Pharmacy Shelf A-1'
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Stock Item
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-between text-rose-900 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>CRITICAL INVENTORY ALERT: {lowStockCount} pharmaceutical stock items have fallen below their minimum threshold!</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine by name or rack location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 font-semibold"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-800"
        >
          <option value="All">All Categories</option>
          <option value="Tablet">Tablets</option>
          <option value="Capsule">Capsules</option>
          <option value="Syrup">Syrups</option>
          <option value="Injection">Injections</option>
          <option value="Saline">Saline Bottles</option>
          <option value="Drops">Eye / Ear Drops</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Medicine Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Current Stock</th>
              <th className="p-3.5">Rack Location</th>
              <th className="p-3.5">Expiry Date</th>
              <th className="p-3.5">Unit Price (₹)</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredMedicines.map((m) => {
              const isLowStock = m.stock_count <= m.min_threshold;
              return (
                <tr key={m.id} className={`hover:bg-slate-50 ${isLowStock ? 'bg-rose-50/40' : ''}`}>
                  <td className="p-3.5">
                    <strong className="text-slate-900 text-xs block font-black">{m.name}</strong>
                    {isLowStock && (
                      <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> Re-order Required (Min: {m.min_threshold})
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">{m.category}</td>
                  <td className="p-3.5 font-black text-sm">
                    <span className={isLowStock ? 'text-rose-600' : 'text-emerald-700'}>
                      {m.stock_count} {m.unit}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">{m.location || 'Pharmacy'}</td>
                  <td className="p-3.5 font-mono text-slate-800">{m.expiry_date}</td>
                  <td className="p-3.5 font-bold text-slate-900">₹{m.unit_price}</td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-sm">
              {editingMed ? 'Edit Medicine Stock Record' : 'Add New Medicine Stock Item'}
            </h3>

            <form onSubmit={handleSaveMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Medicine Name & Strength *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tab. Paracetamol 500mg"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Saline">Saline</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={medForm.stock_count}
                    onChange={(e) => setMedForm({ ...medForm, stock_count: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Low Alert Threshold</label>
                  <input
                    type="number"
                    value={medForm.min_threshold}
                    onChange={(e) => setMedForm({ ...medForm, min_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={medForm.unit_price}
                    onChange={(e) => setMedForm({ ...medForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={medForm.expiry_date}
                    onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Shelf / Rack Location</label>
                  <input
                    type="text"
                    placeholder="Shelf B-3"
                    value={medForm.location}
                    onChange={(e) => setMedForm({ ...medForm, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow">
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT PREVIEW MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Import Medicine Stock via CSV / Excel</h3>
                  <p className="text-xs text-slate-400">Review {parsedMedPreview.length} items parsed from uploaded file before committing to stock database</p>
                </div>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {csvError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Expiry</th>
                      <th className="p-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedMedPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">{item.stock_count} {item.unit}</td>
                        <td className="p-2.5 font-mono">₹{item.unit_price}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.expiry_date}</td>
                        <td className="p-2.5 text-slate-500">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500">
                Ready to insert <strong className="text-slate-900">{parsedMedPreview.length}</strong> items into Pharmacy Master Stock.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {importing ? 'Importing...' : `Confirm Import (${parsedMedPreview.length} Items)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
