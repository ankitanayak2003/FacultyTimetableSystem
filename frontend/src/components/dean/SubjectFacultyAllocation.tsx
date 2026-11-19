import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DeanSubject, REGISTERED_FACULTY_NAMES } from '../../data/workflowDemoData';

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

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];

export const SubjectFacultyAllocation: React.FC = () => {
  const { deanSubjects, addDeanSubject, updateDeanSubject, deleteDeanSubject } = useWorkflow();

  // Academic Filter Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState(SUBJECT_TYPES[0]);
  const [numFaculty, setNumFaculty] = useState<number>(1);
  const [facultySelections, setFacultySelections] = useState<string[]>([REGISTERED_FACULTY_NAMES[0]]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle number of faculty changes dynamically
  const handleNumFacultyChange = (count: number) => {
    setNumFaculty(count);
    setFacultySelections((prev) => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push(REGISTERED_FACULTY_NAMES[i % REGISTERED_FACULTY_NAMES.length] || '');
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
    setSubjectCode(subject.code);
    setSubjectType(subject.type);
    setNumFaculty(subject.numFaculty || subject.facultyNames.length || 1);
    setFacultySelections(
      subject.facultyNames.length > 0 ? subject.facultyNames : [REGISTERED_FACULTY_NAMES[0]]
    );
    setSelectedAcademicYear(subject.academicYear);
    setSelectedStudentYear(subject.studentYear);
    setSelectedSemester(subject.semester);
    setErrorMsg('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectType(SUBJECT_TYPES[0]);
    setNumFaculty(1);
    setFacultySelections([REGISTERED_FACULTY_NAMES[0]]);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setErrorMsg('Please enter a Subject Name.');
      return;
    }
    if (!subjectCode.trim()) {
      setErrorMsg('Please enter a Subject Code.');
      return;
    }

    const assigned = facultySelections.filter((f) => f && f.trim().length > 0);
    if (assigned.length === 0) {
      setErrorMsg('Please assign at least one faculty member.');
      return;
    }

    if (editingId) {
      updateDeanSubject(editingId, {
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        type: subjectType,
        numFaculty,
        facultyNames: assigned,
        academicYear: selectedAcademicYear,
        studentYear: selectedStudentYear,
        semester: selectedSemester,
      });
      setSuccessMsg(`Subject ${subjectCode.trim().toUpperCase()} updated successfully.`);
      handleCancelEdit();
    } else {
      addDeanSubject({
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        type: subjectType,
        numFaculty,
        facultyNames: assigned,
        academicYear: selectedAcademicYear,
        studentYear: selectedStudentYear,
        semester: selectedSemester,
      });
      setSuccessMsg(`Subject ${subjectCode.trim().toUpperCase()} added to allocation catalog.`);
      setSubjectName('');
      setSubjectCode('');
      setSubjectType(SUBJECT_TYPES[0]);
      setNumFaculty(1);
      setFacultySelections([REGISTERED_FACULTY_NAMES[0]]);
      setErrorMsg('');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteClick = (id: string, code: string) => {
    if (window.confirm(`Delete subject ${code} from allocation list?`)) {
      deleteDeanSubject(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  // Filter subjects for the selected academic context
  const filteredSubjects = deanSubjects.filter(
    (s) =>
      (!s.academicYear || s.academicYear === selectedAcademicYear) &&
      (!s.studentYear || s.studentYear === selectedStudentYear) &&
      (!s.semester || s.semester === selectedSemester)
  );

  return (
    <div className="space-y-6">
      {/* Academic Selection Filters */}
      <div className="bg-surface rounded-card border border-border-beige p-4 sm:p-5 shadow-crisp">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
            >
              {STUDENT_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-md">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md">
          {successMsg}
        </div>
      )}

      {/* Subject Entry Form */}
      <div className="bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
        <h3 className="text-base font-bold text-primary mb-4 pb-2 border-b border-border-subtle">
          {editingId ? 'Edit Subject Allocation' : 'Subject Entry'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Subject Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Mathematics for Computer Science"
                className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
              />
            </div>

            {/* Subject Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Subject Code <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. BCS301"
                className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm uppercase font-mono"
              />
            </div>

            {/* Subject Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Subject Type
              </label>
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value)}
                className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
              >
                {SUBJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Number of Faculty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Number of Faculty
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <select
                value={numFaculty}
                onChange={(e) => handleNumFacultyChange(parseInt(e.target.value, 10))}
                className="w-32 px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Faculty' : 'Faculty'}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ink-muted">
                (Generates {numFaculty} faculty selection {numFaculty === 1 ? 'field' : 'fields'})
              </span>
            </div>
          </div>

          {/* Dynamically Generated Faculty Selection Fields */}
          <div className="p-4 bg-canvas rounded-md border border-border-subtle space-y-3">
            <span className="block text-xs font-mono uppercase text-ink-muted font-semibold">
              Assigned Faculty ({numFaculty})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: numFaculty }).map((_, index) => (
                <div key={index}>
                  <label className="block text-[11px] font-medium text-ink-light mb-1">
                    Faculty {index + 1}
                  </label>
                  <select
                    value={facultySelections[index] || ''}
                    onChange={(e) => handleFacultySelectChange(index, e.target.value)}
                    className="w-full px-3 py-2 bg-surface text-ink text-sm rounded-md border border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm"
                  >
                    {REGISTERED_FACULTY_NAMES.map((fName) => (
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
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-hover transition-colors shadow-crisp flex items-center gap-1.5"
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingId ? 'Update Subject' : 'Save Subject'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-surface text-ink-muted hover:text-ink border border-border-beige text-sm font-medium rounded-md transition-colors"
              >
                <span className="flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Cancel
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Subject Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">
            Saved Subject Allocations ({filteredSubjects.length})
          </h3>
          <span className="text-xs text-ink-muted font-mono">
            {selectedStudentYear} • {selectedSemester}
          </span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-card border border-border-beige text-sm text-ink-muted">
            No subjects allocated yet for {selectedStudentYear} ({selectedSemester}). Use the form above to add subjects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="bg-surface rounded-card border border-border-beige p-4 shadow-crisp flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-mono font-bold text-xs">
                      {subject.code}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-canvas text-ink-muted border border-border-subtle">
                      {subject.type}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-ink text-sm leading-snug">
                      {subject.name}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <span className="text-[11px] font-mono uppercase text-ink-light block mb-1">
                      Assigned Faculty ({subject.facultyNames.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subject.facultyNames.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-canvas-muted text-ink text-xs font-medium border border-border-subtle"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleEditClick(subject)}
                    className="p-1.5 text-ink-muted hover:text-primary rounded hover:bg-canvas transition-colors"
                    title="Edit Subject"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(subject.id, subject.code)}
                    className="p-1.5 text-ink-muted hover:text-red-600 rounded hover:bg-canvas transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
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
