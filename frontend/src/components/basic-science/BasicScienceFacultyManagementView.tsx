import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  Key,
  Users,
  Atom,
  FlaskConical,
  Calculator,
  Loader2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DepartmentFaculty } from '../../data/workflowDemoData';

const DESIGNATIONS: DepartmentFaculty['designation'][] = [
  'Professor',
  'Associate Professor',
  'Assistant Professor (Sr)',
  'Assistant Professor',
];

const BASIC_SCIENCE_DEPTS = [
  { id: 'dept_math', code: 'MATH', name: 'Mathematics', label: 'Mathematics' },
  { id: 'dept_physics', code: 'PHY', name: 'Physics', label: 'Physics' },
  { id: 'dept_chemistry', code: 'CHEM', name: 'Chemistry', label: 'Chemistry' },
];

export const BasicScienceFacultyManagementView: React.FC = () => {
  const {
    basicScienceFaculty,
    addBasicScienceFaculty,
    updateBasicScienceFaculty,
    deleteBasicScienceFaculty,
    toggleFacultyAccountStatus,
    provisionFacultyLogin,
  } = useWorkflow();

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState<DepartmentFaculty['designation']>('Assistant Professor');
  const [departmentId, setDepartmentId] = useState('dept_math');
  const [hasLoginAccess, setHasLoginAccess] = useState(true);
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('All');
  const [filterDesignation, setFilterDesignation] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmpId('');
    setEmail('');
    setDesignation('Assistant Professor');
    setDepartmentId('dept_math');
    setHasLoginAccess(true);
    setAccountStatus('Active');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (fac: DepartmentFaculty) => {
    setEditingId(fac.id);
    setName(fac.name);
    setEmpId(fac.empId);
    setEmail(fac.email);
    setDesignation(fac.designation);
    // Resolve matching basic science department ID
    const rawDept = (fac.department || '').toLowerCase();
    if (rawDept.includes('phys')) {
      setDepartmentId('dept_physics');
    } else if (rawDept.includes('chem')) {
      setDepartmentId('dept_chemistry');
    } else {
      setDepartmentId('dept_math');
    }
    setHasLoginAccess(fac.hasLoginAccess);
    setAccountStatus(fac.accountStatus);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter faculty name.');
      return;
    }
    if (!empId.trim()) {
      setFormError('Please enter employee ID.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid official institutional email.');
      return;
    }

    let norm = 18;
    let minH = 16;
    let maxH = 20;
    if (designation === 'Professor') {
      norm = 14;
      minH = 12;
      maxH = 16;
    } else if (designation === 'Associate Professor') {
      norm = 16;
      minH = 14;
      maxH = 18;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingId) {
        await updateBasicScienceFaculty(editingId, {
          name: name.trim(),
          empId: empId.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          department: departmentId,
          designation,
          hasLoginAccess,
          accountStatus,
          eligibleYears: ['First Year'],
          normHours: norm,
          minHours: minH,
          maxHours: maxH,
        });
        setActionSuccessMsg(`Successfully updated faculty record for ${name.trim()}.`);
      } else {
        await addBasicScienceFaculty({
          name: name.trim(),
          empId: empId.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          department: departmentId,
          designation,
          hasLoginAccess,
          accountStatus,
          eligibleYears: ['First Year'],
          normHours: norm,
          minHours: minH,
          maxHours: maxH,
          theoryHours: 8,
          labHours: 4,
          basicScienceHours: 12,
          additionalDuties: [],
          preferences: [],
          finalizedPreferences: [],
          assignedCourses: [],
        });
        setActionSuccessMsg(`Successfully registered Basic Science faculty member ${name.trim()}.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save faculty record to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLoginAccess = async (fac: DepartmentFaculty) => {
    const nextAccess = !fac.hasLoginAccess;
    setProvisioningId(fac.id);
    setActionSuccessMsg('');
    try {
      await provisionFacultyLogin(fac.id, nextAccess);
      setActionSuccessMsg(
        nextAccess
          ? `Portal login successfully provisioned for ${fac.name} (${fac.email}).`
          : `Portal login access revoked for ${fac.name}.`
      );
    } catch (err: any) {
      alert(`Login provisioning failed: ${err?.message || err}`);
    } finally {
      setProvisioningId(null);
    }
  };

  const handleDelete = async (fac: DepartmentFaculty) => {
    if (!window.confirm(`Remove ${fac.name} from the Basic Science faculty roster?`)) {
      return;
    }
    setActionSuccessMsg('');
    try {
      await deleteBasicScienceFaculty(fac.id);
      setActionSuccessMsg(`Removed ${fac.name} from Basic Science roster.`);
    } catch (err: any) {
      // If active allotments exist (409 Conflict), suggest deactivation (soft delete)
      const isConflict = String(err?.message || '').includes('409') || String(err?.message || '').includes('Active course allotments');
      if (isConflict) {
        const deactivateConfirm = window.confirm(
          `Cannot delete ${fac.name} because active course allotments or timetable slots are assigned.\n\n` +
          `Would you like to safely deactivate their account status instead? (This soft-deletes access while preserving historical timetable records)`
        );
        if (deactivateConfirm) {
          toggleFacultyAccountStatus(fac.id);
          setActionSuccessMsg(`Deactivated account status for ${fac.name}. Timetable assignments preserved.`);
        }
      } else {
        alert(`Deletion error: ${err?.message || err}`);
      }
    }
  };

  // Filtered Basic Science faculty
  const filteredFaculty = useMemo(() => {
    return basicScienceFaculty.filter((fac) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        fac.name.toLowerCase().includes(q) ||
        fac.empId.toLowerCase().includes(q) ||
        fac.email.toLowerCase().includes(q);

      const matchDesig =
        filterDesignation === 'All' || fac.designation === filterDesignation;

      const matchStat =
        filterStatus === 'All' || fac.accountStatus === filterStatus;

      let matchDiscipline = true;
      const deptStr = (fac.department || '').toLowerCase();
      if (filterDiscipline === 'Mathematics') {
        matchDiscipline = deptStr.includes('math');
      } else if (filterDiscipline === 'Physics') {
        matchDiscipline = deptStr.includes('phys');
      } else if (filterDiscipline === 'Chemistry') {
        matchDiscipline = deptStr.includes('chem');
      }

      return matchSearch && matchDesig && matchStat && matchDiscipline;
    });
  }, [basicScienceFaculty, searchQuery, filterDesignation, filterStatus, filterDiscipline]);

  const activeCount = basicScienceFaculty.filter((f) => f.accountStatus === 'Active').length;
  const loginCount = basicScienceFaculty.filter((f) => f.hasLoginAccess).length;
  const mathCount = basicScienceFaculty.filter((f) => (f.department || '').toLowerCase().includes('math')).length;
  const phyCount = basicScienceFaculty.filter((f) => (f.department || '').toLowerCase().includes('phys')).length;
  const chemCount = basicScienceFaculty.filter((f) => (f.department || '').toLowerCase().includes('chem')).length;

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Header Banner Card (matching Department Coordinator layout) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Basic Science Coordinator Module
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                Mathematics • Physics • Chemistry
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Basic Science Faculty Management &amp; Access Control
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Register foundational faculty members, provision secure Firebase portal login credentials, control active status, and maintain instructional rosters.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Basic Science Faculty</span>
          </button>
        </div>

        {/* Quick summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-0.5">
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Total BS Roster
            </span>
            <span className="text-base font-bold text-primary font-mono">
              {basicScienceFaculty.length}
            </span>
          </div>
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Active Status
            </span>
            <span className="text-base font-bold text-emerald-800 font-mono">
              {activeCount}
            </span>
          </div>
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Portal Logins
            </span>
            <span className="text-base font-bold text-primary font-mono">
              {loginCount}
            </span>
          </div>
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Mathematics / Physics
            </span>
            <span className="text-xs font-semibold text-ink-muted block mt-1 font-mono">
              {mathCount} Math • {phyCount} Phy
            </span>
          </div>
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Chemistry
            </span>
            <span className="text-xs font-semibold text-ink-muted block mt-1 font-mono">
              {chemCount} Faculty
            </span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp-sm flex flex-col sm:flex-row items-center gap-2.5 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-light" />
          <input
            type="text"
            placeholder="Search faculty name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Discipline Filter */}
          <div className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-ink-light" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Discipline:</span>
          </div>
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
          >
            <option value="All">All Disciplines</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
          </select>

          {/* Designation Filter */}
          <div className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0 ml-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Designation:</span>
          </div>
          <select
            value={filterDesignation}
            onChange={(e) => setFilterDesignation(e.target.value)}
            className="px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
          >
            <option value="All">All Designations</option>
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0 ml-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="py-2.5 px-3">Faculty Member &amp; ID</th>
                <th className="py-2.5 px-3">Discipline</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Institutional Email</th>
                <th className="py-2.5 px-3 text-center">Login Access</th>
                <th className="py-2.5 px-3 text-center">Account Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    No Basic Science faculty found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((fac) => {
                  const deptLower = (fac.department || '').toLowerCase();
                  const isMath = deptLower.includes('math');
                  const isPhy = deptLower.includes('phys');
                  const isChem = deptLower.includes('chem');

                  return (
                    <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                      {/* Faculty & ID */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span>{fac.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-ink-light">
                          {fac.empId}
                        </span>
                      </td>

                      {/* Discipline Badge */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                            isMath
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : isPhy
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : isChem
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-canvas-muted text-ink border-border-subtle'
                          }`}
                        >
                          {isMath ? (
                            <Calculator className="w-3 h-3" />
                          ) : isPhy ? (
                            <Atom className="w-3 h-3" />
                          ) : isChem ? (
                            <FlaskConical className="w-3 h-3" />
                          ) : null}
                          <span>{fac.department}</span>
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-canvas-muted text-ink">
                          {fac.designation}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted">
                        {fac.email}
                      </td>

                      {/* Login Access Toggle (Firebase Auth Provisioning) */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={provisioningId === fac.id}
                          onClick={() => handleToggleLoginAccess(fac)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                            fac.hasLoginAccess
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200'
                          }`}
                          title="Click to provision or revoke Firebase Authentication login access"
                        >
                          {provisioningId === fac.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Key className="w-3 h-3" />
                          )}
                          <span>{fac.hasLoginAccess ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Account Status Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFacultyAccountStatus(fac.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                            fac.accountStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle active/inactive account status"
                        >
                          {fac.accountStatus === 'Active' ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          <span>{fac.accountStatus}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(fac)}
                            className="p-1.5 text-ink-muted hover:text-primary hover:bg-canvas-muted rounded transition-colors"
                            title="Edit faculty details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(fac)}
                            className="p-1.5 text-ink-muted hover:text-crimson hover:bg-crimson/10 rounded transition-colors"
                            title="Delete faculty member (or soft-deactivate if active timetable links exist)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-base font-semibold text-primary">
                  {editingId ? 'Edit Basic Science Faculty Member' : 'Add New Basic Science Faculty Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ravindra Shenoy"
                  className="w-full px-3 py-1.5 bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Employee ID <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. BS101"
                    className="w-full px-3 py-1.5 bg-canvas rounded border border-border-beige text-ink font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Discipline / Department <span className="text-primary">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                  >
                    {BASIC_SCIENCE_DEPTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} ({d.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Institutional Email <span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ravindra.math@sode-edu.in"
                  className="w-full px-3 py-1.5 bg-canvas rounded border border-border-beige text-ink font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Designation <span className="text-primary">*</span>
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value as DepartmentFaculty['designation'])}
                  className="w-full px-3 py-1.5 bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border-beige">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Login Access Permission
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={hasLoginAccess}
                      onChange={(e) => setHasLoginAccess(e.target.checked)}
                      className="rounded border-border-beige text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-ink font-medium">Provision Firebase Login</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Account Status
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={accountStatus === 'Active'}
                      onChange={(e) => setAccountStatus(e.target.checked ? 'Active' : 'Inactive')}
                      className="rounded border-border-beige text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-ink font-medium">Active Status</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-beige">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded border border-border-beige text-ink hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white transition-colors shadow-crisp-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Update Faculty' : 'Register Faculty'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
