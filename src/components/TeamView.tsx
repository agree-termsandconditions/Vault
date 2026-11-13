import React, { useState, useEffect, useRef } from 'react';
import { Employee, DepartmentConfig, DEFAULT_DEPARTMENTS, PasswordResetRequest } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users,
  UserPlus,
  Zap,
  Lock,
  ShieldCheck,
  X,
  Trash2,
  RefreshCw,
  KeyRound,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Sparkles,
  Building2,
  Edit3,
  Plus,
  Check,
  Copy,
  Clock
} from 'lucide-react';

export interface TeamViewProps {
  isMasterAdmin?: boolean;
}

export const TeamView: React.FC<TeamViewProps> = ({ isMasterAdmin: propIsMasterAdmin }) => {
  const isMasterAdmin =
    propIsMasterAdmin !== undefined
      ? propIsMasterAdmin
      : localStorage.getItem('vault_is_master_admin') === 'true';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Department & Shortcut Editor State
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptShortcut, setEditDeptShortcut] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptShortcut, setNewDeptShortcut] = useState('');

  // Single Onboard Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Science');
  const [userType, setUserType] = useState<'regular' | 'superuser' | 'admin'>('regular');

  // User Details Editor Modal (with embedded Set Password) State
  const [editUserTarget, setEditUserTarget] = useState<Employee | null>(null);
  const [editUserEmpId, setEditUserEmpId] = useState('');
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserDept, setEditUserDept] = useState('Science');
  const [editUserDesignation, setEditUserDesignation] = useState('');
  const [editUserRole, setEditUserRole] = useState<'regular' | 'superuser' | 'admin' | 'master_admin'>('regular');
  const [showInlinePasswordEditor, setShowInlinePasswordEditor] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Master Admin Temporary Password Reset Token Queue State
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState(
    'EMP-3001, Prof. Sarah Lin, Science, Biology Teacher, sarah.lin@campus.edu, superuser\nEMP-3002, David Kim, Mathematics, Algebra Teacher, david.kim@campus.edu, regular'
  );
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchResetRequests();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch (e) {}
  };

  const fetchResetRequests = async () => {
    try {
      const res = await fetch('/api/admin/password-reset-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setResetRequests(data.requests);
      }
    } catch (e) {}
  };

  const handleTriggerResetToken = async (empIdStr: string, reqId?: number) => {
    try {
      const res = await fetch('/api/admin/trigger-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: empIdStr,
          request_id: reqId,
          is_master_admin: true,
          issued_by: localStorage.getItem('vault_current_user') || 'Akish Kumar (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.requests)) setResetRequests(data.requests);
        else fetchResetRequests();
        fetchEmployees();
        setEditUserTarget((prev) =>
          prev && prev.emp_id.toUpperCase() === empIdStr.toUpperCase()
            ? { ...prev, active_reset_token: data.reset_token }
            : prev
        );
        showToast(data.message || `Issued temporary reset token ${data.reset_token}`);
      }
    } catch (e) {}
  };

  const handleRevokeResetRequest = async (empIdStr: string, reqId?: number) => {
    try {
      const res = await fetch('/api/admin/reject-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: empIdStr,
          request_id: reqId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.requests)) setResetRequests(data.requests);
        else fetchResetRequests();
        fetchEmployees();
        showToast(`Revoked password reset request/token for ${empIdStr}.`);
      }
    } catch (e) {}
  };

  const handleCopyResetToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast(`Copied temporary reset token ${token} to clipboard`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch (e) {}
  };

  // Department & Shortcut Management Handlers
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptShortcut.trim()) return;
    try {
      const res = await fetch('/api/departments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName.trim(),
          shortcut: newDeptShortcut.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
        setNewDeptName('');
        setNewDeptShortcut('');
        showToast(`Added department "${newDeptName}" (shortcut: ${newDeptShortcut.toLowerCase()})`);
      }
    } catch (e) {}
  };

  const handleSaveDeptShortcut = async (id: number) => {
    if (!editDeptName.trim() || !editDeptShortcut.trim()) return;
    try {
      const res = await fetch('/api/departments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editDeptName.trim(),
          shortcut: editDeptShortcut.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
        setEditingDeptId(null);
        fetchEmployees();
        showToast(`Updated shortcut for ${editDeptName} to "${editDeptShortcut.toLowerCase()}"`);
      }
    } catch (e) {}
  };

  const handleDeleteDepartment = async (id: number, name: string) => {
    if (name.toLowerCase() === 'others') return;
    try {
      const res = await fetch('/api/departments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
        fetchEmployees();
        showToast(`Removed department "${name}"`);
      }
    } catch (e) {}
  };

  // Reallocate / Map Employee Department
  const handleChangeEmployeeDept = async (empIdNum: number, newDept: string) => {
    try {
      const res = await fetch('/api/employees/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: empIdNum, department: newDept }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
        showToast(`Allocated ${data.employee.full_name} to ${newDept} department.`);
      }
    } catch (e) {}
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !fullName) return;

    try {
      const res = await fetch('/api/employees/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: empId,
          full_name: fullName,
          email: email || `${empId.toLowerCase()}@campus.edu`,
          designation: designation || `${department} Teacher`,
          department,
          user_type: userType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assignedDefaultPwd = data.default_password || `${empId.trim()}@2027`;
        setShowAddModal(false);
        setEmpId('');
        setFullName('');
        setEmail('');
        setDesignation('');
        fetchEmployees();
        showToast(
          `Onboarded ${fullName} (${empId.trim()}) • Default Password: ${assignedDefaultPwd} • Status: 0 (Not Activated until 1st login)`
        );
      }
    } catch (e) {}
  };

  const handleToggleEmployee = async (id: number, field: 'role' | 'passwordless' | 'printer' | 'admin') => {
    try {
      const res = await fetch('/api/employees/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
        if (data.employee) {
          setEditUserTarget((prev) =>
            prev && prev.id === id ? { ...prev, ...data.employee } : prev
          );
          if (editUserTarget && editUserTarget.id === id) {
            setEditUserRole(data.employee.user_type);
          }
        }
        if (field === 'admin' && data.employee) {
          showToast(
            data.employee.user_type === 'admin'
              ? `Promoted ${data.employee.full_name} (${data.employee.emp_id}) to Campus Admin.`
              : `Removed Admin privileges from ${data.employee.full_name} (${data.employee.emp_id}).`
          );
        }
      }
    } catch (e) {}
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      const res = await fetch('/api/employees/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEmployees();
        showToast('Removed faculty member from directory.');
      }
    } catch (e) {}
  };

  const openEditUserModal = (emp: Employee) => {
    setEditUserTarget(emp);
    setEditUserEmpId(emp.emp_id);
    setEditUserFullName(emp.full_name);
    setEditUserEmail(emp.email);
    setEditUserDept(emp.department);
    setEditUserDesignation(emp.designation);
    setEditUserRole(emp.user_type);
    setShowInlinePasswordEditor(false);
    setNewPassword('');
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTarget) return;

    try {
      const res = await fetch('/api/employees/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editUserTarget.id,
          emp_id: editUserEmpId.trim(),
          full_name: editUserFullName.trim(),
          email: editUserEmail.trim(),
          department: editUserDept,
          designation: editUserDesignation.trim(),
          user_type: editUserRole,
          new_password: showInlinePasswordEditor && newPassword.trim() ? newPassword.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Updated details for ${editUserFullName}`);
        setEditUserTarget(null);
        setShowInlinePasswordEditor(false);
        setNewPassword('');
        fetchEmployees();
      }
    } catch (e) {}
  };

  const handleResetPasswordSubmit = async () => {
    if (!editUserTarget || !newPassword.trim()) return;

    try {
      const res = await fetch('/api/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editUserTarget.id,
          new_password: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Password reset for ${editUserTarget.full_name}`);
        setNewPassword('');
        setShowInlinePasswordEditor(false);
        fetchEmployees();
      }
    } catch (e) {}
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(`Vault@${randomPart}`);
  };

  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);

      if (rows.length > 0) {
        const formattedLines = rows
          .map((r) => {
            const id = r['Emp ID'] || r.emp_id || r.EmpID || r.ID || '';
            const name = r['Full Name'] || r.full_name || r.FullName || r.Name || '';
            const dept = r.Department || r.department || 'Science';
            const desig = r.Designation || r.designation || 'Subject Teacher';
            const mail = r.Email || r.email || `${String(id).toLowerCase()}@campus.edu`;
            const role = String(r.Role || r.user_type || r.role || 'regular').toLowerCase();
            return `${id}, ${name}, ${dept}, ${desig}, ${mail}, ${role.includes('super') ? 'superuser' : 'regular'}`;
          })
          .filter((line) => !line.startsWith(','));

        if (formattedLines.length > 0) {
          setBulkCsvText(formattedLines.join('\n'));
          showToast(`Loaded ${formattedLines.length} rows from ${file.name}`);
        }
      }
    } catch (err) {
      const text = await file.text();
      setBulkCsvText(text);
    }
    e.target.value = '';
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkCsvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const parsedRecords = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length < 2) return null;
        if (parts[0].toLowerCase() === 'emp id' || parts[0].toLowerCase() === 'emp_id') return null;
        const [emp_id, full_name, department, designation, email, role] = parts;
        const isSuper = (role || '').toLowerCase().includes('super');
        return {
          emp_id,
          full_name,
          department: department || 'Science',
          designation: designation || 'Subject Teacher',
          email: email || `${emp_id.toLowerCase()}@campus.edu`,
          user_type: isSuper ? 'superuser' : 'regular',
          passwordless_allowed: isSuper,
          printer_access_allowed: isSuper,
        };
      })
      .filter(Boolean);

    if (parsedRecords.length === 0) return;

    setBulkUploading(true);
    try {
      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: parsedRecords }),
      });
      const data = await res.json();
      if (data.success) {
        setShowBulkModal(false);
        fetchEmployees();
        showToast(`Bulk uploaded ${data.addedCount} faculty members successfully.`);
      }
    } catch (e) {
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        'Emp ID': 'EMP-3001',
        'Full Name': 'Prof. Sarah Lin',
        Department: 'Science',
        Designation: 'Biology Teacher',
        Email: 'sarah.lin@campus.edu',
        Role: 'superuser',
      },
      {
        'Emp ID': 'EMP-3002',
        'Full Name': 'David Kim',
        Department: 'Mathematics',
        Designation: 'Algebra Teacher',
        Email: 'david.kim@campus.edu',
        Role: 'regular',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BulkUploadTemplate');
    XLSX.writeFile(workbook, 'Vault_Users_Bulk_Template.xlsx');
  };

  const handleExportXLSX = () => {
    const rows = employees.map((emp) => ({
      'Emp ID': emp.emp_id,
      'Full Name': emp.full_name,
      Email: emp.email,
      'Allocated Department': emp.department,
      Designation: emp.designation,
      Role: emp.user_type.toUpperCase(),
      'Public Upload Right': emp.passwordless_allowed ? 'Allowed' : 'PIN Required',
      'Printer Access': emp.printer_access_allowed ? 'Allowed' : 'PIN Required',
      Status: emp.is_active ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UsersDirectory');
    XLSX.writeFile(workbook, 'Vault_Users_Directory.xlsx');
    setShowExportMenu(false);
    showToast('Downloaded Vault_Users_Directory.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setTextColor(14, 62, 199);
    doc.text('Vault - Classified Faculty & Department Directory', 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on ${new Date().toLocaleString()} • Total Faculty: ${employees.length}`,
      14,
      22
    );

    const tableBody = employees.map((emp) => [
      emp.emp_id,
      emp.full_name,
      emp.email,
      emp.department,
      emp.designation,
      emp.user_type.toUpperCase(),
      emp.passwordless_allowed ? 'Allowed' : 'PIN Required',
      emp.printer_access_allowed ? 'Allowed' : 'PIN Required',
    ]);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          'EMP ID',
          'FULL NAME',
          'EMAIL',
          'DEPARTMENT',
          'DESIGNATION',
          'ROLE',
          'PUBLIC UPLOAD',
          'PRINTER ACCESS',
        ],
      ],
      body: tableBody,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [14, 62, 199], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save('Vault_Users_Directory.pdf');
    setShowExportMenu(false);
    showToast('Downloaded Vault_Users_Directory.pdf');
  };

  const filteredEmployees =
    selectedDeptFilter === 'All'
      ? employees
      : employees.filter((e) => e.department.toLowerCase() === selectedDeptFilter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SECTION A: DEPARTMENT MANAGEMENT & TAG SHORTCUT EDITOR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
              <Building2 className="w-4 h-4" />
              Academic Department & Search Shortcut Governance
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Department Management & Tag Shortcut Editor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure academic departments and their search bar shortcut codes (e.g., <code className="text-blue-700 font-bold">s</code> = Science, <code className="text-blue-700 font-bold">ss</code> = Social Science, <code className="text-blue-700 font-bold">k</code> = Kannada, <code className="text-blue-700 font-bold">it</code> = IT) used in queries like <code className="text-slate-800 font-bold">s,6,a</code>.
            </p>
          </div>

          {/* Add New Department + Shortcut Form */}
          <form onSubmit={handleAddDepartment} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="New Dept Name (e.g. Hindi)"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white w-44"
            />
            <input
              type="text"
              placeholder="Shortcut (e.g. h)"
              maxLength={4}
              value={newDeptShortcut}
              onChange={(e) => setNewDeptShortcut(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white w-32"
            />
            <button
              type="submit"
              className="bg-[#0e3ec7] hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dept</span>
            </button>
          </form>
        </div>

        {/* Department & Shortcut Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {departments.map((dept) => {
            const count = employees.filter(
              (e) => e.department.toLowerCase() === dept.name.toLowerCase()
            ).length;
            const isEditing = editingDeptId === dept.id;

            return (
              <div
                key={dept.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 hover:border-blue-200 transition"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dept Name</label>
                      <input
                        type="text"
                        value={editDeptName}
                        onChange={(e) => setEditDeptName(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Search Shortcut
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={editDeptShortcut}
                        onChange={(e) => setEditDeptShortcut(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-700 outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingDeptId(null)}
                        className="px-2 py-1 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveDeptShortcut(dept.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">{dept.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {count} {count === 1 ? 'Teacher' : 'Teachers'}
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 font-mono font-extrabold text-[11px]"
                        title={`Search shortcut: "${dept.shortcut}"`}
                      >
                        {dept.shortcut}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-mono">
                        e.g. {dept.shortcut},6,a
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDeptId(dept.id);
                            setEditDeptName(dept.name);
                            setEditDeptShortcut(dept.shortcut);
                          }}
                          className="p-1 rounded hover:bg-blue-100 text-blue-600 transition cursor-pointer"
                          title="Edit Department or Shortcut"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {dept.name.toLowerCase() !== 'others' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-500 transition cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION A2: MASTER ADMIN PASSWORD RESET REQUESTS & TEMPORARY TOKEN ISSUER */}
      <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 tracking-wider uppercase mb-1">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Master Admin Authority • Employee Password Reset Token Queue
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Standard Employee Password Reset Requests & Token Issuer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                {resetRequests.filter((r) => r.status === 'pending').length} Pending
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {resetRequests.filter((r) => r.status === 'token_issued').length} Active Tokens
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard employees can submit a <strong>Request Password Reset</strong> from the Campus Login Portal. Master Admins can trigger a single-use 15-minute cryptographic reset token (<code className="font-mono font-bold text-amber-800">RST-XXXXXX</code>) for their account.
            </p>
          </div>

          <button
            onClick={() => {
              fetchResetRequests();
              fetchEmployees();
            }}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {resetRequests.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
            No password reset requests in queue. You can also trigger a temporary reset token directly for any employee in the directory below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resetRequests.map((req) => (
              <div
                key={req.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${
                  req.status === 'pending'
                    ? 'bg-amber-50/50 border-amber-300'
                    : req.status === 'token_issued'
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-xs text-blue-700">{req.emp_id}</span>
                      <span className="font-extrabold text-xs text-slate-900">{req.full_name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {req.department}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      <strong>Reason:</strong> {req.reason}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : req.status === 'token_issued'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : req.status === 'completed'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {req.status === 'pending'
                      ? 'Pending Approval'
                      : req.status === 'token_issued'
                      ? 'Token Active'
                      : req.status === 'completed'
                      ? 'Completed'
                      : 'Rejected'}
                  </span>
                </div>

                {req.status === 'token_issued' && req.reset_token && (
                  <div className="bg-white border border-emerald-300 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Temporary Token:</span>
                      <code className="font-mono font-extrabold text-sm text-emerald-800 tracking-wider">
                        {req.reset_token}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyResetToken(req.reset_token!)}
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedToken === req.reset_token ? 'Copied!' : 'Copy Token'}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Requested {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {req.status !== 'completed' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTriggerResetToken(req.emp_id, req.id)}
                        className="px-3 py-1 rounded-lg bg-[#0e3ec7] hover:bg-blue-700 text-white font-extrabold text-[10px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>
                          {req.status === 'token_issued' ? 'Regenerate Token' : 'Approve & Generate Token'}
                        </span>
                      </button>
                      {(req.status === 'pending' || req.status === 'token_issued') && (
                        <button
                          type="button"
                          onClick={() => handleRevokeResetRequest(req.emp_id, req.id)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px] cursor-pointer"
                        >
                          {req.status === 'pending' ? 'Reject' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION B: FACULTY DIRECTORY & DEPARTMENT ALLOCATION TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
              <Users className="w-4 h-4" />
              Classified Faculty & Teachers by Allocated Department
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Team & Personnel Governance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign or change any teacher's allocated department, toggle Superuser/Public/Printer privileges, reset passwords, or bulk import/export users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchEmployees}
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>

            {/* Download Users Data (XLSX / PDF) */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Users Data</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30 space-y-1 text-xs">
                  <button
                    onClick={handleExportXLSX}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Download as XLSX</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold text-slate-800 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer transition"
                  >
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Download as PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Upload Button */}
            <button
              onClick={() => setShowBulkModal(true)}
              className="border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Upload</span>
            </button>

            {/* Onboard New Member Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#0e3ec7] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Member</span>
            </button>
          </div>
        </div>

        {/* Department Classification Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Department:</span>
          <button
            onClick={() => setSelectedDeptFilter('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedDeptFilter === 'All'
                ? 'bg-[#0e3ec7] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All ({employees.length})
          </button>
          {departments.map((d) => {
            const count = employees.filter(
              (e) => e.department.toLowerCase() === d.name.toLowerCase()
            ).length;
            const active = selectedDeptFilter.toLowerCase() === d.name.toLowerCase();
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDeptFilter(active ? 'All' : d.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#0e3ec7] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{d.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] bg-slate-50/60">
                <th className="py-2.5 px-3">Emp ID</th>
                <th className="py-2.5 px-3">Faculty / Teacher Name</th>
                <th className="py-2.5 px-3 text-center">Activated</th>
                <th className="py-2.5 px-3">Allocated Department (Change)</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Role (Click to Toggle)</th>
                <th className="py-2.5 px-3">Public Upload Right</th>
                <th className="py-2.5 px-3">Printer Access</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50/30 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{emp.emp_id}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{emp.full_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {emp.email}
                    </div>
                  </td>

                  {/* Activated Status: Green Box with 1 (Activated) / Yellow Box with 0 (Not Activated) */}
                  <td className="py-3 px-3 text-center">
                    {emp.is_activated ? (
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span
                          className="w-6 h-6 rounded-md bg-emerald-500 text-white font-mono font-extrabold text-xs inline-flex items-center justify-center shadow-2xs border border-emerald-600"
                          title="Activated (1): User changed default password and set 6-char Quick PIN"
                        >
                          1
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span
                          className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 font-mono font-extrabold text-xs inline-flex items-center justify-center shadow-2xs border border-amber-500"
                          title={`Not Activated (0): Must login with ${emp.emp_id}@2027 and change password immediately`}
                        >
                          0
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Allocated Department Mapper Dropdown */}
                  <td className="py-3 px-3">
                    <select
                      value={emp.department}
                      onChange={(e) => handleChangeEmployeeDept(emp.id, e.target.value)}
                      className="bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 text-blue-900 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                      title="Change allocated faculty department"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.shortcut})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-3 text-slate-600">{emp.designation}</td>

                  {/* Role Badge & Toggle */}
                  <td className="py-3 px-3">
                    {emp.user_type === 'master_admin' || emp.is_master_admin ? (
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border bg-amber-50 text-amber-800 border-amber-300 inline-flex items-center gap-1"
                        title="Master Admin Account (Full Governance Authority)"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        MASTER ADMIN
                      </span>
                    ) : emp.user_type === 'admin' || emp.is_admin ? (
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1"
                        title="Campus Admin Account"
                      >
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        ADMIN
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleEmployee(emp.id, 'role')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border transition cursor-pointer inline-flex items-center gap-1 ${
                          emp.user_type === 'superuser'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle Regular / Superuser role (Superuser enables all privileges automatically)"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {emp.user_type}
                      </button>
                    )}
                  </td>

                  {/* Public Upload Right */}
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleEmployee(emp.id, 'passwordless')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        emp.passwordless_allowed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Click to toggle Public (Passwordless) Upload Permission"
                    >
                      {emp.passwordless_allowed ? (
                        <>
                          <Zap className="w-3 h-3 text-emerald-600" /> Allowed
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" /> PIN Required
                        </>
                      )}
                    </button>
                  </td>

                  {/* Printer Access Right */}
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleEmployee(emp.id, 'printer')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        emp.printer_access_allowed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Click to toggle Printer Access Permission (Allowed / PIN Required)"
                    >
                      {emp.printer_access_allowed ? (
                        <>
                          <Printer className="w-3 h-3 text-emerald-600" /> Allowed
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" /> PIN Required
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions: Green Capsule Edit User Details (includes Trigger Reset Token, Make Admin, Set Password) & Delete */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                      {emp.active_reset_token && (
                        <button
                          type="button"
                          onClick={() => handleCopyResetToken(emp.active_reset_token!)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-extrabold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          title="Click to copy active temporary reset token"
                        >
                          <Copy className="w-3 h-3 text-emerald-600" />
                          <span>{emp.active_reset_token}</span>
                        </button>
                      )}

                      {/* User Details Edit Button in Green Capsule with Pen Icon */}
                      <button
                        onClick={() => openEditUserModal(emp)}
                        className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Edit User Details, Privileges & Password"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-600" />
                        <span>Edit</span>
                      </button>

                      {emp.user_type !== 'master_admin' && !emp.is_master_admin && (
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. User Details Editor Modal (Includes Trigger Reset Token, Make Admin & Set Password Inside) */}
      {editUserTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative text-slate-800">
            <button
              onClick={() => {
                setEditUserTarget(null);
                setShowInlinePasswordEditor(false);
                setNewPassword('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 pr-8">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 inline-flex items-center justify-center">
                  <Edit3 className="w-3.5 h-3.5" />
                </span>
                <span>User Details Editor</span>
              </h3>

              {/* Quick Action Capsules Inside User Details Editor */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {isMasterAdmin &&
                  editUserTarget.user_type !== 'master_admin' &&
                  !editUserTarget.is_master_admin && (
                    <button
                      type="button"
                      onClick={() => handleTriggerResetToken(editUserTarget.emp_id)}
                      className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Master Admin: Trigger a 15-minute temporary password reset token for this employee"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Trigger Reset Token</span>
                    </button>
                  )}

                {isMasterAdmin &&
                  editUserTarget.user_type !== 'master_admin' &&
                  !editUserTarget.is_master_admin && (
                    <button
                      type="button"
                      onClick={() => handleToggleEmployee(editUserTarget.id, 'admin')}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs inline-flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                        editUserTarget.user_type === 'admin' || editUserTarget.is_admin
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                      title={
                        editUserTarget.user_type === 'admin' || editUserTarget.is_admin
                          ? 'Demote / Remove Admin privileges'
                          : 'Promote this user to Campus Admin'
                      }
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {editUserTarget.user_type === 'admin' || editUserTarget.is_admin
                          ? 'Remove Admin'
                          : 'Make Admin'}
                      </span>
                    </button>
                  )}

                {/* Set Password Capsule Button Inside User Details Editor */}
                <button
                  type="button"
                  onClick={() => setShowInlinePasswordEditor((prev) => !prev)}
                  className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Set or Reset User Password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Set Password</span>
                </button>

                {editUserTarget.active_reset_token && (
                  <button
                    type="button"
                    onClick={() => handleCopyResetToken(editUserTarget.active_reset_token!)}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    title="Click to copy active temporary reset token"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editUserTarget.active_reset_token}</span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdateUserDetails} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={editUserEmpId}
                    onChange={(e) => setEditUserEmpId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allocated Department</label>
                  <select
                    value={editUserDept}
                    onChange={(e) => setEditUserDept(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.shortcut})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editUserFullName}
                  onChange={(e) => setEditUserFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editUserDesignation}
                    onChange={(e) => setEditUserDesignation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {!editUserTarget.is_master_admin && editUserTarget.user_type !== 'master_admin' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Role / Access Privilege</label>
                  <select
                    value={editUserRole}
                    onChange={(e) =>
                      setEditUserRole(e.target.value as 'regular' | 'superuser' | 'admin' | 'master_admin')
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="regular">Regular User (6-Char PIN Required)</option>
                    <option value="superuser">Superuser (Public Upload & Printer Access Enabled)</option>
                    {isMasterAdmin && (
                      <option value="admin">Campus Admin (Full Admin Console & Governance)</option>
                    )}
                  </select>
                </div>
              )}

              {/* Embedded Set Password Panel inside User Details Editor */}
              {showInlinePasswordEditor && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>Set New Account Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto-Generate
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      minLength={4}
                      placeholder="Enter new password (e.g., Vault@2026)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={handleResetPasswordSubmit}
                      disabled={!newPassword.trim() || newPassword.trim().length < 4}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer shrink-0"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditUserTarget(null);
                    setShowInlinePasswordEditor(false);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0e3ec7] hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  Save User Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk Upload Users Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative text-slate-800">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pr-8">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Bulk Upload Faculty & Users
              </h3>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Download XLSX Template
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload an Excel (`.xlsx`) or `.csv` file, or paste user records below. Superusers automatically receive Public Upload and Printer Access privileges.
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={bulkFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleBulkFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                className="w-full py-2.5 px-4 border-2 border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select Excel (.xlsx) or CSV File to Parse</span>
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Format: <code className="text-blue-700">EMP_ID, Full Name, Department, Designation, Email, Role (regular/superuser)</code>
                </label>
                <textarea
                  rows={5}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="EMP-3001, Prof. Sarah Lin, Science, Biology Teacher, sarah@campus.edu, superuser"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="px-5 py-2 rounded-xl bg-[#0e3ec7] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {bulkUploading ? 'Importing...' : 'Import Users'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Single Onboard Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative text-slate-800">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Onboard New Faculty / Teacher
            </h3>

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Employee ID *</label>
                  <input
                    type="text"
                    placeholder="EMP-3001"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Allocated Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.shortcut})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="Prof. Sarah Lin"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="sarah@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Designation</label>
                  <input
                    type="text"
                    placeholder="Science Teacher"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Access Privilege Level</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'regular' | 'superuser' | 'admin')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="regular">Regular User (6-Char PIN Required)</option>
                  <option value="superuser">Superuser (Public Upload & Printer Access Enabled)</option>
                  {isMasterAdmin && (
                    <option value="admin">Campus Admin (Full Admin Console & Governance)</option>
                  )}
                </select>
              </div>

              {/* Auto-Assigned Default Initial Password Preview */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>Initial Password (First Login):</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900">
                    <span>Initial Status:</span>
                    <span className="w-5 h-5 rounded bg-amber-400 text-slate-950 font-mono font-extrabold inline-flex items-center justify-center border border-amber-500">
                      0
                    </span>
                  </span>
                </div>
                <div className="font-mono font-extrabold text-sm text-blue-700 bg-white border border-amber-200 rounded-lg px-2.5 py-1">
                  {empId.trim() ? `${empId.trim()}@2027` : 'EMP-ID@2027'}
                </div>
                <p className="text-[10px] text-amber-900 leading-snug">
                  Upon first login with this default password, the employee must immediately set a Google-policy password and a 6-char Quick Login PIN, changing their status to a green box with <strong>1</strong>.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0e3ec7] hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition mt-2 cursor-pointer"
              >
                Save & Onboard Faculty Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
