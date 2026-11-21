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

export const SubjectFacultyAllocation: React.FC = () => {
  const { deanSubjects, addDeanSubject, updateDeanSubject, deleteDeanSubject } = useWorkflow();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState(SUBJECT_TYPES[0]);
  const [ltp, setLtp] = useState('3:0:0');
  const [credits, setCredits] = useState<string | number>('3');
  const [numFaculty, setNumFaculty] = useState<number>(1);
  const [facultySelections, setFacultySelections] = useState<string[]>([REGISTERED_FACULTY_NAMES[0]]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    setSubjectCode(subject.code || '');
    setSubjectType(subject.type);
    setLtp(subject.ltp || (subject.type.includes('Lab') ? '0:0:2' : subject.type.includes('Integrated') ? '3:0:2' : '3:0:0'));
    setCredits(subject.credits !== undefined && subject.credits !== null ? subject.credits : '3');
    setNumFaculty(subject.numFaculty || subject.facultyNames.length || 1);
    setFacultySelections(
      subject.facultyNames.length > 0 ? subject.facultyNames : [REGISTERED_FACULTY_NAMES[0]]
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
    setFacultySelections([REGISTERED_FACULTY_NAMES[0]]);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    if (editingId) {
      updateDeanSubject(editingId, {
        name: subjectName.trim(),
        code: cleanCode,
        type: subjectType,
        ltp: ltp.trim(),
        credits,
        numFaculty,
        facultyNames: assigned,
      });
      setSuccessMsg(`Subject "${subjectName.trim()}" updated successfully in master catalog.`);
      handleCancelEdit();
    } else {
      addDeanSubject({
        name: subjectName.trim(),
        code: cleanCode,
        type: subjectType,
        ltp: ltp.trim(),
        credits,
        numFaculty,
        facultyNames: assigned,
      });
      setSuccessMsg(`Subject "${subjectName.trim()}" added to master catalog.`);
      handleCancelEdit();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteClick = (id: string, code?: string) => {
    if (window.confirm(`Delete subject ${code || 'this subject'} from master list?`)) {
      deleteDeanSubject(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  return (
    <div className="space-y-4">
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
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-primary-hover transition-colors shadow-crisp flex items-center gap-1.5"
            >
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Update Subject' : 'Save Subject'}</span>
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
            Master Subject & Faculty Catalog ({deanSubjects.length})
          </h3>
          <span className="text-xs text-ink-muted font-mono">
            Institution-Wide Master Directory
          </span>
        </div>

        {deanSubjects.length === 0 ? (
          <div className="p-6 text-center bg-surface rounded-card border border-border-beige text-xs sm:text-sm text-ink-muted">
            No subjects added to master catalog yet. Use the form above to add subjects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deanSubjects.map((subject) => (
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
                      {subject.facultyNames.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-canvas-muted text-ink text-[11px] font-medium border border-border-subtle"
                        >
                          {fac}
                        </span>
                      ))}
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
