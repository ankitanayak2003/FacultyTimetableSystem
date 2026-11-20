import React, { useState } from 'react';
import {
  Atom,
  FlaskConical,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import {
  BasicScienceSubject,
  REGISTERED_FACULTY_NAMES,
} from '../../data/workflowDemoData';

const SUBJECT_TYPES: BasicScienceSubject['type'][] = ['Theory', 'Practical', 'Integrated'];

interface CycleSectionProps {
  cycle: 'Physics' | 'Chemistry';
  subjects: BasicScienceSubject[];
  softConstraints: string;
  onSaveConstraints: (text: string) => void;
  onAddSubject: (sub: Omit<BasicScienceSubject, 'id'>) => void;
  onUpdateSubject: (id: string, updates: Partial<BasicScienceSubject>) => void;
  onDeleteSubject: (id: string) => void;
}

const CycleAllocationSection: React.FC<CycleSectionProps> = ({
  cycle,
  subjects,
  softConstraints,
  onSaveConstraints,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState<BasicScienceSubject['type']>('Theory');
  const [numFaculty, setNumFaculty] = useState<number>(1);
  const [facultySelections, setFacultySelections] = useState<string[]>([
    REGISTERED_FACULTY_NAMES[0],
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Soft constraints local state
  const [constraintsText, setConstraintsText] = useState(softConstraints);
  const [constraintsSaved, setConstraintsSaved] = useState(false);

  // Sync constraints if prop changes
  React.useEffect(() => {
    setConstraintsText(softConstraints);
  }, [softConstraints]);

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

  const handleEditClick = (subject: BasicScienceSubject) => {
    setEditingId(subject.id);
    setSubjectName(subject.name);
    setSubjectCode(subject.code);
    setSubjectType(subject.type);
    setNumFaculty(subject.numFaculty || subject.facultyNames.length || 1);
    setFacultySelections(
      subject.facultyNames.length > 0 ? subject.facultyNames : [REGISTERED_FACULTY_NAMES[0]]
    );
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectType('Theory');
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
      onUpdateSubject(editingId, {
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        type: subjectType,
        numFaculty,
        facultyNames: assigned,
        cycle,
      });
      setSuccessMsg(`Subject ${subjectCode.trim().toUpperCase()} updated successfully in ${cycle} Cycle.`);
      handleCancelEdit();
    } else {
      onAddSubject({
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        type: subjectType,
        numFaculty,
        facultyNames: assigned,
        cycle,
      });
      setSuccessMsg(`Subject ${subjectCode.trim().toUpperCase()} added to ${cycle} Cycle.`);
      setSubjectName('');
      setSubjectCode('');
      setSubjectType('Theory');
      setNumFaculty(1);
      setFacultySelections([REGISTERED_FACULTY_NAMES[0]]);
      setErrorMsg('');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Remove subject ${code} from ${cycle} Cycle master list?`)) {
      onDeleteSubject(id);
      if (editingId === id) handleCancelEdit();
    }
  };

  const handleSaveConstraints = () => {
    onSaveConstraints(constraintsText);
    setConstraintsSaved(true);
    setTimeout(() => setConstraintsSaved(false), 3000);
  };

  const handleClearConstraints = () => {
    setConstraintsText('');
    onSaveConstraints('');
    setConstraintsSaved(false);
  };

  const CycleIcon = cycle === 'Physics' ? Atom : FlaskConical;

  return (
    <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 sm:p-5 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-beige">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center flex-shrink-0">
            <CycleIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                First-Year Foundation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary">
                {cycle} Cycle
              </span>
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary">
              {cycle} Cycle — Subject &amp; Faculty Allocation
            </h2>
          </div>
        </div>

        <div className="text-xs font-mono text-ink-muted">
          {subjects.length} Subjects Defined
        </div>
      </div>

      {/* Subject Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 bg-canvas-paper p-3.5 sm:p-4 rounded border border-border-beige">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
            {editingId ? `Edit ${cycle} Subject` : `Add New ${cycle} Subject`}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-mono"
            >
              <X className="w-3.5 h-3.5" /> Cancel Edit
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 font-mono">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-mono flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Subject Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Subject Name *
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder={cycle === 'Physics' ? 'e.g. Engineering Physics' : 'e.g. Engineering Chemistry'}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Subject Code */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Subject Code *
            </label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder={cycle === 'Physics' ? 'e.g. 22PHY12' : 'e.g. 22CHE12'}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono focus:outline-none focus:border-primary"
            />
          </div>

          {/* Subject Type */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Subject Type *
            </label>
            <select
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value as BasicScienceSubject['type'])}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Faculty */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Number of Faculty *
            </label>
            <select
              value={numFaculty}
              onChange={(e) => handleNumFacultyChange(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary font-semibold"
            >
              <option value={1}>1 Faculty</option>
              <option value={2}>2 Faculty</option>
              <option value={3}>3 Faculty</option>
              <option value={4}>4 Faculty</option>
            </select>
          </div>
        </div>

        {/* Dynamic Faculty Selection Fields */}
        <div className="p-3 sm:p-3.5 bg-canvas rounded border border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink font-semibold">
              Assigned Faculty Members ({facultySelections.length})
            </span>
            <span className="text-[10px] text-ink-muted">
              Select strictly from registered faculty records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {facultySelections.map((selected, idx) => (
              <div key={idx} className="space-y-1">
                <label className="block text-[10px] font-mono text-ink-muted font-medium">
                  Faculty {idx + 1}
                </label>
                <select
                  value={selected}
                  onChange={(e) => handleFacultySelectChange(idx, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface rounded border border-border-beige text-ink font-medium focus:outline-none focus:border-primary"
                >
                  {REGISTERED_FACULTY_NAMES.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3.5 py-1.5 text-xs rounded border border-border-beige text-ink hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white transition-colors shadow-crisp-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? `Update ${cycle} Subject` : `Add Subject to ${cycle} Cycle`}</span>
          </button>
        </div>
      </form>

      {/* Saved Subjects Below Entry Form */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-sm font-semibold text-primary">
            Saved {cycle} Cycle Subjects ({subjects.length})
          </h3>
          <span className="text-[11px] text-ink-muted font-mono">
            Master allocation registry for {cycle} timetable generation
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="p-4 bg-canvas-muted rounded text-xs text-ink-muted text-center border border-dashed border-border-beige">
            No subjects added to {cycle} Cycle yet. Use the form above to add subjects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 bg-surface rounded border border-border-beige shadow-crisp-sm flex flex-col justify-between hover:border-primary transition-all text-xs space-y-2.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-primary text-xs bg-primary-subtle px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas-muted text-ink-muted font-medium">
                      {sub.type}
                    </span>
                  </div>
                  <h4 className="font-medium text-ink mt-1.5 leading-snug line-clamp-2" title={sub.name}>
                    {sub.name}
                  </h4>
                </div>

                <div className="pt-2 border-t border-border-subtle space-y-1 text-[11px]">
                  <span className="text-ink-muted font-mono text-[10px] uppercase block">
                    Faculty Assigned:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sub.facultyNames.map((fn) => (
                      <span
                        key={fn}
                        className="px-1.5 py-0.5 bg-canvas-paper rounded border border-border-subtle font-mono text-[10px] text-ink font-medium"
                      >
                        {fn}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleEditClick(sub)}
                    className="p-1 text-ink-muted hover:text-primary transition-colors"
                    title={`Edit ${sub.code}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sub.id, sub.code)}
                    className="p-1 text-ink-muted hover:text-rose-600 transition-colors"
                    title={`Delete ${sub.code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional Gemini Soft Constraints Multiline Input Box */}
      <div className="p-3.5 sm:p-4 bg-canvas-paper rounded-card border border-border-beige space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-headline text-xs font-semibold text-primary">
              Optional Gemini Soft Constraints ({cycle} Cycle)
            </span>
            <span className="text-[10px] font-mono text-ink-light">
              Optional • Influences generation
            </span>
          </div>

          <div className="flex items-center gap-2">
            {constraintsSaved && (
              <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved for {cycle} Cycle
              </span>
            )}
            {constraintsText && (
              <button
                type="button"
                onClick={handleClearConstraints}
                className="text-[10px] font-mono text-ink-muted hover:text-rose-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear Text
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={3}
          value={constraintsText}
          onChange={(e) => {
            setConstraintsText(e.target.value);
            setConstraintsSaved(false);
          }}
          placeholder="Describe your preferred timetable arrangements here. For example: Prefer morning periods for practical sessions, avoid consecutive difficult subjects, keep laboratory sessions together, or avoid scheduling a particular subject immediately after lunch."
          className="w-full p-2.5 text-xs bg-canvas rounded border border-border-beige text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-primary resize-y font-sans leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-ink-muted">
            Preferences will be interpreted by Gemini during {cycle} timetable generation.
          </span>
          <button
            type="button"
            onClick={handleSaveConstraints}
            className="px-3 py-1 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary hover:border-primary-hover transition-colors shadow-crisp-sm"
          >
            Save Constraints
          </button>
        </div>
      </div>
    </div>
  );
};

export const BasicScienceSubjectAllocation: React.FC = () => {
  const {
    physicsSubjects,
    chemistrySubjects,
    physicsSoftConstraints,
    chemistrySoftConstraints,
    setPhysicsSoftConstraints,
    setChemistrySoftConstraints,
    addBasicScienceSubject,
    updateBasicScienceSubject,
    deleteBasicScienceSubject,
  } = useWorkflow();

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Page Title & Context Header */}
      <div className="p-4 sm:p-5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Basic Science Administration
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary">
            First-Year Curricular Blueprint
          </span>
        </div>
        <h1 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
          Subject &amp; Faculty Allocation
        </h1>
        <p className="text-xs text-ink-muted">
          Define foundational courses, assign certified faculty, and set optional cycle-specific scheduling preferences for first-year cohorts.
        </p>
      </div>

      {/* Two separate sections arranged vertically: Physics Cycle, then Chemistry Cycle */}
      <div className="space-y-6">
        {/* Section 1: Physics Cycle */}
        <CycleAllocationSection
          cycle="Physics"
          subjects={physicsSubjects}
          softConstraints={physicsSoftConstraints}
          onSaveConstraints={setPhysicsSoftConstraints}
          onAddSubject={addBasicScienceSubject}
          onUpdateSubject={updateBasicScienceSubject}
          onDeleteSubject={deleteBasicScienceSubject}
        />

        {/* Section 2: Chemistry Cycle */}
        <CycleAllocationSection
          cycle="Chemistry"
          subjects={chemistrySubjects}
          softConstraints={chemistrySoftConstraints}
          onSaveConstraints={setChemistrySoftConstraints}
          onAddSubject={addBasicScienceSubject}
          onUpdateSubject={updateBasicScienceSubject}
          onDeleteSubject={deleteBasicScienceSubject}
        />
      </div>
    </div>
  );
};
