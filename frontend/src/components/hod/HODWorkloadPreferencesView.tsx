import React, { useState, useMemo } from 'react';
import {
  Scale,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  X,
  Save,
  Check,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { FacultyAdditionalDuty, FinalizedPreferenceItem } from '../../data/workflowDemoData';

export const HODWorkloadPreferencesView: React.FC = () => {
  const {
    departmentFaculty,
    updateFacultyDuties,
    updateDepartmentFacultyFinalizedPreferences,
  } = useWorkflow();

  // Selected faculty for Section B preferences review
  const [selectedPrefFacultyId, setSelectedPrefFacultyId] = useState<string>(
    departmentFaculty[0]?.id || ''
  );

  // Modal state for Adjusting Duties
  const [dutyModalFacultyId, setDutyModalFacultyId] = useState<string | null>(null);
  const [editingDuties, setEditingDuties] = useState<FacultyAdditionalDuty[]>([]);
  const [newDutyTitle, setNewDutyTitle] = useState('');
  const [newDutyHours, setNewDutyHours] = useState<number>(2);

  // Preference finalization feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Selected faculty for preferences
  const activePrefFaculty = useMemo(() => {
    return (
      departmentFaculty.find((f) => f.id === selectedPrefFacultyId) ||
      departmentFaculty[0]
    );
  }, [departmentFaculty, selectedPrefFacultyId]);

  // Selected faculty for duty modal
  const activeDutyFaculty = useMemo(() => {
    if (!dutyModalFacultyId) return null;
    return departmentFaculty.find((f) => f.id === dutyModalFacultyId) || null;
  }, [departmentFaculty, dutyModalFacultyId]);

  // Open duties adjustment modal
  const handleOpenDutyModal = (facId: string) => {
    const fac = departmentFaculty.find((f) => f.id === facId);
    if (fac) {
      setDutyModalFacultyId(facId);
      setEditingDuties([...(fac.additionalDuties || [])]);
      setNewDutyTitle('');
      setNewDutyHours(2);
    }
  };

  // Add duty to modal list
  const handleAddDuty = () => {
    if (!newDutyTitle.trim() || newDutyHours <= 0) return;
    const newDuty: FacultyAdditionalDuty = {
      role: newDutyTitle.trim(),
      hours: Number(newDutyHours),
    };
    setEditingDuties((prev) => [...prev, newDuty]);
    setNewDutyTitle('');
    setNewDutyHours(2);
  };

  // Remove duty from modal list
  const handleRemoveDuty = (index: number) => {
    setEditingDuties((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save duties
  const handleSaveDuties = () => {
    if (dutyModalFacultyId) {
      updateFacultyDuties(dutyModalFacultyId, editingDuties);
      setDutyModalFacultyId(null);
    }
  };

  // Handle finalize preferences for a faculty member
  const handleFinalizePreferences = (facId: string) => {
    const fac = departmentFaculty.find((f) => f.id === facId);
    if (!fac) return;

    // Convert submitted preferences into finalized preferences
    const finalized: FinalizedPreferenceItem[] = fac.preferences.map((p) => ({
      priority: p.priority,
      subjectCode: p.subjectCode,
      subjectTitle: p.subjectTitle,
      approvedBy: 'Dr. Vasudeva (HOD)',
      approvedAt: new Date().toISOString().split('T')[0],
      matchType: 'Preference Match',
    }));

    updateDepartmentFacultyFinalizedPreferences(facId, finalized);
    setSaveSuccessMsg(`Teaching preferences for ${fac.name} approved and finalized!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Reopen preferences for a faculty member
  const handleReopenPreferences = (facId: string) => {
    const fac = departmentFaculty.find((f) => f.id === facId);
    if (!fac) return;
    updateDepartmentFacultyFinalizedPreferences(facId, []);
    setSaveSuccessMsg(`Preferences reopened for ${fac.name} for revision.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Page Title Card */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Academic Load &amp; Subject Mapping Oversight
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
            VTU Compliance
          </span>
        </div>
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
          Faculty Workload &amp; Subject Preferences
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Audit teaching contact hours against statutory VTU norms, administer departmental responsibilities, and review staff subject preferences.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-card flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: WORKLOAD MANAGEMENT TABLE */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        {/* Section A Header & VTU Guidelines banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
                Section A: Faculty Workload Audit &amp; Responsibility Allocation
              </h3>
              <p className="text-[11px] text-ink-muted">
                Statutory VTU weekly contact hour audit including departmental theory, lab sessions, basic science cycles, and assigned duties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 bg-canvas-paper rounded border border-border-subtle text-[11px] font-mono text-ink-muted">
              Prof: <strong className="text-primary font-bold">8–12h</strong> | Assoc Prof: <strong className="text-primary font-bold">10–14h</strong> | Asst Prof: <strong className="text-primary font-bold">14–18h</strong>
            </div>
          </div>
        </div>

        {/* Workload Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Faculty Member</th>
                <th className="p-2.5">Designation</th>
                <th className="p-2.5 text-center">VTU Norm</th>
                <th className="p-2.5 text-center">Theory + Lab</th>
                <th className="p-2.5 text-center">Basic Sci (1st Yr)</th>
                <th className="p-2.5 text-center">Dept Duties</th>
                <th className="p-2.5 text-center">Total Load</th>
                <th className="p-2.5 text-center">Load Status</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {departmentFaculty.map((fac) => {
                const dutiesHours = (fac.additionalDuties || []).reduce(
                  (acc, d) => acc + (d.hours || 0),
                  0
                );
                const teachingHours = (fac.theoryHours || 0) + (fac.labHours || 0);
                const basicSciHours = fac.basicScienceHours || 0;
                const totalWeeklyLoad = teachingHours + basicSciHours + dutiesHours;

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Optimal
                  </span>
                );

                if (totalWeeklyLoad > fac.maxHours) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Overloaded
                    </span>
                  );
                } else if (totalWeeklyLoad < fac.minHours) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Underloaded
                    </span>
                  );
                }

                return (
                  <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-2.5">
                      <div className="font-semibold text-ink">{fac.name}</div>
                      <span className="text-[10px] font-mono text-ink-light">{fac.empId}</span>
                    </td>
                    <td className="p-2.5 text-ink-muted">{fac.designation}</td>
                    <td className="p-2.5 text-center font-mono font-medium text-ink-muted">
                      {fac.normHours}h ({fac.minHours}–{fac.maxHours}h)
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold text-primary">
                      {teachingHours}h <span className="text-[10px] font-normal text-ink-light">({fac.theoryHours}T/{fac.labHours}L)</span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold text-purple-800">
                      {basicSciHours > 0 ? `${basicSciHours}h` : '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold text-amber-800">
                      {dutiesHours > 0 ? (
                        <span title={(fac.additionalDuties || []).map((d) => d.role).join(', ')}>
                          {dutiesHours}h ({fac.additionalDuties?.length || 0})
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-ink">
                      {totalWeeklyLoad} Hrs/Wk
                    </td>
                    <td className="p-2.5 text-center">{statusBadge}</td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDutyModal(fac.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary-subtle rounded border border-primary/20 transition-colors shadow-crisp-sm"
                      >
                        Adjust Duties
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: SUBJECT PREFERENCES REVIEW & HOD FINALIZATION */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        {/* Section B Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
                Section B: Subject Preferences Review &amp; Allocation Finalization
              </h3>
              <p className="text-[11px] text-ink-muted">
                Review submitted teaching course preferences and approve finalized priority mappings for the Department Coordinator.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-canvas-paper border border-border-subtle text-[11px] font-mono text-ink-light">
              Department Faculty: <strong className="text-primary">{departmentFaculty.length}</strong>
            </span>
          </div>
        </div>

        {/* Faculty Selector & Preference Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Faculty Selector List */}
          <div className="border border-border-beige rounded-card p-3 bg-canvas-paper/50 space-y-2">
            <span className="text-[11px] font-mono font-semibold text-ink-muted block uppercase">
              Select Department Faculty
            </span>
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {departmentFaculty.map((fac) => {
                const isSelected = fac.id === activePrefFaculty?.id;
                const isFinalized = (fac.finalizedPreferences || []).length > 0;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => setSelectedPrefFacultyId(fac.id)}
                    className={`w-full text-left p-2 rounded text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-white shadow-crisp-sm font-semibold'
                        : 'bg-white hover:bg-canvas-muted text-ink border border-border-subtle'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{fac.name}</div>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-ink-light'}`}>
                        {fac.designation}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      {isFinalized ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        }`}>
                          Finalized
                        </span>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}>
                          Submitted
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Submitted vs Finalized Preferences for Selected Faculty */}
          <div className="lg:col-span-2 border border-border-beige rounded-card p-4 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div>
                <h4 className="font-headline text-sm font-bold text-primary">
                  {activePrefFaculty?.name} — Teaching Preferences
                </h4>
                <p className="text-[11px] text-ink-muted">
                  {activePrefFaculty?.designation} • {activePrefFaculty?.empId} • Norm: {activePrefFaculty?.normHours}h/week
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {(activePrefFaculty?.finalizedPreferences || []).length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleReopenPreferences(activePrefFaculty.id)}
                    className="px-3 py-1 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded border border-border-beige shadow-crisp-sm transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reopen for Revision</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFinalizePreferences(activePrefFaculty.id)}
                    className="px-3 py-1 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded shadow-crisp-sm transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve &amp; Finalize Preferences</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submitted Preferences Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-ink-light block uppercase font-semibold">
                Submitted Preferences (Priority 1 through 4)
              </span>

              {activePrefFaculty && activePrefFaculty.preferences && activePrefFaculty.preferences.length > 0 ? (
                <div className="overflow-x-auto border border-border-subtle rounded">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-canvas-paper text-[10px] font-mono uppercase text-ink-light border-b border-border-subtle">
                        <th className="p-2 text-center w-16">Priority</th>
                        <th className="p-2">Course Code</th>
                        <th className="p-2">Course Title</th>
                        <th className="p-2 text-center">Past Experience</th>
                        <th className="p-2">Justification / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {activePrefFaculty.preferences.map((p) => (
                        <tr key={p.subjectCode} className="hover:bg-canvas-muted/20">
                          <td className="p-2 text-center">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-primary-subtle text-primary border border-primary/20">
                              P{p.priority}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-semibold text-primary text-[11px]">
                            {p.subjectCode}
                          </td>
                          <td className="p-2 font-medium text-ink">{p.subjectTitle}</td>
                          <td className="p-2 text-center font-mono text-ink-muted text-[11px]">
                            Curricular Core
                          </td>
                          <td className="p-2 text-[11px] text-ink-muted italic">
                            {p.justification || 'Core domain specialization & curriculum research.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-ink-muted border border-dashed border-border-subtle rounded bg-canvas-paper/50">
                  No preferences submitted yet for this faculty member.
                </div>
              )}
            </div>

            {/* Finalized Mapping Status */}
            <div className="p-3 bg-canvas-paper rounded border border-border-subtle text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink text-xs flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  HOD Ratification Status:
                </span>
                {(activePrefFaculty?.finalizedPreferences || []).length > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Approved &amp; Locked for Department Coordinator
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    Awaiting HOD Ratification
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                When ratified, these preferences directly instruct the Automated Subject Allocation engine in the Department Coordinator module to map courses according to HOD-approved faculty priorities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DUTIES ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {dutyModalFacultyId && activeDutyFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full overflow-hidden text-xs text-ink space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  Institutional Responsibility Manager
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Adjust Duties — {activeDutyFaculty.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDutyModalFacultyId(null)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Current duties list */}
              <div className="space-y-2">
                <span className="font-semibold text-[11px] text-ink block">
                  Assigned Responsibilities ({editingDuties.length})
                </span>

                {editingDuties.length > 0 ? (
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                    {editingDuties.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-canvas-paper border border-border-subtle text-xs"
                      >
                        <div>
                          <span className="font-semibold text-ink block">{d.role}</span>
                          <span className="text-[10px] font-mono text-ink-light">
                            Assigned by: HOD
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-mono font-bold text-xs">
                            {d.hours}h / Wk
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDuty(idx)}
                            className="p-1 text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                            title="Remove duty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-ink-muted border border-dashed border-border-subtle rounded">
                    No additional responsibilities currently assigned.
                  </div>
                )}
              </div>

              {/* Add New Duty Form */}
              <div className="p-3 rounded bg-canvas-muted/40 border border-border-subtle space-y-2">
                <span className="font-semibold text-[11px] text-primary flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add New Departmental Responsibility
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] text-ink-light font-mono block mb-1">
                      Responsibility Title
                    </label>
                    <input
                      type="text"
                      value={newDutyTitle}
                      onChange={(e) => setNewDutyTitle(e.target.value)}
                      placeholder="e.g. Timetable Coordinator, NBA Lead"
                      className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-ink-light font-mono block mb-1">
                      Hrs/Week
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={newDutyHours}
                      onChange={(e) => setNewDutyHours(Number(e.target.value))}
                      className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddDuty}
                    disabled={!newDutyTitle.trim()}
                    className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded shadow-crisp-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
                  >
                    Add Duty
                  </button>
                </div>
              </div>

              {/* Recalculated total preview */}
              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle text-xs flex items-center justify-between">
                <span className="text-ink-muted">Recalculated Weekly Load:</span>
                <span className="font-mono font-bold text-ink">
                  {(activeDutyFaculty.theoryHours || 0) +
                    (activeDutyFaculty.labHours || 0) +
                    (activeDutyFaculty.basicScienceHours || 0) +
                    editingDuties.reduce((acc, d) => acc + d.hours, 0)}{' '}
                  Hrs/Week (Norm: {activeDutyFaculty.normHours}h)
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDutyModalFacultyId(null)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDuties}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Workload Adjustment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
