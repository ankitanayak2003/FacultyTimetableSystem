import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

interface CrossDeptAssignment {
  facultyName: string;
  homeDepartment: string;
  assignedDepartment: string;
  courseCode: string;
  courseTitle: string;
  weeklyHours: number;
}

export const PrincipalFacultyManagementView: React.FC = () => {
  const {
    departmentFaculty,
    toggleFacultyAccountStatus,
    toggleFacultyLoginAccess,
  } = useWorkflow();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('All');
  const [crossDeptOnly, setCrossDeptOnly] = useState(false);

  // Institution departments list
  const departmentsList = [
    'All',
    'Artificial Intelligence & Data Science',
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Information Science & Engineering',
    'Mechanical Engineering',
    'Basic Science',
  ];

  // Specific verified Cross-Department Teaching Assignments across SMVITM
  const crossDepartmentAssignments: CrossDeptAssignment[] = [
    {
      facultyName: 'Dr. Vasudeva',
      homeDepartment: 'Artificial Intelligence & Data Science',
      assignedDepartment: 'Computer Science & Engineering (4th Year)',
      courseCode: '21CS71',
      courseTitle: 'Deep Learning & Neural Networks',
      weeklyHours: 3,
    },
    {
      facultyName: 'Dr. Ravindra Shenoy',
      homeDepartment: 'Basic Science (Physics)',
      assignedDepartment: 'AIDS & CSE (1st Year Physics Cycle)',
      courseCode: '21PHY12',
      courseTitle: 'Engineering Physics',
      weeklyHours: 4,
    },
    {
      facultyName: 'Dr. Bhagya',
      homeDepartment: 'Basic Science (Mathematics)',
      assignedDepartment: 'Artificial Intelligence & Data Science (3rd Sem)',
      courseCode: 'BCS301',
      courseTitle: 'Mathematics for Computer Science',
      weeklyHours: 4,
    },
    {
      facultyName: 'Dr. K. K. Srinivasan',
      homeDepartment: 'Basic Science (Chemistry)',
      assignedDepartment: 'ECE & MECH (1st Year Chem Cycle)',
      courseCode: '21CHE12',
      courseTitle: 'Engineering Chemistry',
      weeklyHours: 4,
    },
    {
      facultyName: 'Prof. Rajesh Shetty',
      homeDepartment: 'Artificial Intelligence & Data Science',
      assignedDepartment: 'Basic Science (Physics Cycle - Sec A)',
      courseCode: '21PSP13',
      courseTitle: 'C Programming for Problem Solving',
      weeklyHours: 3,
    },
  ];

  // Unified Institution Faculty List mapping
  const unifiedFacultyList = useMemo(() => {
    return departmentFaculty.map((fac) => {
      // Find cross-dept assignments
      const crossAssignments = crossDepartmentAssignments.filter(
        (c) => c.facultyName.toLowerCase() === fac.name.toLowerCase()
      );

      const isCross = crossAssignments.length > 0 || fac.basicScienceHours > 0;
      const dutiesHours = (fac.additionalDuties || []).reduce((acc, d) => acc + d.hours, 0);
      const totalHours = (fac.theoryHours || 0) + (fac.labHours || 0) + (fac.basicScienceHours || 0) + dutiesHours;

      return {
        ...fac,
        crossAssignments,
        isCrossDepartment: isCross,
        totalHours,
      };
    });
  }, [departmentFaculty]);

  // Filtered Faculty List
  const filteredFaculty = useMemo(() => {
    return unifiedFacultyList.filter((fac) => {
      // Department Filter
      const matchesDept =
        selectedDeptFilter === 'All' ||
        fac.department.toLowerCase().includes(selectedDeptFilter.toLowerCase()) ||
        (selectedDeptFilter === 'Basic Science' && fac.basicScienceHours > 0);

      // Designation Filter
      const matchesDesig =
        selectedDesignationFilter === 'All' ||
        fac.designation.toLowerCase().includes(selectedDesignationFilter.toLowerCase());

      // Cross-Department Filter
      const matchesCross = !crossDeptOnly || fac.isCrossDepartment;

      // Search Term
      const matchesSearch =
        fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac.department.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDept && matchesDesig && matchesCross && matchesSearch;
    });
  }, [
    unifiedFacultyList,
    selectedDeptFilter,
    selectedDesignationFilter,
    crossDeptOnly,
    searchTerm,
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = unifiedFacultyList.length;
    const activeAccounts = unifiedFacultyList.filter((f) => f.accountStatus === 'Active').length;
    const totalTeachingHours = unifiedFacultyList.reduce((acc, f) => acc + f.totalHours, 0);
    const avgLoad = totalCount > 0 ? (totalTeachingHours / totalCount).toFixed(1) : '0';
    const crossDeptCount = unifiedFacultyList.filter((f) => f.isCrossDepartment).length;

    return {
      totalCount,
      activeAccounts,
      avgLoad,
      crossDeptCount,
    };
  }, [unifiedFacultyList]);

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Header Banner */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Staff Governance
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
                AICTE &amp; VTU Compliance
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              Institution-Wide Faculty Management
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Inspect faculty teaching allocations across engineering departments, audit cross-department assignments, and administer institutional account permissions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 rounded bg-canvas-paper border border-border-subtle text-[11px] font-mono text-ink-muted">
              Roster: <strong className="text-primary font-bold">{metrics.totalCount} Staff</strong>
            </div>
            <div className="px-2.5 py-1 rounded bg-canvas-paper border border-border-subtle text-[11px] font-mono text-ink-muted">
              Avg Load: <strong className="text-ink font-bold">{metrics.avgLoad}h / Wk</strong>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm space-y-3 text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-light" />
            <input
              type="text"
              placeholder="Search faculty by name, employee ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-hidden focus:border-primary font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto flex-wrap">
            {/* Department Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-white border border-border-beige rounded px-2.5 py-1 text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">Designation:</span>
              <select
                value={selectedDesignationFilter}
                onChange={(e) => setSelectedDesignationFilter(e.target.value)}
                className="bg-white border border-border-beige rounded px-2.5 py-1 text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
              >
                <option value="All">All Designations</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
              </select>
            </div>

            {/* Cross-Department Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium text-ink bg-canvas-paper px-2.5 py-1 rounded border border-border-subtle hover:bg-canvas-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={crossDeptOnly}
                onChange={(e) => setCrossDeptOnly(e.target.checked)}
                className="rounded border-border-beige text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3 text-primary" />
                Cross-Dept Only ({metrics.crossDeptCount})
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* INSTITUTION-WIDE FACULTY TABLE */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm font-bold text-primary">
              Faculty Roster &amp; Allocation Audit ({filteredFaculty.length} Results)
            </h3>
          </div>

          <span className="text-[11px] font-mono text-ink-light">
            Active Accounts: {metrics.activeAccounts} / {metrics.totalCount}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Faculty Member</th>
                <th className="p-2.5">Department &amp; Designation</th>
                <th className="p-2.5 text-center">VTU Norm</th>
                <th className="p-2.5 text-center">Contact Hours</th>
                <th className="p-2.5">Cross-Dept Teaching</th>
                <th className="p-2.5 text-center">Compliance</th>
                <th className="p-2.5 text-center">Account Status</th>
                <th className="p-2.5 text-center">Portal Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredFaculty.map((fac) => {
                const isOver = fac.totalHours > fac.maxHours;
                const isUnder = fac.totalHours < fac.minHours;

                return (
                  <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-2.5">
                      <div className="font-semibold text-ink">{fac.name}</div>
                      <div className="text-[10px] font-mono text-ink-light">
                        {fac.empId} • {fac.email}
                      </div>
                    </td>

                    <td className="p-2.5">
                      <span className="font-medium text-ink block">{fac.designation}</span>
                      <span className="text-[10px] font-mono text-primary font-semibold">
                        {fac.department}
                      </span>
                    </td>

                    <td className="p-2.5 text-center font-mono text-ink-muted">
                      {fac.normHours}h ({fac.minHours}–{fac.maxHours}h)
                    </td>

                    <td className="p-2.5 text-center font-mono">
                      <span className="font-bold text-ink text-xs block">{fac.totalHours} Hrs/Wk</span>
                      <span className="text-[10px] text-ink-light">
                        ({fac.theoryHours}T / {fac.labHours}L
                        {fac.basicScienceHours > 0 ? ` / ${fac.basicScienceHours}BS` : ''})
                      </span>
                    </td>

                    <td className="p-2.5">
                      {fac.crossAssignments.length > 0 ? (
                        <div className="space-y-1">
                          {fac.crossAssignments.map((ca, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-300 font-mono text-[9px] font-bold">
                                {ca.courseCode}
                              </span>
                              <span className="text-ink-muted truncate max-w-[180px]" title={`${ca.courseTitle} (${ca.assignedDepartment})`}>
                                {ca.assignedDepartment.split(' ')[0]} ({ca.weeklyHours}h)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : fac.basicScienceHours > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 text-purple-800 border border-purple-300">
                          1st Year Basic Sci ({fac.basicScienceHours}h)
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-light font-mono">— Home Dept Only —</span>
                      )}
                    </td>

                    <td className="p-2.5 text-center">
                      {isOver ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Overloaded
                        </span>
                      ) : isUnder ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Underloaded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Optimal
                        </span>
                      )}
                    </td>

                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFacultyAccountStatus(fac.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                          fac.accountStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                        }`}
                        title="Click to toggle account status"
                      >
                        {fac.accountStatus}
                      </button>
                    </td>

                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFacultyLoginAccess(fac.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                          fac.hasLoginAccess
                            ? 'bg-primary-subtle text-primary border border-primary/30 hover:bg-amber-50 hover:text-amber-800'
                            : 'bg-canvas-muted text-ink-muted border border-border-subtle hover:bg-primary-subtle hover:text-primary'
                        }`}
                        title="Click to toggle faculty login portal access"
                      >
                        {fac.hasLoginAccess ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
