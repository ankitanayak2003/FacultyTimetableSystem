import React, { useState, useMemo } from 'react';
import {
  Layers,
  Wand2,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DeptSubjectItem } from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];

export const DeptSubjectAllocationView: React.FC = () => {
  const {
    deptSubjects,
    departmentFaculty,
    updateDeptSubjectAllocation,
    autoAllocateDeptSubjects,
  } = useWorkflow();

  // Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Dynamic sections
  const [sections, setSections] = useState<string[]>(['Section A', 'Section B']);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Status message
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Add Section handler
  const handleAddSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    if (!sections.includes(trimmed)) {
      setSections([...sections, trimmed]);
      setSelectedSection(trimmed);
      setNotificationMsg({ type: 'success', text: `Section "${trimmed}" added successfully.` });
    }
    setNewSectionName('');
    setShowAddSectionModal(false);
  };

  // Filter applicable subjects for current selection
  const filteredSubjects = useMemo(() => {
    return deptSubjects.filter(
      (s) => s.studentYear === selectedStudentYear && s.semester === selectedSemester
    );
  }, [deptSubjects, selectedStudentYear, selectedSemester]);

  // Handle Auto-Allocation
  const handleRunAutoAllocation = () => {
    autoAllocateDeptSubjects(selectedAcademicYear, selectedSemester, selectedStudentYear);
    setNotificationMsg({
      type: 'success',
      text: `Generated initial faculty allocations for ${selectedStudentYear} (${selectedSemester}). Soft constraints prioritized Priority 1 > 2 > 3 choices, teaching year eligibility, and balanced workload capacity.`,
    });
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // Active faculty eligible for this student year
  const eligibleFaculty = useMemo(() => {
    return departmentFaculty.filter(
      (f) => f.accountStatus === 'Active' && f.eligibleYears.includes(selectedStudentYear)
    );
  }, [departmentFaculty, selectedStudentYear]);

  // Helper to determine preference match badge for manual selection
  const handleFacultyChange = (subjectId: string, facultyName: string, subjectCode: string) => {
    const fac = departmentFaculty.find((f) => f.name === facultyName);
    let match: DeptSubjectItem['preferenceMatch'] = 'Administrative Allocation';
    if (fac) {
      const p1 = fac.preferences.find((p) => p.priority === 1 && p.subjectCode === subjectCode);
      const p2 = fac.preferences.find((p) => p.priority === 2 && p.subjectCode === subjectCode);
      const p3 = fac.preferences.find((p) => p.priority === 3 && p.subjectCode === subjectCode);
      if (p1) match = 'Priority 1';
      else if (p2) match = 'Priority 2';
      else if (p3) match = 'Priority 3';
    }
    updateDeptSubjectAllocation(subjectId, facultyName, match);
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Selector Card (Matches Dean layout) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Department Course Allocation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                AIDS Curriculum
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Subject Allocation Engine
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Assign faculty to departmental subjects per student year and section. Run constraint-aware auto-allocation or override manually with live preference indicators.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAutoAllocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors flex-shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate Initial Allocations</span>
          </button>
        </div>

        {/* 4 Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-0.5">
          {/* Academic Year */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Semester Type
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Student Year (2nd, 3rd, 4th) */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {STUDENT_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Section (Dynamic + Add option) */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                Section
              </label>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add Section
              </button>
            </div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-card text-xs text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Subjects Allocation Table (Exact Dean table styling) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
        <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              Applicable Subjects &amp; Assigned Faculty — {selectedStudentYear} ({selectedSemester})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-ink-muted">
            {filteredSubjects.length} Courses in Roster
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="py-2.5 px-3">Course Code &amp; Title</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Hrs/Wk</th>
                <th className="py-2.5 px-3">Room/Venue</th>
                <th className="py-2.5 px-3 min-w-[220px]">Assigned Faculty</th>
                <th className="py-2.5 px-3 text-center">Preference Match Indicator</th>
                <th className="py-2.5 px-3 text-center">Faculty Workload Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    No curriculum subjects defined for {selectedStudentYear} ({selectedSemester}).
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => {
                  const assignedFac = departmentFaculty.find((f) => f.name === sub.assignedFaculty);
                  const teachingHrs = assignedFac ? assignedFac.theoryHours + assignedFac.labHours : 0;
                  const duties = assignedFac ? assignedFac.additionalDuties.reduce((a, b) => a + b.hours, 0) : 0;
                  const totalFacLoad = assignedFac ? teachingHrs + assignedFac.basicScienceHours + duties : 0;

                  return (
                    <tr key={sub.id} className="hover:bg-canvas-muted/20 transition-colors">
                      {/* Course */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-primary block">{sub.courseCode}</span>
                        <span className="text-ink font-medium">{sub.courseTitle}</span>
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-canvas-muted text-ink-muted">
                          {sub.type}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-ink">
                        {sub.hoursPerWeek}h
                      </td>

                      {/* Venue */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted">
                        {sub.venue}
                      </td>

                      {/* Assigned Faculty Dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          value={sub.assignedFaculty}
                          onChange={(e) => handleFacultyChange(sub.id, e.target.value, sub.courseCode)}
                          className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                        >
                          {eligibleFaculty.map((fac) => (
                            <option key={fac.id} value={fac.name}>
                              {fac.name} ({fac.designation.split(' ')[0]})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Preference Match Indicator */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                            sub.preferenceMatch === 'Priority 1'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sub.preferenceMatch === 'Priority 2'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : sub.preferenceMatch === 'Priority 3'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                          }`}
                        >
                          {sub.preferenceMatch || 'Administrative Allocation'}
                        </span>
                      </td>

                      {/* Workload Impact */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        {assignedFac ? (
                          <div>
                            <span className="font-semibold text-ink">{totalFacLoad} / {assignedFac.maxHours}h</span>
                            <span className="text-[10px] text-ink-light block">
                              {assignedFac.basicScienceHours > 0 ? `(incl. ${assignedFac.basicScienceHours}h 1st Yr)` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ink-light">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <h4 className="font-headline font-semibold text-primary text-sm">
                Add Section to {selectedStudentYear}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                Section Name
              </label>
              <input
                type="text"
                placeholder="e.g. Section C"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-beige">
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="px-3 py-1 text-xs rounded border border-border-beige hover:bg-canvas-muted text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3.5 py-1 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
