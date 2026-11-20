import React, { useState } from 'react';
import {
  Building,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Edit2,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const InstitutionalManagementView: React.FC = () => {
  const {
    departments,
    institutionalConfig,
    updateInstitutionalConfig,
    updateDepartmentLeadership,
  } = useWorkflow();

  // Leadership Edit Modal State
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [newHodName, setNewHodName] = useState('');
  const [newCoordinatorName, setNewCoordinatorName] = useState('');

  // Calendar Config Modal State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [configYear, setConfigYear] = useState(institutionalConfig.academicYear);
  const [configSemester, setConfigSemester] = useState(institutionalConfig.currentSemester);
  const [configStartDate, setConfigStartDate] = useState(institutionalConfig.termStartDate);
  const [configEndDate, setConfigEndDate] = useState(institutionalConfig.termEndDate);
  const [configRegulation, setConfigRegulation] = useState(institutionalConfig.vtuRegulation);

  // Success message banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const activeEditingDept = departments.find((d) => d.id === editingDeptId);

  const handleOpenEditDept = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      setEditingDeptId(deptId);
      setNewHodName(dept.hod);
      setNewCoordinatorName(dept.coordinator);
    }
  };

  const handleSaveLeadership = () => {
    if (editingDeptId && (newHodName.trim() || newCoordinatorName.trim())) {
      updateDepartmentLeadership(editingDeptId, {
        hod: newHodName.trim() || undefined,
        coordinator: newCoordinatorName.trim() || undefined,
      });
      setSuccessBanner(`Updated leadership assignments for ${activeEditingDept?.name}!`);
      setTimeout(() => setSuccessBanner(null), 3500);
      setEditingDeptId(null);
    }
  };

  const handleSaveCalendarConfig = () => {
    updateInstitutionalConfig({
      academicYear: configYear,
      currentSemester: configSemester,
      termStartDate: configStartDate,
      termEndDate: configEndDate,
      vtuRegulation: configRegulation,
    });
    setSuccessBanner('Updated institutional academic calendar settings!');
    setTimeout(() => setSuccessBanner(null), 3500);
    setIsCalendarModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Page Header */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Academic Governance
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
                SMVITM Bantakal
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              Institutional Management
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Manage engineering departments, assign Department Coordinators and HODs, and configure institutional academic calendars.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-canvas-paper border border-border-subtle text-[11px] font-mono text-ink-muted">
              Active Stream: <strong className="text-primary font-bold">{institutionalConfig.currentSemester}</strong>
            </span>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-card flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: ACADEMIC CALENDAR & INSTITUTIONAL SETTINGS */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
                Academic Year &amp; Semester Configuration
              </h3>
              <p className="text-[11px] text-ink-muted">
                Statutory academic terms, working periods, and VTU curriculum schemes governing all departmental timetables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfigYear(institutionalConfig.academicYear);
              setConfigSemester(institutionalConfig.currentSemester);
              setConfigStartDate(institutionalConfig.termStartDate);
              setConfigEndDate(institutionalConfig.termEndDate);
              setConfigRegulation(institutionalConfig.vtuRegulation);
              setIsCalendarModalOpen(true);
            }}
            className="px-3 py-1.5 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded shadow-crisp-sm transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Configure Academic Settings</span>
          </button>
        </div>

        {/* Configuration summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">Academic Year</span>
            <span className="font-bold text-ink text-xs block">{institutionalConfig.academicYear}</span>
            <span className="text-[10px] font-mono text-emerald-800">Current Year</span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">Active Semester</span>
            <span className="font-bold text-primary text-xs block">{institutionalConfig.currentSemester}</span>
            <span className="text-[10px] font-mono text-ink-light">Odd Sem Cycle</span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">Term Dates</span>
            <span className="font-semibold text-ink text-xs block truncate">
              {institutionalConfig.termStartDate} to {institutionalConfig.termEndDate}
            </span>
            <span className="text-[10px] font-mono text-ink-light">16 Instructional Wks</span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">Working Days</span>
            <span className="font-bold text-ink text-xs block">
              {institutionalConfig.workingDaysPerWeek} Days / Week
            </span>
            <span className="text-[10px] font-mono text-ink-light">Mon through Sat</span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">Daily Periods</span>
            <span className="font-bold text-ink text-xs block">
              {institutionalConfig.periodsPerDay} Periods / Day
            </span>
            <span className="text-[10px] font-mono text-ink-light">9:00 AM – 4:45 PM</span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle">
            <span className="text-[10px] font-mono text-ink-light block uppercase">VTU Regulation</span>
            <span className="font-semibold text-ink text-xs block truncate" title={institutionalConfig.vtuRegulation}>
              {institutionalConfig.vtuRegulation}
            </span>
            <span className="text-[10px] font-mono text-emerald-800">Certified</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: DEPARTMENT MANAGEMENT & LEADERSHIP TABLE */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
                Department Management &amp; Leadership Assignments
              </h3>
              <p className="text-[11px] text-ink-muted">
                Administer academic leadership, Head of Department (HOD), and Timetable Coordinator assignments for each stream.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-2 py-0.5 rounded bg-canvas-paper border border-border-subtle text-ink-muted">
            5 Academic Departments
          </span>
        </div>

        {/* Departments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Department Name</th>
                <th className="p-2.5">Head of Department (HOD)</th>
                <th className="p-2.5">Timetable Coordinator</th>
                <th className="p-2.5 text-center">Faculty / Students</th>
                <th className="p-2.5 text-center">Scheduling Status</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-canvas-muted/20 transition-colors">
                  <td className="p-2.5 font-mono font-bold text-primary text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-primary-subtle border border-primary/20">
                      {dept.code}
                    </span>
                  </td>

                  <td className="p-2.5">
                    <span className="font-semibold text-ink block">{dept.name}</span>
                    <span className="text-[10px] font-mono text-ink-light">Engineering Division</span>
                  </td>

                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{dept.hod}</span>
                    </div>
                  </td>

                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <Clock className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                      <span>{dept.coordinator}</span>
                    </div>
                  </td>

                  <td className="p-2.5 text-center font-mono">
                    <span className="font-semibold text-ink block">{dept.facultyCount} Faculty</span>
                    <span className="text-[10px] text-ink-light">{dept.studentCount} Students</span>
                  </td>

                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dept.status === 'Published'
                        ? 'bg-purple-50 text-purple-800 border border-purple-300'
                        : dept.status === 'Finalized'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {dept.status}
                    </span>
                  </td>

                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEditDept(dept.id)}
                      className="px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary-subtle rounded border border-primary/20 transition-colors shadow-crisp-sm flex items-center gap-1 ml-auto"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Leadership</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: INSTITUTIONAL LOCK POLICY & GOVERNANCE HIERARCHY */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="font-headline text-sm font-bold text-primary">
            Institutional Lock Policy &amp; Synchronization Hierarchy
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1">
            <div className="font-mono font-bold text-primary text-[11px]">Level 1: Principal &amp; Dean</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Enforces institutional fixed slots (Placement, NSS, Open Electives) and locks the master schedule. Immutable to downstream coordinators.
            </p>
          </div>

          <div className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1">
            <div className="font-mono font-bold text-purple-800 text-[11px]">Level 2: Basic Science</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Basic Science Coordinator generates and locks Physics &amp; Chemistry cycle section schedules, respecting institutional periods.
            </p>
          </div>

          <div className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1">
            <div className="font-mono font-bold text-ink text-[11px]">Level 3: Department &amp; HOD</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Department Coordinators draft 2nd, 3rd, and 4th year class timetables. HODs audit workload equity and endorse section timetables.
            </p>
          </div>

          <div className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1">
            <div className="font-mono font-bold text-emerald-800 text-[11px]">Level 4: Faculty &amp; Student</div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Officially published timetables instantly populate individual faculty teaching rosters and student section portals with 0 clashes.
            </p>
          </div>
        </div>
      </div>

      {/* EDIT LEADERSHIP MODAL */}
      {editingDeptId && activeEditingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  Leadership Reassignment
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  {activeEditingDept.name} ({activeEditingDept.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeptId(null)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  value={newHodName}
                  onChange={(e) => setNewHodName(e.target.value)}
                  className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Department Timetable Coordinator
                </label>
                <input
                  type="text"
                  value={newCoordinatorName}
                  onChange={(e) => setNewCoordinatorName(e.target.value)}
                  className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                />
              </div>

              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle text-[11px] text-ink-muted">
                Assigning academic leadership delegates department timetable authoring and ratification authority in compliance with AQS role-based policies.
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDeptId(null)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLeadership}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Leadership Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR SETTINGS MODAL */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  Institutional Parameters
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Configure Academic Calendar &amp; Regulations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={configYear}
                    onChange={(e) => setConfigYear(e.target.value)}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Active Semester Cycle
                  </label>
                  <select
                    value={configSemester}
                    onChange={(e) => setConfigSemester(e.target.value as 'Odd Semester' | 'Even Semester')}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                  >
                    <option value="Odd Semester">Odd Semester (Sem 1, 3, 5, 7)</option>
                    <option value="Even Semester">Even Semester (Sem 2, 4, 6, 8)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Term Commencement Date
                  </label>
                  <input
                    type="date"
                    value={configStartDate}
                    onChange={(e) => setConfigStartDate(e.target.value)}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Term Conclusion Date
                  </label>
                  <input
                    type="date"
                    value={configEndDate}
                    onChange={(e) => setConfigEndDate(e.target.value)}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  VTU Curriculum Framework / Scheme
                </label>
                <input
                  type="text"
                  value={configRegulation}
                  onChange={(e) => setConfigRegulation(e.target.value)}
                  className="w-full bg-white border border-border-beige rounded px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-primary font-medium"
                />
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCalendarConfig}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Academic Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
