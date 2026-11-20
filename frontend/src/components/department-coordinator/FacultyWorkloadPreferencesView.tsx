import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  BookOpen,
  Edit3,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import {
  DepartmentFaculty,
  FinalizedPreferenceItem,
} from '../../data/workflowDemoData';

export const FacultyWorkloadPreferencesView: React.FC = () => {
  const {
    departmentFaculty,
    updateDepartmentFacultyFinalizedPreferences,
  } = useWorkflow();

  // Section toggle: 'workload' | 'preferences'
  const [activeSubTab, setActiveSubTab] = useState<'workload' | 'preferences'>('workload');

  // Configurable Norms state
  const [norms, setNorms] = useState({
    Professor: { norm: 14, min: 12, max: 16 },
    'Associate Professor': { norm: 16, min: 14, max: 18 },
    'Assistant Professor (Sr)': { norm: 18, min: 16, max: 20 },
    'Assistant Professor': { norm: 18, min: 16, max: 20 },
  });
  const [isEditingNorms, setIsEditingNorms] = useState(false);

  // Preference approval modal state
  const [selectedFacultyForPref, setSelectedFacultyForPref] = useState<DepartmentFaculty | null>(null);
  const [draftFinalized, setDraftFinalized] = useState<FinalizedPreferenceItem[]>([]);
  const [prefSuccessMsg, setPrefSuccessMsg] = useState('');

  // Handle open approval modal
  const handleOpenPrefApproval = (fac: DepartmentFaculty) => {
    setSelectedFacultyForPref(fac);
    if (fac.finalizedPreferences && fac.finalizedPreferences.length > 0) {
      setDraftFinalized([...fac.finalizedPreferences]);
    } else {
      // Pre-fill from submitted preferences
      const autoFilled: FinalizedPreferenceItem[] = fac.preferences.map((p) => ({
        priority: p.priority,
        subjectCode: p.subjectCode,
        subjectTitle: p.subjectTitle,
        approvedBy: 'Prof. Rajesh Shetty',
        approvedAt: new Date().toISOString().split('T')[0],
        matchType: 'Preference Match',
      }));
      setDraftFinalized(autoFilled);
    }
  };

  const handleSaveFinalized = () => {
    if (!selectedFacultyForPref) return;
    updateDepartmentFacultyFinalizedPreferences(selectedFacultyForPref.id, draftFinalized);
    setSelectedFacultyForPref(null);
    setPrefSuccessMsg(`Finalized preferences updated for ${selectedFacultyForPref.name}`);
    setTimeout(() => setPrefSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Academic Resource &amp; Load Distribution
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                Norms &amp; Preferences
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Faculty Workload &amp; Subject Preferences
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Verify compliance with VTU/AICTE weekly workload norms, review Basic Science commitments, and finalize 3-tier subject preferences.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="inline-flex rounded-card bg-canvas-muted p-1 border border-border-beige flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('workload')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'workload'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Workload Norms &amp; Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('preferences')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'preferences'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Subject Preferences Review
            </button>
          </div>
        </div>

        {prefSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{prefSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* VIEW 1: WORKLOAD NORMS & SUMMARY */}
      {activeSubTab === 'workload' && (
        <div className="space-y-4">
          {/* Configurable Norms Card */}
          <div className="p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
                  Configurable Workload Calculation Norms (VTU Blueprint)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNorms(!isEditingNorms)}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingNorms ? 'Done Adjusting' : 'Configure Norms'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Professor */}
              <div className="p-3 bg-canvas-paper rounded-card border border-border-beige">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-primary">Professor</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary-subtle text-primary font-semibold">
                    Norm: {norms.Professor.norm} hrs/wk
                  </span>
                </div>
                {isEditingNorms ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Min Hours</span>
                      <input
                        type="number"
                        value={norms.Professor.min}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            Professor: { ...norms.Professor, min: Number(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Max Hours</span>
                      <input
                        type="number"
                        value={norms.Professor.max}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            Professor: { ...norms.Professor, max: Number(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Min requirement: <strong className="text-ink">{norms.Professor.min} hrs</strong> • Max quota: <strong className="text-ink">{norms.Professor.max} hrs</strong>
                  </p>
                )}
              </div>

              {/* Associate Professor */}
              <div className="p-3 bg-canvas-paper rounded-card border border-border-beige">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-primary">Associate Professor</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary-subtle text-primary font-semibold">
                    Norm: {norms['Associate Professor'].norm} hrs/wk
                  </span>
                </div>
                {isEditingNorms ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Min Hours</span>
                      <input
                        type="number"
                        value={norms['Associate Professor'].min}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            'Associate Professor': {
                              ...norms['Associate Professor'],
                              min: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Max Hours</span>
                      <input
                        type="number"
                        value={norms['Associate Professor'].max}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            'Associate Professor': {
                              ...norms['Associate Professor'],
                              max: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Min requirement: <strong className="text-ink">{norms['Associate Professor'].min} hrs</strong> • Max quota: <strong className="text-ink">{norms['Associate Professor'].max} hrs</strong>
                  </p>
                )}
              </div>

              {/* Assistant Professor */}
              <div className="p-3 bg-canvas-paper rounded-card border border-border-beige">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-primary">Assistant Professor</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary-subtle text-primary font-semibold">
                    Norm: {norms['Assistant Professor'].norm} hrs/wk
                  </span>
                </div>
                {isEditingNorms ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Min Hours</span>
                      <input
                        type="number"
                        value={norms['Assistant Professor'].min}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            'Assistant Professor': {
                              ...norms['Assistant Professor'],
                              min: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-light block font-mono">Max Hours</span>
                      <input
                        type="number"
                        value={norms['Assistant Professor'].max}
                        onChange={(e) =>
                          setNorms({
                            ...norms,
                            'Assistant Professor': {
                              ...norms['Assistant Professor'],
                              max: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Min requirement: <strong className="text-ink">{norms['Assistant Professor'].min} hrs</strong> • Max quota: <strong className="text-ink">{norms['Assistant Professor'].max} hrs</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Faculty Workload Table */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
            <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
              <span className="font-headline font-semibold text-primary">
                Weekly Faculty Workload Distribution &amp; Balance Table
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                Formula: Dept Teaching + Basic Science + Duties = Total Workload
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                    <th className="py-2.5 px-3">Faculty Member</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-center">Norm / Range</th>
                    <th className="py-2.5 px-3 text-center">Dept Teaching</th>
                    <th className="py-2.5 px-3 text-center">Basic Science</th>
                    <th className="py-2.5 px-3 text-center">Inst. Duties</th>
                    <th className="py-2.5 px-3 text-center font-bold text-primary">Total Load</th>
                    <th className="py-2.5 px-3 text-center">Remaining Capacity</th>
                    <th className="py-2.5 px-3 text-center">Load Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {departmentFaculty.map((fac) => {
                    const teachingHours = fac.theoryHours + fac.labHours;
                    const dutyHours = fac.additionalDuties.reduce((acc, d) => acc + d.hours, 0);
                    const totalHours = teachingHours + fac.basicScienceHours + dutyHours;
                    const remainingCapacity = fac.maxHours - totalHours;

                    let statusType: 'Under-allocated' | 'Optimal' | 'Over-allocated' = 'Optimal';
                    if (totalHours < fac.minHours) statusType = 'Under-allocated';
                    if (totalHours > fac.maxHours) statusType = 'Over-allocated';

                    return (
                      <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-ink block">{fac.name}</span>
                          <span className="text-[10px] font-mono text-ink-light">{fac.empId}</span>
                        </td>

                        <td className="py-2.5 px-3 text-ink-muted">
                          {fac.designation}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                          {fac.normHours} ({fac.minHours}–{fac.maxHours})
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="font-semibold text-ink">{teachingHours}h</span>
                          <span className="text-[10px] text-ink-light block">({fac.theoryHours}T + {fac.labHours}L)</span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          {fac.basicScienceHours > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-900 border border-purple-200 font-bold" title="Committed to Basic Science First Year">
                              🔒 {fac.basicScienceHours}h
                            </span>
                          ) : (
                            <span className="text-ink-light">0h</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          {dutyHours > 0 ? (
                            <span className="text-ink" title={fac.additionalDuties.map((d) => `${d.role}: ${d.hours}h`).join('\n')}>
                              {dutyHours}h
                            </span>
                          ) : (
                            <span className="text-ink-light">0h</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-xs font-bold text-primary">
                          {totalHours} hrs/wk
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono">
                          <span
                            className={`font-semibold ${
                              remainingCapacity < 0
                                ? 'text-rose-700'
                                : remainingCapacity === 0
                                ? 'text-ink-muted'
                                : 'text-emerald-700'
                            }`}
                          >
                            {remainingCapacity > 0 ? `+${remainingCapacity}h` : `${remainingCapacity}h`}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                              statusType === 'Optimal'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : statusType === 'Under-allocated'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {statusType}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FACULTY SUBJECT PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-4">
          <div className="p-3 bg-canvas-muted rounded-card border border-border-beige text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Review faculty 3-tier subject preferences (Priority 1, 2, 3) and authorize HOD/Coordinator-finalized allocations.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-primary text-white rounded font-bold uppercase tracking-wider">
              {departmentFaculty.length} Faculty Records
            </span>
          </div>

          <div className="space-y-3">
            {departmentFaculty.map((fac) => {
              const hasFinalized = fac.finalizedPreferences && fac.finalizedPreferences.length > 0;
              return (
                <div
                  key={fac.id}
                  className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-semibold text-sm sm:text-base text-primary">
                          {fac.name}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas-muted text-ink-muted">
                          {fac.empId}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-primary-subtle text-primary font-semibold">
                          {fac.designation}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Current Assignments: {fac.assignedCourses.join(', ') || 'No active courses assigned'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPrefApproval(fac)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary transition-colors flex-shrink-0 shadow-crisp-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{hasFinalized ? 'Modify Finalized Preferences' : 'Approve & Finalize Preferences'}</span>
                    </button>
                  </div>

                  {/* Comparison: Faculty Preferences vs Approved Finalized */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Left: Faculty Selected (Original) */}
                    <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light font-bold">
                          1. Faculty-Submitted Preferences
                        </span>
                        <span className="text-[10px] font-mono text-ink-muted">
                          {fac.preferences.length} Choices Submitted
                        </span>
                      </div>

                      {fac.preferences.length === 0 ? (
                        <p className="text-ink-muted text-[11px] italic py-2">
                          No preference choices submitted yet by faculty.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {fac.preferences.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded bg-canvas border border-border-beige flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-primary text-white">
                                    Priority {p.priority}
                                  </span>
                                  <span className="font-mono font-semibold text-primary">{p.subjectCode}</span>
                                </div>
                                <p className="text-[11px] font-medium text-ink mt-0.5">{p.subjectTitle}</p>
                                {p.justification && (
                                  <p className="text-[10px] text-ink-muted italic mt-0.5">"{p.justification}"</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: HOD / Coordinator Finalized */}
                    <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                          2. HOD / Coordinator Finalized Allocation
                        </span>
                        {hasFinalized ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Approved
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Finalization
                          </span>
                        )}
                      </div>

                      {!hasFinalized ? (
                        <p className="text-ink-muted text-[11px] italic py-2">
                          Not finalized yet. Click "Approve &amp; Finalize Preferences" to ratify.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {fac.finalizedPreferences.map((fin, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-canvas border border-border-beige flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-800 text-white">
                                    Approved Choice {fin.priority}
                                  </span>
                                  <span className="font-mono font-semibold text-primary">{fin.subjectCode}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-canvas-muted text-ink-muted">
                                    {fin.matchType}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-ink mt-0.5">{fin.subjectTitle}</p>
                                <span className="text-[10px] text-ink-light block font-mono mt-0.5">
                                  Approved by {fin.approvedBy} on {fin.approvedAt}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approve / Modify Preferences Modal */}
      {selectedFacultyForPref && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-xl w-full p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Finalize Subject Preferences for {selectedFacultyForPref.name}
                </h3>
                <span className="text-[10px] font-mono text-ink-light">
                  {selectedFacultyForPref.empId} • {selectedFacultyForPref.designation}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacultyForPref(null)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              Confirm or modify approved subjects for this faculty member. These ratified preferences will guide the automatic Timetable Generation engine.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {draftFinalized.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-canvas-paper rounded border border-border-beige text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary font-mono">Slot #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setDraftFinalized(draftFinalized.filter((_, i) => i !== idx))}
                      className="text-crimson hover:underline text-[10px] flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-ink-light font-mono block">Subject Code</span>
                      <input
                        type="text"
                        value={item.subjectCode}
                        onChange={(e) => {
                          const updated = [...draftFinalized];
                          updated[idx].subjectCode = e.target.value.toUpperCase();
                          setDraftFinalized(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige font-mono uppercase"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-light font-mono block">Subject Title</span>
                      <input
                        type="text"
                        value={item.subjectTitle}
                        onChange={(e) => {
                          const updated = [...draftFinalized];
                          updated[idx].subjectTitle = e.target.value;
                          setDraftFinalized(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-ink-light font-mono block">Match Type</span>
                      <select
                        value={item.matchType}
                        onChange={(e) => {
                          const updated = [...draftFinalized];
                          updated[idx].matchType = e.target.value as FinalizedPreferenceItem['matchType'];
                          setDraftFinalized(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      >
                        <option value="Preference Match">Preference Match</option>
                        <option value="Administrative Allocation">Administrative Allocation</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-light font-mono block">Approved By</span>
                      <input
                        type="text"
                        value={item.approvedBy}
                        onChange={(e) => {
                          const updated = [...draftFinalized];
                          updated[idx].approvedBy = e.target.value;
                          setDraftFinalized(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setDraftFinalized([
                    ...draftFinalized,
                    {
                      priority: (draftFinalized.length + 1) as 1 | 2 | 3,
                      subjectCode: '21AI32',
                      subjectTitle: 'Data Structures & Applications',
                      approvedBy: 'Prof. Rajesh Shetty',
                      approvedAt: new Date().toISOString().split('T')[0],
                      matchType: 'Preference Match',
                    },
                  ])
                }
                className="w-full py-1.5 text-xs text-primary font-semibold border border-dashed border-primary/40 rounded hover:bg-primary/5 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Finalized Subject
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-beige">
              <button
                type="button"
                onClick={() => setSelectedFacultyForPref(null)}
                className="px-3 py-1.5 text-xs font-medium rounded border border-border-beige hover:bg-canvas-muted text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFinalized}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp"
              >
                Ratify &amp; Save Finalized Allocations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
