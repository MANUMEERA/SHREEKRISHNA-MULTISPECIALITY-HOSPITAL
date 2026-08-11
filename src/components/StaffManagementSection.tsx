import React, { useState, useEffect, useRef } from 'react';
import { StaffCategory, StaffDesignation } from '../types';
import { api } from '../lib/api';
import { 
  Users, UserCheck, Plus, Edit, Trash2, Search, Image as ImageIcon, 
  Building2, Briefcase, Phone, Mail, Clock, Award, ShieldCheck, 
  Check, X, AlertTriangle, RefreshCw, Sparkles, Filter, ChevronRight,
  Lock, KeyRound, Eye, EyeOff, Save, ShieldAlert, Upload, Settings, Download, FileSpreadsheet
} from 'lucide-react';
import { parseCSV, downloadSampleCSV } from '../lib/csvHelper';

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

const STORAGE_KEYS_STAFF = {
  SHIFTS: 'skmh_hospital_shifts_v1',
  DEPARTMENTS: 'skmh_hospital_departments_v1'
};

const DEFAULT_SHIFTS = [
  { id: 'sh-1', name: 'Morning Shift', timing: '08:00 AM - 04:00 PM' },
  { id: 'sh-2', name: 'Evening Shift', timing: '04:00 PM - 12:00 AM' },
  { id: 'sh-3', name: 'Night Duty Shift', timing: '12:00 AM - 08:00 AM' },
  { id: 'sh-4', name: 'Full-Day OPD Shift', timing: '09:00 AM - 06:00 PM' },
  { id: 'sh-5', name: 'Emergency / On-Call 24x7', timing: 'Flexible / Rotational' }
];

const DEFAULT_DEPARTMENTS = [
  'Hospital Front Desk & OPD Entry',
  'Orthopedics & Joint Replacement',
  'Cardiology & Cardiac Care',
  'General Medicine & Diabetology',
  'General & Laparoscopic Surgery',
  'Pediatrics & Neonatology',
  'Gynecology & Obstetrics',
  'Intensive Care Unit (ICU) & Critical Care',
  'Inpatient Ward Management (IPD)',
  'Emergency & Casualty',
  'Laboratory & Pathology',
  'Radiology & Imaging',
  'Pharmacy & Drug Stores',
  'Hospital Administration & Billing',
  'IT & Medical Systems Specialist'
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

  // Shift & Department State
  const [shifts, setShifts] = useState<{ id: string; name: string; timing: string }[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS_STAFF.SHIFTS);
      return saved ? JSON.parse(saved) : DEFAULT_SHIFTS;
    } catch {
      return DEFAULT_SHIFTS;
    }
  });

  const [departmentList, setDepartmentList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS_STAFF.DEPARTMENTS);
      return saved ? JSON.parse(saved) : DEFAULT_DEPARTMENTS;
    } catch {
      return DEFAULT_DEPARTMENTS;
    }
  });

  // Shift Management Modal
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<{ id: string; name: string; timing: string } | null>(null);
  const [shiftNameInput, setShiftNameInput] = useState('');
  const [shiftTimingInput, setShiftTimingInput] = useState('');

  // Custom Department Input Mode
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState('');
  
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

  // CSV Import State for Staff Designations
  const [showStaffCsvModal, setShowStaffCsvModal] = useState(false);
  const [parsedStaffPreview, setParsedStaffPreview] = useState<Partial<StaffDesignation>[]>([]);
  const [staffCsvError, setStaffCsvError] = useState<string | null>(null);
  const [importingStaff, setImportingStaff] = useState(false);
  const staffFileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setDesigPhotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftNameInput.trim()) return;

    let updatedShifts;
    if (editingShift) {
      updatedShifts = shifts.map(s => s.id === editingShift.id ? { ...s, name: shiftNameInput.trim(), timing: shiftTimingInput.trim() || 'Flexible Hours' } : s);
    } else {
      const newShift = {
        id: `sh-${Date.now()}`,
        name: shiftNameInput.trim(),
        timing: shiftTimingInput.trim() || 'Flexible Hours'
      };
      updatedShifts = [...shifts, newShift];
    }

    setShifts(updatedShifts);
    localStorage.setItem(STORAGE_KEYS_STAFF.SHIFTS, JSON.stringify(updatedShifts));
    
    // Automatically select newly created/updated shift if designation modal is open
    const shiftStr = `${shiftNameInput.trim()} (${shiftTimingInput.trim() || 'Flexible Hours'})`;
    setDesigShiftTiming(shiftStr);

    setEditingShift(null);
    setShiftNameInput('');
    setShiftTimingInput('');
  };

  const handleDeleteShift = (shiftId: string) => {
    if (shifts.length <= 1) {
      alert('At least one shift schedule must be maintained in the hospital system.');
      return;
    }
    const updated = shifts.filter(s => s.id !== shiftId);
    setShifts(updated);
    localStorage.setItem(STORAGE_KEYS_STAFF.SHIFTS, JSON.stringify(updated));
    if (editingShift && editingShift.id === shiftId) {
      setEditingShift(null);
      setShiftNameInput('');
      setShiftTimingInput('');
    }
  };

  const handleAddCustomDepartment = () => {
    if (!customDeptInput.trim()) return;
    const newDept = customDeptInput.trim();
    if (!departmentList.includes(newDept)) {
      const updated = [...departmentList, newDept];
      setDepartmentList(updated);
      localStorage.setItem(STORAGE_KEYS_STAFF.DEPARTMENTS, JSON.stringify(updated));
    }
    setDesigDepartment(newDept);
    setIsCustomDept(false);
    setCustomDeptInput('');
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

  // Staff CSV Handlers
  const handleDownloadStaffTemplate = () => {
    downloadSampleCSV(
      'SKMH_Staff_Designations_Import_Template.csv',
      ['Title', 'Category Code', 'Department', 'Qualifications', 'Role Description', 'Shift Timing', 'Phone', 'Email', 'Pay Grade', 'Staff Count'],
      [
        ['Senior ICU Charge Nurse', 'NUR', 'Intensive Care Unit (ICU) & Critical Care', 'B.Sc Nursing, Critical Care Cert', 'Supervises ICU night shifts and ventilator operations', 'Night Duty Shift (12:00 AM - 08:00 AM)', '+91 98765 22001', 'icu.nurse@skmh.org', 'Grade R-3', '12'],
        ['Senior Radiography Technologist', 'PAR', 'Radiology & Imaging', 'DMRIT / B.Sc Radiology', 'Operates MRI 1.5T & CT Scan 128-slice suites', 'Full-Day OPD Shift (09:00 AM - 06:00 PM)', '+91 98765 22002', 'radiology.tech@skmh.org', 'Grade R-2', '6'],
        ['Hospital Front Desk Executive', 'ADM', 'Hospital Front Desk & OPD Entry', 'B.Com / Healthcare Admin', 'Manages OPD queue and walk-in patient registrations', 'Morning Shift (08:00 AM - 04:00 PM)', '+91 98765 22003', 'frontdesk@skmh.org', 'Grade R-1', '8'],
        ['Senior Clinical Pharmacist', 'PHA', 'Pharmacy & Drug Stores', 'M.Pharm / B.Pharm', 'Inventory stock tracking & IPD medicine dispensing', 'Evening Shift (04:00 PM - 12:00 AM)', '+91 98765 22004', 'pharmacy.lead@skmh.org', 'Grade R-2', '5']
      ]
    );
  };

  const handleStaffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStaffCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { rows } = parseCSV(text);

        if (rows.length === 0) {
          setStaffCsvError('The uploaded CSV file is empty or missing content.');
          return;
        }

        const items: Partial<StaffDesignation>[] = [];
        for (const row of rows) {
          const title = row['title'] || row['designation title'] || row['designation'] || row['name'] || row['role'];
          if (!title) continue;

          // Find category by code or default
          const catCodeInput = (row['category code'] || row['category'] || 'NUR').toUpperCase();
          const matchedCat = categories.find(c => c.code.toUpperCase() === catCodeInput || c.name.toLowerCase().includes(catCodeInput.toLowerCase())) || categories[0];

          items.push({
            title,
            category_id: matchedCat ? matchedCat.id : (categories[0]?.id || 'cat-1'),
            department: row['department'] || row['dept'] || matchedCat?.name || 'Hospital Operations',
            qualification: row['qualifications'] || row['qualification'] || row['education'] || 'Degree / Diploma',
            responsibilities: row['role description'] || row['description'] || row['responsibilities'] || 'General operational duties',
            shift_timing: row['shift timing'] || row['shift'] || 'Morning Shift (08:00 AM - 04:00 PM)',
            contact_phone: row['phone'] || row['contact phone'] || '+91 98765 00000',
            contact_email: row['email'] || row['contact email'] || 'staff@skmh.org',
            pay_grade: row['pay grade'] || row['grade'] || 'Grade R-1',
            staff_count: parseInt(row['staff count'] || row['count'] || '1', 10),
            is_active: true,
            photograph_url: PRESET_STAFF_PHOTOS[items.length % PRESET_STAFF_PHOTOS.length].url
          });
        }

        if (items.length === 0) {
          setStaffCsvError('No valid staff designation rows found. Please make sure "Title" column exists.');
          return;
        }

        setParsedStaffPreview(items);
        setShowStaffCsvModal(true);
      } catch (err: any) {
        setStaffCsvError(`Error parsing CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleConfirmStaffImport = async () => {
    if (parsedStaffPreview.length === 0) return;
    setImportingStaff(true);
    try {
      const addedList: StaffDesignation[] = [];
      for (const item of parsedStaffPreview) {
        const created = await api.addStaffDesignation({
          title: item.title || 'Staff Role',
          category_id: item.category_id || categories[0]?.id || 'cat-1',
          category_name: categories.find(c => c.id === (item.category_id || categories[0]?.id))?.name || 'Hospital Staff & Operations',
          department: item.department || 'Hospital Operations',
          qualification: item.qualification || 'Degree',
          responsibilities: item.responsibilities || 'Hospital duties',
          shift_timing: item.shift_timing || 'Morning Shift',
          contact_phone: item.contact_phone || '+91 98765 00000',
          contact_email: item.contact_email || 'staff@skmh.org',
          pay_grade: item.pay_grade || 'Grade R-1',
          staff_count: item.staff_count || 1,
          is_active: true,
          photograph_url: item.photograph_url || PRESET_STAFF_PHOTOS[0].url
        });
        addedList.push(created);
      }

      setDesignations(prev => [...addedList, ...prev]);
      setShowStaffCsvModal(false);
      setParsedStaffPreview([]);
    } catch (err) {
      console.error('Failed to import staff designations', err);
      setStaffCsvError('Failed to save imported staff records into database.');
    } finally {
      setImportingStaff(false);
    }
  };

  // Open Add Designation Modal
  const handleOpenAddDesignation = () => {
    setEditingDesignation(null);
    setDesigTitle('');
    setDesigCategoryId(categories.length > 0 ? categories[0].id : '');
    setDesigDepartment(departmentList[0] || 'Hospital Front Desk & OPD Entry');
    setDesigPhotoUrl(PRESET_STAFF_PHOTOS[0].url);
    setDesigQualification('B.A. / B.Sc Healthcare Administration');
    setDesigResponsibilities('Managing patient registrations, doctor assignment, desk counter billing, and hospital inquiries.');
    setDesigPayGrade('Grade R-1');
    const defaultShiftStr = shifts.length > 0 ? `${shifts[0].name} (${shifts[0].timing})` : 'Morning Shift (08:00 AM - 04:00 PM)';
    setDesigShiftTiming(defaultShiftStr);
    setDesigIsActive(true);
    setDesigPhone('+91 98765 12345');
    setDesigEmail('staff.desk@skmh.org');
    setIsCustomDept(false);
    setCustomDeptInput('');
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
    setDesigShiftTiming(desig.shift_timing || (shifts.length > 0 ? `${shifts[0].name} (${shifts[0].timing})` : 'Morning Shift (08:00 AM - 04:00 PM)'));
    setDesigIsActive(desig.is_active);
    setDesigPhone(desig.contact_phone || '');
    setDesigEmail(desig.email || '');
    setIsCustomDept(false);
    setCustomDeptInput('');
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

            {/* Hidden Staff CSV File Input */}
            <input
              type="file"
              ref={staffFileInputRef}
              accept=".csv,.txt"
              onChange={handleStaffFileChange}
              className="hidden"
            />

            <button
              onClick={handleDownloadStaffTemplate}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Sample CSV Template for Staff Designations"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Sample CSV</span>
            </button>

            <button
              onClick={() => staffFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Import Staff Designations & Personnel from CSV or Excel file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span>Import Staff CSV</span>
            </button>

            <button
              onClick={handleOpenAddDesignation}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>{editingDesignation ? 'Modify Staff Designation & Photograph' : 'Create Staff Designation with Photograph'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDesignationModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <form onSubmit={handleSaveDesignation} className="space-y-4 text-xs">
              
              {/* PHOTOGRAPH SELECTION SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Official Profile Photograph *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Upload photo file, paste URL, or pick preset</span>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={desigPhotoUrl || PRESET_STAFF_PHOTOS[0].url} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow flex-shrink-0 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <label 
                        htmlFor="photo-file-upload-input"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo File
                      </label>
                      <input 
                        type="file" 
                        id="photo-file-upload-input" 
                        accept="image/*" 
                        onChange={handlePhotoFileUpload} 
                        className="hidden" 
                      />
                      <input
                        type="text"
                        required
                        placeholder="Or paste photograph image URL..."
                        value={desigPhotoUrl}
                        onChange={(e) => setDesigPhotoUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px] focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Upload an official photograph file from your device, or select a preset avatar thumbnail below:
                    </p>
                  </div>
                </div>

                {/* Preset Thumbnails */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                  {PRESET_STAFF_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDesigPhotoUrl(p.url)}
                      className={`p-1 rounded-xl border flex items-center gap-1.5 transition-all text-[10px] font-bold cursor-pointer ${
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

                {/* DEPARTMENT DROPDOWN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Hospital Department *</label>
                    {!isCustomDept && (
                      <button
                        type="button"
                        onClick={() => setIsCustomDept(true)}
                        className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Custom Dept
                      </button>
                    )}
                  </div>

                  {isCustomDept ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Enter Custom Dept Name..."
                        value={customDeptInput}
                        onChange={(e) => setCustomDeptInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-emerald-500 font-semibold text-xs focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomDepartment}
                        className="px-3 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-[11px] cursor-pointer hover:bg-emerald-500"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomDept(false)}
                        className="px-2.5 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-[11px] cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      value={desigDepartment}
                      onChange={(e) => {
                        if (e.target.value === '__add_custom__') {
                          setIsCustomDept(true);
                        } else {
                          setDesigDepartment(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      {departmentList.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                      {!departmentList.includes(desigDepartment) && desigDepartment && (
                        <option value={desigDepartment}>{desigDepartment}</option>
                      )}
                      <option value="__add_custom__">+ Add Custom Department...</option>
                    </select>
                  )}
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

                {/* SHIFT SCHEDULE DROPDOWN WITH MANAGEMENT TRIGGER */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Shift Schedule *</label>
                    <button
                      type="button"
                      onClick={() => setShiftModalOpen(true)}
                      className="text-[10px] text-emerald-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-emerald-600" /> Manage Shifts (+/Edit/Del)
                    </button>
                  </div>

                  <select
                    value={desigShiftTiming}
                    onChange={(e) => setDesigShiftTiming(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    {shifts.map((s) => {
                      const shiftStr = `${s.name} (${s.timing})`;
                      return (
                        <option key={s.id} value={shiftStr}>
                          {shiftStr}
                        </option>
                      );
                    })}
                    {!shifts.some(s => `${s.name} (${s.timing})` === desigShiftTiming) && (
                      <option value={desigShiftTiming}>{desigShiftTiming}</option>
                    )}
                  </select>
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
        </div>
      )}

      {/* ================= MODAL: SHIFT MANAGEMENT FACILITY (ADD, MODIFY, DELETE SHIFTS) ================= */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Hospital Staff Shift Management</span>
              </h3>
              <button
                onClick={() => setShiftModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ADD / EDIT SHIFT FORM */}
            <form onSubmit={handleSaveShift} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
              <h4 className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                {editingShift ? <Edit className="w-3.5 h-3.5 text-emerald-700" /> : <Plus className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{editingShift ? 'Modify Existing Shift' : 'Add New Hospital Shift'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Night Duty Shift"
                    value={shiftNameInput}
                    onChange={(e) => setShiftNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timings *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12:00 AM - 08:00 AM"
                    value={shiftTimingInput}
                    onChange={(e) => setShiftTimingInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingShift && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShift(null);
                      setShiftNameInput('');
                      setShiftTimingInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow cursor-pointer"
                >
                  {editingShift ? 'Save Shift Changes' : 'Add Shift'}
                </button>
              </div>
            </form>

            {/* LIST OF CURRENT SHIFTS WITH MODIFY & DELETE */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Configured Hospital Shifts ({shifts.length})</label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-emerald-300 transition-all shadow-2xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 block">{s.name}</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">{s.timing}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShift(s);
                          setShiftNameInput(s.name);
                          setShiftTimingInput(s.timing);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
                        title="Modify / Edit Shift"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShift(s.id)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Shift"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
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

      {/* ================= MODAL 4: STAFF CSV IMPORT PREVIEW MODAL ================= */}
      {showStaffCsvModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[88vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Import Staff Personnel & Designations via CSV</h3>
                  <p className="text-xs text-slate-400">Preview {parsedStaffPreview.length} staff designation records parsed from uploaded spreadsheet</p>
                </div>
              </div>
              <button onClick={() => setShowStaffCsvModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {staffCsvError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{staffCsvError}</span>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Designation Title</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Qualifications</th>
                      <th className="p-2.5">Shift Schedule</th>
                      <th className="p-2.5">Phone / Email</th>
                      <th className="p-2.5">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedStaffPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.title}</td>
                        <td className="p-2.5 text-slate-600">{item.department}</td>
                        <td className="p-2.5 text-emerald-800 font-semibold">{item.qualification}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.shift_timing}</td>
                        <td className="p-2.5 text-[11px] font-mono text-slate-500">
                          <div>{item.contact_phone}</div>
                          <div className="text-slate-400">{item.contact_email}</div>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{item.staff_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-500">
                Ready to import <strong className="text-slate-900">{parsedStaffPreview.length}</strong> staff designations into Hospital Staff Master.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffCsvModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStaffImport}
                  disabled={importingStaff}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {importingStaff ? 'Importing Staff...' : `Confirm Import (${parsedStaffPreview.length} Designations)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
