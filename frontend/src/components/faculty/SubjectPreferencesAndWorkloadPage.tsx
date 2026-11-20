import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Scale,
  CheckCircle2,
  Send,
  Lock,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { FacultyPreferenceItem } from '../../data/workflowDemoData';

export const SubjectPreferencesAndWorkloadPage: React.FC = () => {
  const {
    departmentFaculty,
    deptSubjects,
    submitFacultyPreferences,
  } = useWorkflow();

  // Active section toggle: 'preferences' | 'workload'
  const [activeSubTab, setActiveSubTab] = useState<'preferences' | 'workload'>('preferences');

  // Logged-in faculty: Dr. Ananya Rao
  const currentFaculty = useMemo(() => {
    return (
      departmentFaculty.find((f) => f.name.includes('Ananya Rao') || f.empId === 'FAC102') ||
      departmentFaculty[0]
    );
  }, [departmentFaculty]);

  // Check if HOD/Coordinator has finalized preferences
  const isFinalized = Boolean(
    currentFaculty?.finalizedPreferences && currentFaculty.finalizedPreferences.length > 0
  );

  // Editable local preference choices
  const [draftPreferences, setDraftPreferences] = useState<FacultyPreferenceItem[]>(() => {
    if (currentFaculty?.preferences && currentFaculty.preferences.length > 0) {
      return [...currentFaculty.preferences];
    }
    return [
      { id: 'pref-1', priority: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', justification: '3 years experience teaching core algorithmic data structures.' },
      { id: 'pref-2', priority: 2, subjectCode: '21AI52', subjectTitle: 'Computer Networks', justification: 'Research publications in distributed systems and network protocols.' },
      { id: 'pref-3', priority: 3, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning', justification: 'PhD thesis specialized in probabilistic learning algorithms.' },
    ];
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Available subjects based on faculty teaching eligibility
  const eligibleSubjects = useMemo(() => {
    if (!currentFaculty) return deptSubjects;
    return deptSubjects.filter((s) => currentFaculty.eligibleYears.includes(s.studentYear));
  }, [deptSubjects, currentFaculty]);

  // Unique eligible courses
  const uniqueEligibleCourses = useMemo(() => {
    const map = new Map<string, { code: string; title: string; year: string }>();
    eligibleSubjects.forEach((s) => {
      if (!map.has(s.courseCode)) {
        map.set(s.courseCode, { code: s.courseCode, title: s.courseTitle, year: s.studentYear });
      }
    });
    return Array.from(map.values());
  }, [eligibleSubjects]);

  const handleUpdateChoice = (priority: 1 | 2 | 3, courseCode: string) => {
    const found = uniqueEligibleCourses.find((c) => c.code === courseCode);
    setDraftPreferences((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((p) => p.priority === priority);
      if (index >= 0) {
        updated[index] = {
          ...updated[index],
          subjectCode: courseCode,
          subjectTitle: found ? found.title : courseCode,
        };
      } else {
        updated.push({
          id: `pref-${priority}-${Date.now()}`,
          priority,
          subjectCode: courseCode,
          subjectTitle: found ? found.title : courseCode,
          justification: '',
        });
      }
      return updated;
    });
  };

  const handleUpdateJustification = (priority: 1 | 2 | 3, text: string) => {
    setDraftPreferences((prev) =>
      prev.map((p) => (p.priority === priority ? { ...p, justification: text } : p))
    );
  };

  const handleSubmitPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty) return;
    submitFacultyPreferences(currentFaculty.id, draftPreferences);
    setNotification({
      type: 'success',
      text: 'Subject preferences successfully submitted! They are now visible to the Department Coordinator and HOD for ratification.',
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Workload calculations from shared WorkflowContext
  const teachingHours = currentFaculty ? currentFaculty.theoryHours + currentFaculty.labHours : 0;
  const dutyHours = currentFaculty
    ? currentFaculty.additionalDuties.reduce((acc, d) => acc + d.hours, 0)
    : 0;
  const totalLoad = teachingHours + (currentFaculty?.basicScienceHours || 0) + dutyHours;
  const remainingCapacity = currentFaculty ? currentFaculty.maxHours - totalLoad : 0;

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Top Banner with Sub-tab Navigation */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Academic Curriculum &amp; Allocation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                {currentFaculty?.name}
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Subject Preferences &amp; My Workload
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Submit up to three preferred subjects for upcoming academic timetabling and examine official teaching hours and institutional duties compliance.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="inline-flex rounded-card bg-canvas-muted p-1 border border-border-beige flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('preferences')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'preferences'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Subject Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('workload')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'workload'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              My Workload (Read-Only)
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: SUBJECT PREFERENCES                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-4">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-card border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isFinalized
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-primary/5 border-primary/20 text-primary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isFinalized ? (
                <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              ) : (
                <BookmarkCheck className="w-4 h-4 text-primary flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold block">
                  {isFinalized
                    ? 'Preferences Finalized & Approved by HOD'
                    : 'Preferences Submission Window Active'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {isFinalized
                    ? 'Allocations have been certified for Department Timetable generation. Changes are read-only.'
                    : 'Select your top three subjects based on your teaching eligibility (Second & Third Year).'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isFinalized
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {isFinalized ? 'Finalized by HOD' : 'Submitted'}
              </span>
            </div>
          </div>

          {/* IF FINALIZED: READ-ONLY DISPLAY WITH HOD MODIFICATION INDICATORS */}
          {isFinalized ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Original Submitted Preferences */}
              <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-beige">
                  <div className="flex items-center gap-1.5">
                    <BookmarkCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-headline font-semibold text-sm text-primary">
                      1. Your Submitted Preferences
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-ink-light">
                    Submitted on 2026-10-28
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {currentFaculty?.preferences.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-primary text-white">
                          Choice #{p.priority}
                        </span>
                        <span className="font-mono font-bold text-primary">{p.subjectCode}</span>
                      </div>
                      <p className="font-medium text-ink">{p.subjectTitle}</p>
                      {p.justification && (
                        <p className="text-[10px] text-ink-muted italic pt-0.5">
                          "{p.justification}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: HOD / Coordinator Approved Finalized Allocations */}
              <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-beige">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-headline font-semibold text-sm text-emerald-900">
                      2. HOD Finalized Allocations
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                    Ratified &amp; Locked
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {currentFaculty?.finalizedPreferences.map((fin, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-800 text-white">
                          Approved Choice #{fin.priority}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-canvas-muted text-ink-muted">
                          {fin.matchType}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-primary block">{fin.subjectCode}</span>
                      <p className="font-medium text-ink">{fin.subjectTitle}</p>
                      <span className="text-[10px] text-ink-light block font-mono pt-1">
                        Ratified by {fin.approvedBy} on {fin.approvedAt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* IF NOT FINALIZED: INTERACTIVE FORM TO SUBMIT / EDIT PREFERENCES */
            <form
              onSubmit={handleSubmitPreferences}
              className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-beige">
                <h3 className="font-headline font-semibold text-sm sm:text-base text-primary">
                  Select 3-Tier Subject Preferences
                </h3>
                <span className="text-[10px] font-mono text-ink-light">
                  Max 3 Choices Allowed
                </span>
              </div>

              {[1, 2, 3].map((priority) => {
                const choice = draftPreferences.find((p) => p.priority === priority);
                return (
                  <div
                    key={priority}
                    className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary font-mono text-[11px] uppercase tracking-wider">
                        Preference #{priority} {priority === 1 ? '(Top Priority)' : ''}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted">
                        Priority {priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                          Subject *
                        </label>
                        <select
                          value={choice?.subjectCode || ''}
                          onChange={(e) =>
                            handleUpdateChoice(priority as 1 | 2 | 3, e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                        >
                          {uniqueEligibleCourses.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.title} ({c.year.replace(' Year', ' Yr')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                          Pedagogical Justification / Domain Expertise
                        </label>
                        <input
                          type="text"
                          value={choice?.justification || ''}
                          onChange={(e) =>
                            handleUpdateJustification(priority as 1 | 2 | 3, e.target.value)
                          }
                          placeholder="e.g. 3 years teaching DSA, Springer research publications..."
                          className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-end pt-2 border-t border-border-beige">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Subject Preferences</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: MY WORKLOAD (READ-ONLY)                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'workload' && (
        <div className="space-y-4">
          {/* Workload Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
                Total Workload
              </span>
              <span className="text-xl font-bold font-mono text-primary block mt-0.5">
                {totalLoad} hrs/wk
              </span>
              <span className="text-[10px] text-ink-muted block mt-0.5">
                Norm: {currentFaculty?.normHours}h ({currentFaculty?.minHours}–{currentFaculty?.maxHours}h Max)
              </span>
            </div>

            <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
                Dept Teaching Hours
              </span>
              <span className="text-xl font-bold font-mono text-ink block mt-0.5">
                {teachingHours} hrs/wk
              </span>
              <span className="text-[10px] text-ink-muted block mt-0.5">
                {currentFaculty?.theoryHours}T + {currentFaculty?.labHours}L
              </span>
            </div>

            <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
                Basic Science Hours
              </span>
              <span className="text-xl font-bold font-mono text-purple-900 block mt-0.5">
                {currentFaculty?.basicScienceHours || 0} hrs/wk
              </span>
              <span className="text-[10px] text-ink-muted block mt-0.5">
                1st Year Cycle Commitment
              </span>
            </div>

            <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
                Remaining Capacity
              </span>
              <span
                className={`text-xl font-bold font-mono block mt-0.5 ${
                  remainingCapacity > 0
                    ? 'text-emerald-700'
                    : remainingCapacity === 0
                    ? 'text-ink-muted'
                    : 'text-rose-700'
                }`}
              >
                {remainingCapacity > 0 ? `+${remainingCapacity}h` : `${remainingCapacity}h`}
              </span>
              <span className="text-[10px] font-mono text-emerald-800 block mt-0.5 font-semibold">
                Status: Optimal
              </span>
            </div>
          </div>

          {/* Workload Breakdown Table */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
            <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
                  Teaching Workload Breakdown &amp; Course Mapping
                </h3>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                VTU / AICTE Norm Compliant
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                    <th className="py-2.5 px-3">Subject Code &amp; Title</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Class / Section</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Weekly Contact Hours</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr className="hover:bg-canvas-muted/20">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-primary block">21AI32</span>
                      <span className="text-ink font-medium">Data Structures &amp; Applications</span>
                    </td>
                    <td className="py-2.5 px-3">Theory (PCC)</td>
                    <td className="py-2.5 px-3 font-mono">2nd Year (3A &amp; 3B)</td>
                    <td className="py-2.5 px-3 font-medium">AI &amp; Data Science</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">8 hrs/wk</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary-subtle text-primary font-semibold">
                        Dept Core
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-canvas-muted/20">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-primary block">21AIL37</span>
                      <span className="text-ink font-medium">Data Structures Laboratory</span>
                    </td>
                    <td className="py-2.5 px-3">Laboratory (PCCL)</td>
                    <td className="py-2.5 px-3 font-mono">2nd Year (3A Batch 1)</td>
                    <td className="py-2.5 px-3 font-medium">AI &amp; Data Science</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">4 hrs/wk</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary-subtle text-primary font-semibold">
                        Dept Lab
                      </span>
                    </td>
                  </tr>

                  {currentFaculty?.basicScienceHours && currentFaculty.basicScienceHours > 0 ? (
                    <tr className="hover:bg-canvas-muted/20">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-primary block">22POPL17</span>
                        <span className="text-ink font-medium">Computer Programming Laboratory</span>
                      </td>
                      <td className="py-2.5 px-3">Laboratory (ESC)</td>
                      <td className="py-2.5 px-3 font-mono">1st Year (Chem Cycle - Sec C)</td>
                      <td className="py-2.5 px-3 font-medium">Basic Science</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {currentFaculty.basicScienceHours} hrs/wk
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-900 font-semibold border border-purple-200">
                          Basic Science
                        </span>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Institutional Responsibilities Table */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
            <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
              <span className="font-headline font-semibold text-primary">
                Approved Institutional &amp; Administrative Responsibilities
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                Credited towards Total Workload Quota
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                    <th className="py-2.5 px-3">Designated Role</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Allocated Hours</th>
                    <th className="py-2.5 px-3">Ratifying Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {currentFaculty?.additionalDuties.map((d, idx) => (
                    <tr key={idx} className="hover:bg-canvas-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-ink">{d.role}</td>
                      <td className="py-2.5 px-3 text-ink-muted">Institutional Administration</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                        {d.hours} hrs/wk
                      </td>
                      <td className="py-2.5 px-3 text-ink-muted">Principal &amp; HOD (AIDS)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
