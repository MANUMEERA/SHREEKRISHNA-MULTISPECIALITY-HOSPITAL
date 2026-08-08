import React, { useState, useEffect } from 'react';
import { StaffCategory, StaffDesignation } from '../types';
import { api } from '../lib/api';
import { 
  Users, UserCheck, Plus, Edit, Trash2, Search, Image as ImageIcon, 
  Building2, Briefcase, Phone, Mail, Clock, Award, ShieldCheck, 
  Check, X, AlertTriangle, RefreshCw, Sparkles, Filter, ChevronRight,
  Lock, KeyRound, Eye, EyeOff, Save, ShieldAlert
} from 'lucide-react';

const PRESET_STAFF_PHOTOS = [
  { label: 'Reception / Admin 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
  { label: 'Reception / Admin 2', url: 'https://images.unsplash.com/photo-1580894732468-058501424310?auto=format&fit=crop&q=80&w=400' },
  { label: 'Nurse / Care 1', url: 'https://images.unsplash.com/photo-1594824813572-132d73f1d8f7?auto=format&fit=crop&q=80&w=400' },
  { label: 'Nurse / Care 2', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400' },
  { label: 'Lab Tech / Pathology 1', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400' },
  { label: 'Pharmacist 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400' },
  { label: 'IT / Systems Specialist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
  { label: 'Hospital Executive', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' }
];

export const StaffManagementSection: React.FC = () => {
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [designations, setDesignations] = useState<StaffDesignation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');

  // Modal State - Category Add/Edit
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StaffCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Modal State - Designation Add/Edit with Photograph
  const [designationModalOpen, setDesignationModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<StaffDesignation | null>(null);
  
  // Designation Form Fields
  const [desigTitle, setDesigTitle] = useState('');
  const [desigCategoryId, setDesigCategoryId] = useState('');
  const [desigDepartment, setDesigDepartment] = useState('');
  const [desigPhotoUrl, setDesigPhotoUrl] = useState('');
  const [desigQualification, setDesigQualification] = useState('');
  const [desigResponsibilities, setDesigResponsibilities] = useState('');
  const [desigPayGrade, setDesigPayGrade] = useState('Grade R-1');
  const [desigShiftTiming, setDesigShiftTiming] = useState('Morning Shift (08:00 AM - 04:00 PM)');
  const [desigIsActive, setDesigIsActive] = useState(true);
  const [desigPhone, setDesigPhone] = useState('');
  const [desigEmail, setDesigEmail] = useState('');

  // Delete Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'category' | 'designation'; id: string; name: string } | null>(null);

  // Receptionist Credentials Manager State (Set by Super Administrator)
  const [recEmail, setRecEmail] = useState('reception.opd@skmh.org');
  const [recPassword, setRecPassword] = useState('Reception@2026');
  const [recFullName, setRecFullName] = useState('Pooja Mehta (Reception Desk)');
  const [recPhone, setRecPhone] = useState('+91 98765 11001');
  const [showRecPass, setShowRecPass] = useState(false);
  const [recSuccessMsg, setRecSuccessMsg] = useState('');
  const [savingRec, setSavingRec] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, desigs, recUser] = await Promise.all([
        api.getStaffCategories(),
        api.getStaffDesignations(),
        api.getReceptionistUser()
      ]);
      setCategories(cats);
      setDesignations(desigs);
      if (cats.length > 0 && !desigCategoryId) {
        setDesigCategoryId(cats[0].id);
      }
      if (recUser) {
        setRecEmail(recUser.email);
        if (recUser.password) setRecPassword(recUser.password);
        if (recUser.full_name) setRecFullName(recUser.full_name);
        if (recUser.phone) setRecPhone(recUser.phone);
      }
    } catch (err) {
      console.error('Failed to load staff management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReceptionistCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRec(true);
    try {
      await api.updateReceptionistCredentials(recEmail, recPassword, recFullName, recPhone);
      setRecSuccessMsg('Receptionist Login & Password updated! Receptionist can now log in to access ONLY the OPD Appointment Booking option.');
      setTimeout(() => setRecSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Failed to update receptionist credentials', err);
    } finally {
      setSavingRec(false);
    }
  };

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatCode('');
    setCatDesc('');
    setCategoryModalOpen(true);
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: StaffCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDesc(cat.description);
    setCategoryModalOpen(true);
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        const updated = await api.updateStaffCategory({
          ...editingCategory,
          name: catName,
          code: catCode || catName.substring(0, 3).toUpperCase(),
          description: catDesc
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const newCat = await api.addStaffCategory({
          name: catName,
          code: catCode || catName.substring(0, 3).toUpperCase(),
          description: catDesc,
          total_members: 0
        });
        setCategories(prev => [newCat, ...prev]);
      }
      setCategoryModalOpen(false);
    } catch (err) {
      console.error('Failed to save staff category', err);
    }
  };

  // Open Add Designation Modal
  const handleOpenAddDesignation = () => {
    setEditingDesignation(null);
    setDesigTitle('');
    setDesigCategoryId(categories.length > 0 ? categories[0].id : '');
    setDesigDepartment('Hospital Front Desk & OPD Entry');
    setDesigPhotoUrl(PRESET_STAFF_PHOTOS[0].url);
    setDesigQualification('B.A. / B.Sc Healthcare Administration');
    setDesigResponsibilities('Managing patient registrations, doctor assignment, desk counter billing, and hospital inquiries.');
    setDesigPayGrade('Grade R-1');
    setDesigShiftTiming('Morning Shift (08:00 AM - 04:00 PM)');
    setDesigIsActive(true);
    setDesigPhone('+91 98765 12345');
    setDesigEmail('staff.desk@skmh.org');
    setDesignationModalOpen(true);
  };

  // Open Edit Designation Modal
  const handleOpenEditDesignation = (desig: StaffDesignation) => {
    setEditingDesignation(desig);
    setDesigTitle(desig.title);
    setDesigCategoryId(desig.category_id);
    setDesigDepartment(desig.department);
    setDesigPhotoUrl(desig.photo_url || PRESET_STAFF_PHOTOS[0].url);
    setDesigQualification(desig.qualification);
    setDesigResponsibilities(desig.responsibilities);
    setDesigPayGrade(desig.pay_grade || 'Grade R-1');
    setDesigShiftTiming(desig.shift_timing || 'Morning Shift (08:00 AM - 04:00 PM)');
    setDesigIsActive(desig.is_active);
    setDesigPhone(desig.contact_phone || '');
    setDesigEmail(desig.email || '');
    setDesignationModalOpen(true);
  };

  // Save Designation (Create or Update with Photograph)
  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigTitle.trim()) return;

    const selectedCategoryObj = categories.find(c => c.id === desigCategoryId);
    const categoryName = selectedCategoryObj ? selectedCategoryObj.name : 'General Staff';

    try {
      if (editingDesignation) {
        const updated = await api.updateStaffDesignation({
          ...editingDesignation,
          title: desigTitle,
          category_id: desigCategoryId,
          category_name: categoryName,
          department: desigDepartment,
          photo_url: desigPhotoUrl,
          qualification: desigQualification,
          responsibilities: desigResponsibilities,
          pay_grade: desigPayGrade,
          shift_timing: desigShiftTiming,
          is_active: desigIsActive,
          contact_phone: desigPhone,
          email: desigEmail
        });
        setDesignations(prev => prev.map(d => d.id === updated.id ? updated : d));
      } else {
        const newDesig = await api.addStaffDesignation({
          title: desigTitle,
          category_id: desigCategoryId,
          category_name: categoryName,
          department: desigDepartment,
          photo_url: desigPhotoUrl,
          qualification: desigQualification,
          responsibilities: desigResponsibilities,
          pay_grade: desigPayGrade,
          shift_timing: desigShiftTiming,
          is_active: desigIsActive,
          contact_phone: desigPhone,
          email: desigEmail
        });
        setDesignations(prev => [newDesig, ...prev]);
      }
      setDesignationModalOpen(false);
    } catch (err) {
      console.error('Failed to save staff designation', err);
    }
  };

  // Delete Item Confirmation Execution
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.type === 'category') {
        await api.deleteStaffCategory(deleteConfirmTarget.id);
        setCategories(prev => prev.filter(c => c.id !== deleteConfirmTarget.id));
      } else {
        await api.deleteStaffDesignation(deleteConfirmTarget.id);
        setDesignations(prev => prev.filter(d => d.id !== deleteConfirmTarget.id));
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // Filtered Designations
  const filteredDesignations = designations.filter(d => {
    const matchesCategory = selectedCatFilter === 'all' || d.category_id === selectedCatFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      d.title.toLowerCase().includes(q) ||
      d.category_name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.qualification.toLowerCase().includes(q) ||
      (d.email && d.email.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      
      {/* SECTION HEADER BANNER */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Staff Directory & Roles Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-2">Hospital Staff Categories & Designations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create, modify, and delete hospital staff categories, designations, and official staff profile photographs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAddCategory}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-extrabold text-xs shadow flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>➕ Add Staff Category</span>
          </button>

          <button
            onClick={handleOpenAddDesignation}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>➕ Create Designation (With Photo)</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-black">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{categories.length}</div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Staff Categories</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-black">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{designations.length}</div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Designations Created</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-800 font-black">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{designations.filter(d => !!d.photo_url).length}</div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">With Photographs</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-900 font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{designations.filter(d => d.is_active).length}</div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Active Roles</div>
          </div>
        </div>
      </div>

      {/* RECEPTIONIST LOGIN CREDENTIALS MANAGER (SUPER ADMIN SETTINGS) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Receptionist Login & Password Settings</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase">
                  Super Admin Config
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Set credentials for Reception / Front Desk staff. Logged in Receptionists can ONLY access the OPD Appointment Booking & Walk-In Registration option. No administrative or financial records permitted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-2 rounded-xl">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span className="font-semibold text-[11px]">Restricted Privilege Role</span>
          </div>
        </div>

        {recSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {recSuccessMsg}
          </div>
        )}

        <form onSubmit={handleSaveReceptionistCredentials} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Receptionist Full Name</label>
            <input
              type="text"
              required
              value={recFullName}
              onChange={(e) => setRecFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-400"
              placeholder="e.g. Pooja Mehta (Reception Desk)"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Login Username / Email</label>
            <input
              type="email"
              required
              value={recEmail}
              onChange={(e) => setRecEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
              placeholder="reception.opd@skmh.org"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Access Password</label>
            <div className="relative">
              <input
                type={showRecPass ? "text" : "password"}
                required
                value={recPassword}
                onChange={(e) => setRecPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowRecPass(!showRecPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                title="Toggle password view"
              >
                {showRecPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingRec}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingRec ? 'Updating Credentials...' : 'Save Receptionist Password'}
          </button>
        </form>
      </div>

      {/* CATEGORIES OVERVIEW GRID */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <span>Hospital Staff Categories ({categories.length})</span>
            </h3>
            <p className="text-xs text-slate-500">Define operational departments and staff categorization groups.</p>
          </div>

          <button
            onClick={handleOpenAddCategory}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const desigCount = designations.filter(d => d.category_id === cat.id).length;

            return (
              <div 
                key={cat.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedCatFilter === cat.id 
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-emerald-400 font-mono text-[10px] font-black tracking-wider uppercase">
                      {cat.code}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Edit Category Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTarget({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-100 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{cat.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{cat.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    Designations: <strong className="text-slate-900 font-bold">{desigCount}</strong>
                  </span>

                  <button
                    onClick={() => setSelectedCatFilter(selectedCatFilter === cat.id ? 'all' : cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-colors ${
                      selectedCatFilter === cat.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {selectedCatFilter === cat.id ? 'Filter Active ✓' : 'Filter Roles'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DESIGNATIONS LIST & MANAGEMENT SECTION WITH PHOTOGRAPHS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Staff Designations & Official Profiles ({filteredDesignations.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Staff designations with photographs, qualifications, responsibilities, and shift schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Title, Dept, Qualification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All Categories ({designations.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={handleOpenAddDesignation}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Designation
            </button>
          </div>
        </div>

        {/* DESIGNATIONS CARDS GRID */}
        {filteredDesignations.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Staff Designations Found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or create a new designation with photograph.</p>
            <button
              onClick={handleOpenAddDesignation}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Designation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesignations.map((desig) => (
              <div 
                key={desig.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Header Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={desig.photo_url || PRESET_STAFF_PHOTOS[0].url} 
                          alt={desig.title} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${desig.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} title={desig.is_active ? 'Active Designation' : 'Inactive'}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>

                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-wide">
                          {desig.category_name}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">{desig.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditDesignation(desig)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit Designation & Photograph"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTarget({ type: 'designation', id: desig.id, name: desig.title })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete Designation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details & Specs */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Department:</span>
                      <strong className="text-slate-900 truncate max-w-[170px]">{desig.department}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Qualification:</span>
                      <strong className="text-slate-900 truncate max-w-[170px]">{desig.qualification}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pay Grade:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono font-bold text-[10px]">
                        {desig.pay_grade || 'Grade Standard'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" /> Shift:
                      </span>
                      <span className="text-slate-800 font-bold text-[11px] truncate max-w-[170px]">
                        {desig.shift_timing}
                      </span>
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <p className="text-[11px] text-slate-500 mt-3 line-clamp-2 italic">
                    "{desig.responsibilities}"
                  </p>
                </div>

                {/* Footer Contact Details */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-mono">{desig.contact_phone || 'Ext: 104'}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    desig.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {desig.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= MODAL 1: ADD / EDIT STAFF CATEGORY ================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <span>{editingCategory ? 'Edit Staff Category' : 'Create Staff Category'}</span>
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hospital Reception & OPD Desk"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. REC-OPD"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Scope of Work</label>
                <textarea
                  rows={3}
                  placeholder="Details of staff members and functions included in this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD / EDIT STAFF DESIGNATION WITH PHOTOGRAPH ================= */}
      {designationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>{editingDesignation ? 'Modify Staff Designation & Photograph' : 'Create Staff Designation with Photograph'}</span>
              </h3>
              <button
                onClick={() => setDesignationModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesignation} className="space-y-4 text-xs">
              
              {/* PHOTOGRAPH SELECTION SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Official Profile Photograph *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Select preset or enter photo URL</span>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={desigPhotoUrl || PRESET_STAFF_PHOTOS[0].url} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      required
                      placeholder="Paste Photograph Image URL..."
                      value={desigPhotoUrl}
                      onChange={(e) => setDesigPhotoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px] focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500">Live preview shown on left. Or choose a preset thumbnail below:</p>
                  </div>
                </div>

                {/* Preset Thumbnails */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_STAFF_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDesigPhotoUrl(p.url)}
                      className={`p-1 rounded-xl border flex items-center gap-1.5 transition-all text-[10px] font-bold ${
                        desigPhotoUrl === p.url
                          ? 'border-emerald-600 bg-emerald-100 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-6 h-6 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TWO COLUMN FORM GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior OPD Receptionist & Triage Supervisor"
                    value={desigTitle}
                    onChange={(e) => setDesigTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Category *</label>
                  <select
                    value={desigCategoryId}
                    onChange={(e) => setDesigCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hospital Front Desk & OPD Entry"
                    value={desigDepartment}
                    onChange={(e) => setDesigDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualification / License *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.A. / B.Sc Healthcare Admin / Nursing"
                    value={desigQualification}
                    onChange={(e) => setDesigQualification(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pay Grade / Band</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade R-1"
                    value={desigPayGrade}
                    onChange={(e) => setDesigPayGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Shift (08:00 AM - 04:00 PM)"
                    value={desigShiftTiming}
                    onChange={(e) => setDesigShiftTiming(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 12345"
                    value={desigPhone}
                    onChange={(e) => setDesigPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="staff.desk@skmh.org"
                    value={desigEmail}
                    onChange={(e) => setDesigEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Responsibilities & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Describe daily duties, patient handling responsibilities..."
                  value={desigResponsibilities}
                  onChange={(e) => setDesigResponsibilities(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={desigIsActive}
                  onChange={(e) => setDesigIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="activeCheck" className="font-bold text-slate-800 cursor-pointer">
                  Active Designation (Currently Operational in Hospital)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDesignationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow"
                >
                  {editingDesignation ? 'Update Designation' : 'Save Designation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DELETE CONFIRMATION DIALOG ================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base">
                Delete {deleteConfirmTarget.type === 'category' ? 'Staff Category' : 'Designation'}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-900">"{deleteConfirmTarget.name}"</strong>? This action will remove it from the system.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
