import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Wand2,
  Plus,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  BookOpen,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DeptSubjectItem } from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const COURSE_TYPES = [
  'Theory',
  'Laboratory',
  'Integrated',
  'Professional Elective',
  'Open Elective',
  'AEC',
  'ESC',
];

export const DeptSubjectAllocationView: React.FC = () => {
  const {
    deptSubjects,
    departmentFaculty,
    addDeptSubject,
    updateDeptSubject,
    deleteDeptSubject,
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

  // Status notification message
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Subject Entry / Edit Form State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLtp, setFormLtp] = useState('3:0:0');
  const [formType, setFormType] = useState('Theory');
  const [formCredits, setFormCredits] = useState<string | number>('3');
  const [formFaculty, setFormFaculty] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Active faculty eligible for this student year
  const eligibleFaculty = useMemo(() => {
    return departmentFaculty.filter(
      (f) => f.accountStatus === 'Active' && f.eligibleYears.includes(selectedStudentYear)
    );
  }, [departmentFaculty, selectedStudentYear]);

  // Default faculty selection when eligibleFaculty updates
  useEffect(() => {
    if (!formFaculty && eligibleFaculty.length > 0) {
      setFormFaculty(eligibleFaculty[0].name);
    }
  }, [eligibleFaculty, formFaculty]);

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

  // Handle Type Change with sensible defaults
  const handleTypeChange = (newType: string) => {
    setFormType(newType);
    if (newType.toLowerCase().includes('lab')) {
      setFormLtp('0:0:2');
      setFormCredits('1.5');
    } else if (newType.toLowerCase().includes('integrated')) {
      setFormLtp('3:0:2');
      setFormCredits('4');
    } else {
      setFormLtp('3:0:0');
      setFormCredits('3');
    }
  };

  // Handle Save / Add / Update Subject
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Subject Name / Course Name is required.');
      return;
    }
    if (!formLtp.trim()) {
      setFormError('L:T:P ratio is required (e.g. 3:0:0).');
      return;
    }
    if (formCredits === '' || formCredits === undefined || formCredits === null) {
      setFormError('Credits value is required.');
      return;
    }
    if (!formFaculty.trim()) {
      setFormError('Please select a faculty member.');
      return;
    }

    const semNum =
      selectedStudentYear === 'Second Year'
        ? selectedSemester === 'Odd Semester'
          ? '3rd Sem'
          : '4th Sem'
        : selectedStudentYear === 'Third Year'
        ? selectedSemester === 'Odd Semester'
          ? '5th Sem'
          : '6th Sem'
        : selectedSemester === 'Odd Semester'
        ? '7th Sem'
        : '8th Sem';

    const hrs = formType.toLowerCase().includes('lab')
      ? 2
      : formType.toLowerCase().includes('integrated')
      ? 5
      : 3;

    if (editingSubjectId) {
      updateDeptSubject(editingSubjectId, {
        courseTitle: formTitle.trim(),
        courseCode: formCode.trim() || undefined,
        ltp: formLtp.trim(),
        credits: formCredits,
        type: formType,
        assignedFaculty: formFaculty,
        hoursPerWeek: hrs,
      });
      setNotificationMsg({ type: 'success', text: `Updated course "${formTitle.trim()}".` });
      setEditingSubjectId(null);
    } else {
      addDeptSubject({
        courseTitle: formTitle.trim(),
        courseCode: formCode.trim() || undefined,
        ltp: formLtp.trim(),
        credits: formCredits,
        studentYear: selectedStudentYear as 'Second Year' | 'Third Year' | 'Fourth Year',
        semester: selectedSemester as 'Odd Semester' | 'Even Semester',
        semNumber: semNum,
        type: formType,
        hoursPerWeek: hrs,
        venue: 'LH-201',
        assignedFaculty: formFaculty,
        preferenceMatch: 'Administrative Allocation',
      });
      setNotificationMsg({ type: 'success', text: `Added new course "${formTitle.trim()}".` });
    }

    setFormTitle('');
    setFormCode('');
    setFormType('Theory');
    setFormLtp('3:0:0');
    setFormCredits('3');
    setFormError('');
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleEditSubject = (sub: DeptSubjectItem) => {
    setEditingSubjectId(sub.id);
    setFormTitle(sub.courseTitle);
    setFormCode(sub.courseCode || '');
    setFormLtp(sub.ltp || (sub.type?.toLowerCase().includes('lab') ? '0:0:2' : '3:0:0'));
    setFormType(sub.type || 'Theory');
    setFormCredits(
      sub.credits !== undefined && sub.credits !== null
        ? sub.credits
        : sub.type?.toLowerCase().includes('lab')
        ? 1.5
        : 3
    );
    setFormFaculty(sub.assignedFaculty || eligibleFaculty[0]?.name || '');
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingSubjectId(null);
    setFormTitle('');
    setFormCode('');
    setFormType('Theory');
    setFormLtp('3:0:0');
    setFormCredits('3');
    setFormError('');
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete course "${name}"?`)) {
      deleteDeptSubject(id);
      if (editingSubjectId === id) {
        handleCancelEdit();
      }
      setNotificationMsg({ type: 'info', text: `Deleted course "${name}".` });
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Handle Auto-Allocation
  const handleRunAutoAllocation = () => {
    autoAllocateDeptSubjects(selectedAcademicYear, selectedSemester, selectedStudentYear);
    setNotificationMsg({
      type: 'success',
      text: `Generated initial faculty allocations for ${selectedStudentYear} (${selectedSemester}). Soft constraints prioritized Priority 1 > 2 > 3 choices, teaching year eligibility, and balanced workload capacity.`,
    });
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // Helper to determine preference match badge for manual selection
  const handleFacultyChange = (subjectId: string, facultyName: string, subjectCode?: string) => {
    const fac = departmentFaculty.find((f) => f.name === facultyName);
    let match: DeptSubjectItem['preferenceMatch'] = 'Administrative Allocation';
    if (fac && subjectCode) {
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
              Define departmental subjects and assign faculty per student year and section. Run constraint-aware auto-allocation or override manually with live preference indicators.
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

      {/* Subject Entry Section (Required for Automatic Timetable Generator) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-beige">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              {editingSubjectId ? 'Edit Department Course' : 'Add Subject / Course for Timetable Generation'}
            </h3>
          </div>
          {editingSubjectId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink px-2 py-0.5 rounded border border-border-beige"
            >
              <RotateCcw className="w-3 h-3" />
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSubject} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Field 1: Subject Name / Course Name (Required) */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Course Name <span className="text-crimson">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter Subject / Course Name"
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-medium focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Field 2: Subject Code / Course Code (Strictly Optional) */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Course Code <span className="text-ink-light font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. 21CS61 (Leave blank if not assigned)"
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 3: L:T:P (Required) */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                L:T:P <span className="text-crimson">*</span>
              </label>
              <input
                type="text"
                value={formLtp}
                onChange={(e) => setFormLtp(e.target.value)}
                placeholder="e.g. 3:0:0 or 0:0:2"
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono font-semibold focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Field 4: Course Type (Required) */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Course Type <span className="text-crimson">*</span>
              </label>
              <select
                value={formType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                required
              >
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 5: Credits (Required) */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Credits <span className="text-crimson">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
                placeholder="e.g. 3"
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono font-semibold focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 items-end">
            {/* Field 6: Name of Faculty Member (Required) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Name of Faculty Member <span className="text-crimson">*</span>
              </label>
              <select
                value={formFaculty}
                onChange={(e) => setFormFaculty(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                required
              >
                {departmentFaculty
                  .filter((f) => f.accountStatus === 'Active')
                  .map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name} ({fac.designation} — {fac.department})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingSubjectId ? 'Update Subject' : 'Save Subject'}</span>
              </button>
              {editingSubjectId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-canvas-muted text-ink border border-border-beige hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

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
                <th className="py-2.5 px-3 text-center">L:T:P</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Credit</th>
                <th className="py-2.5 px-3 text-center">Hrs/Wk</th>
                <th className="py-2.5 px-3 min-w-[200px]">Assigned Faculty</th>
                <th className="py-2.5 px-3 text-center">Preference Match</th>
                <th className="py-2.5 px-3 text-center">Workload Impact</th>
                <th className="py-2.5 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-ink-muted">
                    No curriculum subjects defined for {selectedStudentYear} ({selectedSemester}). Use the form above to add subjects.
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
                      {/* Course Code & Title */}
                      <td className="py-2.5 px-3">
                        {sub.courseCode && sub.courseCode.trim() !== '' && (
                          <span className="font-mono font-bold text-primary block">{sub.courseCode}</span>
                        )}
                        <span className="text-ink font-medium">{sub.courseTitle}</span>
                      </td>

                      {/* L:T:P */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-ink-muted">
                        {sub.ltp || (sub.type?.toLowerCase().includes('lab') ? '0:0:2' : '3:0:0')}
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-canvas-muted text-ink-muted">
                          {sub.type}
                        </span>
                      </td>

                      {/* Credits */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                        {sub.credits !== undefined && sub.credits !== null
                          ? sub.credits
                          : sub.type?.toLowerCase().includes('lab')
                          ? 1.5
                          : 3}
                      </td>

                      {/* Hours */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-ink">
                        {sub.hoursPerWeek}h
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

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditSubject(sub)}
                            className="p-1 text-ink-muted hover:text-primary rounded hover:bg-canvas transition-colors"
                            title="Edit Course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sub.id, sub.courseTitle)}
                            className="p-1 text-ink-muted hover:text-rose-600 rounded hover:bg-canvas transition-colors"
                            title="Delete Course"
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
