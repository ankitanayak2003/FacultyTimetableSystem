import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DeanSubject, DEAN_DEPARTMENTS } from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D'];

const SUBJECT_TYPES = [
  'Theory (PCC/BSC)',
  'Integrated (IPCC)',
  'Laboratory (PCCL)',
  'Elective (ESC/AEC)',
  'Universal Human Values (UHV)',
  'Mandatory Course (MC)',
  'Institutional Activity',
  'Skill Enhancement (SEC)',
];

export const SubjectFacultyAllocation: React.FC = () => {
  const {
    deanSubjects,
    addDeanSubject,
    updateDeanSubject,
    deleteDeanSubject,
    departmentFaculty,
    basicScienceFaculty,
    syncStatus,
    isBackendConnected,
    backendSyncError,
    refreshBackendData,
  } = useWorkflow();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedDepartment, setSelectedDepartment] = useState('AIDS');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const isFirstYear = selectedStudentYear === 'First Year';

  const registeredFaculty = React.useMemo(() => {
    // Dean faculty selection includes all faculty from all departments without department filtering
    const combined = [...departmentFaculty, ...basicScienceFaculty];
    const seen = new Set<string>();
    const names: string[] = [];
    for (const f of combined) {
      const trimmed = f.name?.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        names.push(trimmed);
      }
    }
    return names.sort((a, b) => a.localeCompare(b));
  }, [departmentFaculty, basicScienceFaculty]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState(SUBJECT_TYPES[0]);
  const [ltp, setLtp] = useState('3:0:0');
  const [credits, setCredits] = useState<string | number>('3');
  const [numFaculty, setNumFaculty] = useState<number>(1);
  const [facultySelections, setFacultySelections] = useState<string[]>(['']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const canPersistToBackend = isBackendConnected === true && syncStatus !== 'loading' && syncStatus !== 'error';

  const scopedSubjects = React.useMemo(() => {
    return deanSubjects.filter((s) => {
      const yearMatch = !s.studentYear || s.studentYear === selectedStudentYear;
      const semMatch = !s.semester || s.semester === selectedSemester;
      const deptMatch = isFirstYear
        ? !s.department || s.department === null
        : !s.department || s.department.toUpperCase() === selectedDepartment.toUpperCase();
      return yearMatch && semMatch && deptMatch;
    });
  }, [deanSubjects, selectedStudentYear, selectedSemester, selectedDepartment, isFirstYear]);

  React.useEffect(() => {
    if (facultySelections.length === 1 && (!facultySelections[0] || facultySelections[0] === '') && registeredFaculty.length > 0) {
      setFacultySelections([registeredFaculty[0]]);
    }
  }, [registeredFaculty]);

  // Auto-fill sensible default L:T:P and credits based on course type
  const handleTypeChange = (newType: string) => {
    setSubjectType(newType);
    if (newType.includes('Integrated') || newType.includes('IPCC')) {
      setLtp('3:0:2');
      setCredits('4');
    } else if (newType.includes('Laboratory') || newType.includes('PCCL') || newType.includes('Practical')) {
      setLtp('0:0:2');
      setCredits('1.5');
    } else if (newType.includes('Theory') || newType.includes('PCC')) {
      setLtp('3:0:0');
      setCredits('3');
    } else if (newType.includes('Elective')) {
      setLtp('3:0:0');
      setCredits('3');
    }
  };

  // Handle number of faculty changes dynamically
  const handleNumFacultyChange = (count: number) => {
    setNumFaculty(count);
    setFacultySelections((prev) => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push(registeredFaculty[i % registeredFaculty.length] || '');
        }
      } else {
        next.splice(count);
      }
      return next;
    });
  };

  const handleFacultySelectChange = (index: number, value: string) => {
    setFacultySelections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleEditClick = (subject: DeanSubject) => {
    setEditingId(subject.id);
    setSubjectName(subject.name);
    setSubjectCode(subject.code || '');
    setSubjectType(subject.type);
    setLtp(subject.ltp || (subject.type.includes('Lab') ? '0:0:2' : subject.type.includes('Integrated') ? '3:0:2' : '3:0:0'));
    setCredits(subject.credits !== undefined && subject.credits !== null ? subject.credits : '3');
    setNumFaculty(subject.numFaculty || subject.facultyNames.length || 1);
    setFacultySelections(
      subject.facultyNames.length > 0 ? subject.facultyNames : [registeredFaculty[0] || '']
    );
    setErrorMsg('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectType(SUBJECT_TYPES[0]);
    setLtp('3:0:0');
    setCredits('3');
    setNumFaculty(1);
    setFacultySelections([registeredFaculty[0] || '']);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPersistToBackend) {
      setErrorMsg('Cannot save allocation: backend synchronization is pending or failed.');
      return;
    }
    if (!subjectName.trim()) {
      setErrorMsg('Please enter a Subject Name / Course Name.');
      return;
    }
    if (!ltp.trim()) {
      setErrorMsg('Please enter L:T:P structure (e.g. 3:0:0).');
      return;
    }
    if (credits === '' || credits === null || credits === undefined) {
      setErrorMsg('Please enter Credits value.');
      return;
    }

    const assigned = facultySelections.filter((f) => f && f.trim().length > 0);
    if (assigned.length === 0) {
      setErrorMsg('Please assign at least one faculty member.');
      return;
    }

    const cleanCode = subjectCode.trim() ? subjectCode.trim().toUpperCase() : '';
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingId) {
        await updateDeanSubject(editingId, {
          name: subjectName.trim(),
          code: cleanCode,
          type: subjectType,
          ltp: ltp.trim(),
          credits,
          numFaculty,
          facultyNames: assigned,
          academicYear: selectedAcademicYear,
          studentYear: selectedStudentYear,
          semester: selectedSemester,
          department: isFirstYear ? null : selectedDepartment,
          section: selectedSection,
        });
        if (!isMountedRef.current) return;
        setSuccessMsg(`Subject "${subjectName.trim()}" and faculty allocation updated in Firestore.`);
        handleCancelEdit();
      } else {
        await addDeanSubject({
          name: subjectName.trim(),
          code: cleanCode,
          type: subjectType,
          ltp: ltp.trim(),
          credits,
          numFaculty,
          facultyNames: assigned,
          academicYear: selectedAcademicYear,
          studentYear: selectedStudentYear,
          semester: selectedSemester,
          department: isFirstYear ? null : selectedDepartment,
          section: selectedSection,
        });
        if (!isMountedRef.current) return;
        setSuccessMsg(`Subject "${subjectName.trim()}" and faculty allocation saved to Firestore.`);
        handleCancelEdit();
      }
      setTimeout(() => {
        if (isMountedRef.current) setSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMsg(`Failed to save allocation: ${err?.message || 'Backend error'}. Unsaved changes preserved.`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteClick = async (id: string, code?: string) => {
    if (!canPersistToBackend) {
      setErrorMsg('Cannot delete subject: backend synchronization is pending or failed.');
      return;
    }
    if (window.confirm(`Delete subject ${code || 'this subject'} from master list?`)) {
      setIsSaving(true);
      setErrorMsg('');
      try {
        await deleteDeanSubject(id);
        if (!isMountedRef.current) return;
        if (editingId === id) handleCancelEdit();
        setSuccessMsg(`Deleted subject ${code || id} from Firestore.`);
      } catch (err: any) {
        if (isMountedRef.current) {
          setErrorMsg(`Failed to delete subject: ${err?.message || 'Backend error'}.`);
        }
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Backend Synchronization Status Banner */}
      {syncStatus === 'loading' && (
        <div className="px-4 py-2.5 rounded-card border border-border-beige bg-canvas-paper text-xs text-ink-muted flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
          <span>Loading subjects and faculty allocations from Firestore...</span>
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="px-4 py-2.5 rounded-card border border-rose-300 bg-rose-50 text-xs text-rose-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>
              <strong>Backend sync failed:</strong> {backendSyncError || 'Unable to reach FastAPI server.'} Allocation saving is disabled.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refreshBackendData()}
            className="px-2.5 py-1 rounded bg-white border border-rose-300 text-rose-900 font-semibold hover:bg-rose-100 flex-shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 text-xs rounded-md">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md">
          {successMsg}
        </div>
      )}

      {/* Allocation Scope Selectors */}
      <div className="bg-surface rounded-card border border-border-beige p-3.5 shadow-crisp">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink"
            >
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink"
            >
              {STUDENT_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink"
            >
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Department
            </label>
            <select
              value={isFirstYear ? 'First Year' : selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={isFirstYear}
              className={`w-full px-2.5 py-1.5 text-xs rounded border border-border-beige ${
                isFirstYear ? 'bg-canvas-muted text-ink-light cursor-not-allowed' : 'bg-canvas text-ink'
              }`}
            >
              {isFirstYear ? (
                <option value="First Year">First Year (No Dept)</option>
              ) : (
                DEAN_DEPARTMENTS.filter((d) => d.code !== 'First Year').map((d) => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink"
            >
              {SECTIONS.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Subject Entry Form */}
      <div className="bg-surface rounded-card border border-border-beige p-4 sm:p-5 shadow-crisp">
        <h3 className="text-sm sm:text-base font-bold text-primary mb-3 pb-2 border-b border-border-subtle">
          {editingId ? 'Edit Subject Allocation' : 'Subject Entry'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Subject Name / Course Name (Required) */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Subject Name / Course Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Mathematics for Computer Science"
                className="w-full px-3 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
              />
            </div>

            {/* Subject Code / Course Code (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Subject Code <span className="text-ink-light font-normal text-[10px]">(Optional)</span>
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. BCS301 (Optional)"
                className="w-full px-3 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm uppercase font-mono"
              />
            </div>

            {/* Course Type (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Course Type <span className="text-primary">*</span>
              </label>
              <select
                value={subjectType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
              >
                {SUBJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* L:T:P (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                L:T:P Structure <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={ltp}
                onChange={(e) => setLtp(e.target.value)}
                placeholder="e.g. 3:0:0"
                className="w-full px-3 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm font-mono"
              />
            </div>

            {/* Credits (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Credits <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="e.g. 3"
                className="w-full px-3 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm font-mono"
              />
            </div>

            {/* Number of Faculty */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Faculty Allocation Count
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={numFaculty}
                  onChange={(e) => handleNumFacultyChange(parseInt(e.target.value, 10))}
                  className="w-32 px-2.5 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} Faculty
                    </option>
                  ))}
                </select>
                <span className="text-xs text-ink-muted">
                  (Assign {numFaculty} {numFaculty === 1 ? 'instructor' : 'instructors'} below)
                </span>
              </div>
            </div>
          </div>

          {/* Dynamically Generated Faculty Selection Fields */}
          <div className="p-3 sm:p-3.5 bg-canvas rounded-md border border-border-subtle space-y-2">
            <span className="block text-[11px] font-mono uppercase text-ink-muted font-semibold">
              Assigned Faculty ({numFaculty})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Array.from({ length: numFaculty }).map((_, index) => (
                <div key={index}>
                  <label className="block text-[11px] font-medium text-ink-light mb-0.5">
                    Faculty {index + 1}
                  </label>
                  <select
                    value={facultySelections[index] || ''}
                    onChange={(e) => handleFacultySelectChange(index, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface text-ink text-xs sm:text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
                  >
                    <option value="">Select Faculty...</option>
                    {registeredFaculty.map((fName) => (
                      <option key={fName} value={fName}>
                        {fName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isSaving || !canPersistToBackend}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors shadow-crisp flex items-center gap-1.5 ${
                isSaving || !canPersistToBackend
                  ? 'bg-canvas-muted text-ink-light border border-border-beige cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : editingId ? 'Update Subject' : 'Save Subject'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 bg-surface text-ink-muted hover:text-ink border border-border-beige text-xs sm:text-sm font-medium rounded-md transition-colors"
              >
                <span className="flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Subject Cards Section (Master List) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-ink">
            Master Subject & Faculty Catalog ({scopedSubjects.length})
          </h3>
          <span className="text-xs text-ink-muted font-mono">
            {isFirstYear ? 'First Year (No Dept)' : selectedDepartment} • {selectedSemester}
          </span>
        </div>

        {scopedSubjects.length === 0 ? (
          <div className="p-6 text-center bg-surface rounded-card border border-border-beige text-xs sm:text-sm text-ink-muted">
            No subjects found in Firestore for {isFirstYear ? 'First Year' : selectedDepartment} ({selectedSemester}). Use the form above to add subjects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scopedSubjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-surface rounded-card border border-border-beige p-3.5 shadow-crisp flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    {subject.code ? (
                      <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-mono font-bold text-xs">
                        {subject.code}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas text-ink-muted border border-border-subtle">
                        {subject.type}
                      </span>
                    )}
                    {subject.code && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas text-ink-muted border border-border-subtle">
                        {subject.type}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-ink text-xs sm:text-sm leading-snug">
                      {subject.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-ink-muted">
                      <span>L:T:P: {subject.ltp || '3:0:0'}</span>
                      <span>•</span>
                      <span>Credits: {subject.credits || 3}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block mb-1">
                      Assigned Faculty ({subject.facultyNames.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {subject.facultyNames.length === 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                          Unassigned
                        </span>
                      ) : (
                        subject.facultyNames.map((fac, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-canvas-muted text-ink text-[11px] font-medium border border-border-subtle"
                          >
                            {fac}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 mt-2 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleEditClick(subject)}
                    className="p-1 text-ink-muted hover:text-primary rounded hover:bg-canvas transition-colors"
                    title="Edit Subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(subject.id, subject.code || subject.name)}
                    className="p-1 text-ink-muted hover:text-red-600 rounded hover:bg-canvas transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
