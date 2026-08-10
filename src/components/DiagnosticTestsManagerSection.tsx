import React, { useState, useEffect, useRef } from 'react';
import { DiagnosticTestItem } from '../types';
import { api } from '../lib/api';
import { Stethoscope, Search, Plus, Trash2, Edit, FileSpreadsheet, Upload, Download, Check, X, TestTube, AlertCircle, RefreshCw } from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';

export const DiagnosticTestsManagerSection: React.FC = () => {
  const [tests, setTests] = useState<DiagnosticTestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState<DiagnosticTestItem | null>(null);
  const [testForm, setTestForm] = useState({
    test_name: '',
    category: 'Pathology / Lab' as DiagnosticTestItem['category'],
    price: 350,
    turnaround_time: '2 Hours',
    description: '',
    is_active: true
  });

  // CSV Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<DiagnosticTestItem>[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const data = await api.getDiagnosticTests();
      setTests(data);
    } catch (err) {
      console.error('Failed to load diagnostic tests', err);
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        const updated = await api.updateDiagnosticTest({
          ...editingTest,
          ...testForm
        });
        setTests(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await api.addDiagnosticTest(testForm);
        setTests(prev => [created, ...prev]);
      }
      setShowAddModal(false);
      setEditingTest(null);
    } catch (err) {
      console.error('Failed to save diagnostic test', err);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diagnostic test from the master catalog?')) return;
    await api.deleteDiagnosticTest(id);
    setTests(prev => prev.filter(t => t.id !== id));
  };

  const openEditModal = (testItem: DiagnosticTestItem) => {
    setEditingTest(testItem);
    setTestForm({
      test_name: testItem.test_name,
      category: testItem.category,
      price: testItem.price,
      turnaround_time: testItem.turnaround_time,
      description: testItem.description || '',
      is_active: testItem.is_active
    });
    setShowAddModal(true);
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    downloadSampleCSV(
      'SKMH_Diagnostic_Tests_Master_Template.csv',
      ['Test Name', 'Category', 'Price', 'Turnaround Time', 'Description'],
      [
        ['Complete Blood Count (CBC) with ESR', 'Pathology / Lab', '350', '2 Hours', 'Includes Hb, TLC, DLC, Platelet Count'],
        ['Chest X-Ray PA View (Digital)', 'Radiology / X-Ray', '450', '30 Mins', 'Digital High Resolution Thoracic Radiography'],
        ['Abdomen & Pelvis Ultrasound (USG)', 'Ultrasound / Scan', '1200', '1 Hour', 'Whole Abdomen Diagnostic Sonography'],
        ['12-Lead Electrocardiogram (ECG)', 'Cardiology / ECG', '250', '15 Mins', '12 Lead Resting Cardiac ECG Scan'],
        ['Thyroid Profile (T3, T4, TSH)', 'Pathology / Lab', '650', '4 Hours', 'Total T3, Total T4 & Ultra TSH Assay']
      ]
    );
  };

  // Handle CSV File Select
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

        const items: Partial<DiagnosticTestItem>[] = [];
        for (const row of rows) {
          const test_name = row['test name'] || row['name'] || row['test'] || row['title'];
          if (!test_name) continue;

          const catRaw = row['category'] || 'Pathology / Lab';
          let category: DiagnosticTestItem['category'] = 'Pathology / Lab';
          if (/radiology|x-ray|xray/i.test(catRaw)) category = 'Radiology / X-Ray';
          else if (/ultrasound|usg|scan/i.test(catRaw)) category = 'Ultrasound / Scan';
          else if (/cardio|ecG/i.test(catRaw)) category = 'Cardiology / ECG';
          else if (/other/i.test(catRaw)) category = 'Other';

          items.push({
            test_name,
            category,
            price: parseFloat(row['price'] || row['rate'] || row['cost'] || '300'),
            turnaround_time: row['turnaround time'] || row['time'] || row['tat'] || '2 Hours',
            description: row['description'] || row['notes'] || 'Master diagnostic test item',
            is_active: true
          });
        }

        if (items.length === 0) {
          setCsvError('No valid test records found. Please ensure column "Test Name" exists.');
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
    if (parsedPreview.length === 0) return;
    setImporting(true);
    try {
      const addedList: DiagnosticTestItem[] = [];
      for (const item of parsedPreview) {
        const created = await api.addDiagnosticTest({
          test_name: item.test_name || 'Diagnostic Test',
          category: item.category || 'Pathology / Lab',
          price: item.price || 300,
          turnaround_time: item.turnaround_time || '2 Hours',
          description: item.description || '',
          is_active: true
        });
        addedList.push(created);
      }

      setTests(prev => [...addedList, ...prev]);
      setShowCsvModal(false);
      setParsedPreview([]);
    } catch (err) {
      console.error('CSV import error:', err);
      setCsvError('Error occurred saving imported diagnostic tests into database.');
    } finally {
      setImporting(false);
    }
  };

  const filteredTests = tests.filter(t => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return t.test_name.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & CSV Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
              Diagnostic & Lab Test Master
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {tests.length} Active Tests
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Pathology & Radiology Test Price Catalog
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            title="Download CSV Template for Bulk Diagnostic Test Import"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Sample Test CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            title="Upload CSV / Excel file containing Pathology & Radiology Test Master"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>Upload Test Master CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingTest(null);
              setTestForm({
                test_name: '',
                category: 'Pathology / Lab',
                price: 350,
                turnaround_time: '2 Hours',
                description: '',
                is_active: true
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Test</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search diagnostic test by name, category, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-600">Category Filter:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-800 focus:outline-none"
          >
            <option value="All">All Test Categories</option>
            <option value="Pathology / Lab">Pathology / Lab</option>
            <option value="Radiology / X-Ray">Radiology / X-Ray</option>
            <option value="Ultrasound / Scan">Ultrasound / Scan</option>
            <option value="Cardiology / ECG">Cardiology / ECG</option>
            <option value="Other">Other Diagnostic Tests</option>
          </select>
        </div>
      </div>

      {/* Diagnostic Tests Master Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Test Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Price (₹)</th>
              <th className="p-3.5">Turnaround Time</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredTests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                  No diagnostic tests found in master catalog matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredTests.map((testItem) => (
                <tr key={testItem.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{testItem.test_name}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                      {testItem.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-black text-emerald-700 text-sm">
                    ₹{testItem.price.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono font-bold">
                    {testItem.turnaround_time}
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">
                    {testItem.description || '—'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      testItem.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {testItem.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(testItem)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Test Item Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(testItem.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Test Item from Master Catalog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingTest ? 'Edit Master Diagnostic Test' : 'Add New Master Diagnostic Test'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  value={testForm.test_name}
                  onChange={(e) => setTestForm({ ...testForm, test_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="Pathology / Lab">Pathology / Lab</option>
                    <option value="Radiology / X-Ray">Radiology / X-Ray</option>
                    <option value="Ultrasound / Scan">Ultrasound / Scan</option>
                    <option value="Cardiology / ECG">Cardiology / ECG</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={testForm.price}
                    onChange={(e) => setTestForm({ ...testForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Turnaround Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 Hours / Same Day"
                  value={testForm.turnaround_time}
                  onChange={(e) => setTestForm({ ...testForm, turnaround_time: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description / Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional details, tube type, fasting instructions..."
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-900 text-white font-bold shadow-xs hover:bg-indigo-800">
                  Save Diagnostic Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Confirm Bulk Diagnostic Test Master Import ({parsedPreview.length} Records)
              </h3>
              <button onClick={() => setShowCsvModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {csvError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{csvError}</span>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 sticky top-0 font-bold">
                  <tr>
                    <th className="p-2">Test Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Price (₹)</th>
                    <th className="p-2">TAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedPreview.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold text-slate-900">{item.test_name}</td>
                      <td className="p-2 text-slate-600">{item.category}</td>
                      <td className="p-2 text-emerald-700 font-bold">₹{item.price}</td>
                      <td className="p-2 font-mono text-slate-500">{item.turnaround_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowCsvModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {importing && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Import {parsedPreview.length} Tests</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
