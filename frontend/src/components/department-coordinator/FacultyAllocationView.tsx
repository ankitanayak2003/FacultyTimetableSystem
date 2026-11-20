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
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DepartmentFaculty } from '../../data/workflowDemoData';

const DESIGNATIONS: DepartmentFaculty['designation'][] = [
  'Professor',
  'Associate Professor',
  'Assistant Professor (Sr)',
  'Assistant Professor',
];

const TEACHING_YEARS = ['Second Year', 'Third Year', 'Fourth Year'];

export const FacultyAllocationView: React.FC = () => {
  const {
    departmentFaculty,
    addDepartmentFaculty,
    updateDepartmentFaculty,
    deleteDepartmentFaculty,
    toggleFacultyAccountStatus,
    toggleFacultyLoginAccess,
  } = useWorkflow();

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState<DepartmentFaculty['designation']>('Assistant Professor');
  const [department] = useState('Artificial Intelligence & Data Science');
  const [hasLoginAccess, setHasLoginAccess] = useState(true);
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Inactive'>('Active');
  const [eligibleYears, setEligibleYears] = useState<string[]>(['Second Year', 'Third Year']);
  const [formError, setFormError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setEmpId('');
    setEmail('');
    setDesignation('Assistant Professor');
    setHasLoginAccess(true);
    setAccountStatus('Active');
    setEligibleYears(['Second Year', 'Third Year']);
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
    setHasLoginAccess(fac.hasLoginAccess);
    setAccountStatus(fac.accountStatus);
    setEligibleYears(fac.eligibleYears);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleYear = (year: string) => {
    setEligibleYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    if (eligibleYears.length === 0) {
      setFormError('Please select at least one eligible teaching year.');
      return;
    }

    // Default norms according to designation
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

    if (editingId) {
      updateDepartmentFaculty(editingId, {
        name: name.trim(),
        empId: empId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        designation,
        hasLoginAccess,
        accountStatus,
        eligibleYears,
        normHours: norm,
        minHours: minH,
        maxHours: maxH,
      });
    } else {
      addDepartmentFaculty({
        name: name.trim(),
        empId: empId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        department,
        designation,
        hasLoginAccess,
        accountStatus,
        eligibleYears,
        normHours: norm,
        minHours: minH,
        maxHours: maxH,
        theoryHours: 8,
        labHours: 4,
        basicScienceHours: 0,
        additionalDuties: [],
        preferences: [],
        finalizedPreferences: [],
        assignedCourses: [],
      });
    }

    setIsModalOpen(false);
  };

  // Filtered department faculty
  const filteredFaculty = useMemo(() => {
    return departmentFaculty.filter((fac) => {
      const matchSearch =
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesig =
        filterDesignation === 'All' || fac.designation === filterDesignation;
      const matchStat =
        filterStatus === 'All' || fac.accountStatus === filterStatus;
      return matchSearch && matchDesig && matchStat;
    });
  }, [departmentFaculty, searchQuery, filterDesignation, filterStatus]);

  const activeCount = departmentFaculty.filter((f) => f.accountStatus === 'Active').length;
  const loginCount = departmentFaculty.filter((f) => f.hasLoginAccess).length;

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Header Banner Card (matching Dean layout) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Department Faculty Management
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                AIDS Department
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Faculty Allocation &amp; Access Control
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Maintain department faculty records, assign login credentials, verify teaching year eligibility (2nd, 3rd &amp; 4th Year), and control account status.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department Faculty</span>
          </button>
        </div>

        {/* Quick summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Total Roster
            </span>
            <span className="text-base font-bold text-primary font-mono">
              {departmentFaculty.length}
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
              Basic Science Handled
            </span>
            <span className="text-xs font-semibold text-ink-muted block mt-1">
              1st Year Coordinated
            </span>
          </div>
        </div>
      </div>

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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-ink-muted flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-ink-light" />
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

      {/* Faculty Table (Matching Dean Subject Allocation table design) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="py-2.5 px-3">Faculty Member &amp; ID</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Institutional Email</th>
                <th className="py-2.5 px-3">Eligible Teaching Years</th>
                <th className="py-2.5 px-3 text-center">Login Access</th>
                <th className="py-2.5 px-3 text-center">Account Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    No faculty found matching the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((fac) => (
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

                    {/* Eligible Years */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {fac.eligibleYears.map((yr) => (
                          <span
                            key={yr}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-primary-subtle text-primary border border-primary/10"
                          >
                            {yr.replace(' Year', ' Yr')}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Login Access Toggle */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFacultyLoginAccess(fac.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                          fac.hasLoginAccess
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200'
                        }`}
                        title="Click to toggle faculty portal login permission"
                      >
                        <Key className="w-3 h-3" />
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
                          onClick={() => {
                            if (window.confirm(`Remove ${fac.name} from department roster?`)) {
                              deleteDepartmentFaculty(fac.id);
                            }
                          }}
                          className="p-1.5 text-ink-muted hover:text-crimson hover:bg-crimson/10 rounded transition-colors"
                          title="Delete faculty member"
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
      </div>

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-base font-semibold text-primary">
                  {editingId ? 'Edit Department Faculty Member' : 'Add New Department Faculty Member'}
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

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Faculty Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. FAC109"
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@smvitm.ac.in"
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value as DepartmentFaculty['designation'])}
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-medium"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Department
                </label>
                <input
                  type="text"
                  disabled
                  value={department}
                  className="w-full px-2.5 py-1.5 text-xs bg-canvas-muted rounded border border-border-subtle text-ink-muted font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Eligible Teaching Years * (1st Year coordinated by Basic Science)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TEACHING_YEARS.map((year) => {
                    const isSelected = eligibleYears.includes(year);
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleToggleYear(year)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-canvas text-ink-muted border-border-beige hover:border-primary'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{year}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Portal Login Access
                  </label>
                  <select
                    value={hasLoginAccess ? 'Yes' : 'No'}
                    onChange={(e) => setHasLoginAccess(e.target.value === 'Yes')}
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="Yes">Enabled (Active Login)</option>
                    <option value="No">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Account Status
                  </label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="Active">Active Roster</option>
                    <option value="Inactive">Inactive / On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-beige">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-border-beige hover:bg-canvas-muted text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Add Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
