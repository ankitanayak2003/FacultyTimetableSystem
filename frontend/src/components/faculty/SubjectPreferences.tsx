import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Send,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  AVAILABLE_DEPARTMENT_SUBJECTS,
  AVAILABLE_BASIC_SCIENCE_SUBJECTS,
  AVAILABLE_OPEN_ELECTIVES,
  AVAILABLE_RESPONSIBILITIES,
  SubjectPreferenceItem,
} from '../../data/facultyDemoData';

interface SubjectPreferencesProps {
  preferences: SubjectPreferenceItem[];
  onUpdatePreferences: (items: SubjectPreferenceItem[]) => void;
  status: string;
  onUpdateStatus: (status: string) => void;
}

export const SubjectPreferences: React.FC<SubjectPreferencesProps> = ({
  preferences,
  onUpdatePreferences,
  status,
  onUpdateStatus,
}) => {
  const [semester, setSemester] = useState<'Odd' | 'Even'>('Even');
  const [items, setItems] = useState<SubjectPreferenceItem[]>(preferences);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // New preference row template
  const handleAddPreference = () => {
    const newItem: SubjectPreferenceItem = {
      id: `pref-${Date.now()}`,
      category: 'Department Subject',
      subjectOrActivity: '',
      priority: (Math.min(items.length + 1, 3) as 1 | 2 | 3),
      justification: '',
      remarks: '',
    };
    setItems([...items, newItem]);
  };

  const handleRemovePreference = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleChange = (
    id: string,
    field: keyof SubjectPreferenceItem,
    value: unknown
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSaveDraft = () => {
    onUpdatePreferences(items);
    onUpdateStatus('Draft');
    setFeedbackMessage({
      type: 'info',
      text: 'Subject preference entries saved as Draft. You may continue modifying your priorities.',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setFeedbackMessage({
        type: 'info',
        text: 'Please add at least one subject preference before submitting.',
      });
      return;
    }

    onUpdatePreferences(items);
    onUpdateStatus('Submitted');
    setFeedbackMessage({
      type: 'success',
      text: 'Preferences submitted successfully for Even Semester! Your request has been queued for Department Coordinator and HOD review.',
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'Approved':
        return 'bg-success-container text-success border-success/30';
      case 'Submitted':
        return 'bg-primary-subtle text-primary border-primary/30';
      case 'Under Review':
        return 'bg-accent-violet/15 text-accent-violet border-accent-violet/30';
      case 'Draft':
        return 'bg-canvas-muted text-ink-muted border-border-subtle';
      case 'Rejected':
        return 'bg-error-container text-error border-error/30';
      default:
        return 'bg-canvas-muted text-ink-light border-border-subtle';
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
                Department of AI &amp; DS
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                • Preference Window Open
              </span>
            </div>
            <h2 className="font-headline text-2xl font-semibold text-primary">
              Subject &amp; Elective Preferences
            </h2>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl">
              Express your teaching interests, specialized laboratories, and institutional coordination choices for the upcoming semester.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Submission Status
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getStatusBadge()}`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Institutional Policy Note */}
        <div className="mt-4 p-3 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primary font-semibold">Academic Policy:</strong>{' '}
            Preferences are requests, not confirmed subject allocations. Allocations are resolved through the Department Timetable Committee and Google OR-Tools optimization engine to balance faculty workload.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-card border flex items-center justify-between gap-3 text-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-success-container/60 border-success/30 text-success'
              : 'bg-canvas-muted border-border-subtle text-ink'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-[11px] font-semibold underline text-ink-muted hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Preference Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Semester Selection Bar */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Clock className="w-4 h-4 text-primary" />
            <span>Target Term for Allocation:</span>
          </div>

          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setSemester('Odd')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semester === 'Odd'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Odd Semester (July – Dec)
            </button>
            <button
              type="button"
              onClick={() => setSemester('Even')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semester === 'Even'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Even Semester (Jan – May)
            </button>
          </div>
        </div>

        {/* List of Preferences */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-headline font-semibold text-sm text-ink">
                    Preference Choice #{index + 1}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {/* Priority selector */}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`priority-${item.id}`} className="text-xs font-semibold text-ink-muted">
                      Priority:
                    </label>
                    <select
                      id={`priority-${item.id}`}
                      value={item.priority}
                      onChange={(e) =>
                        handleChange(item.id, 'priority', Number(e.target.value))
                      }
                      className="px-2 py-1 rounded bg-surface border border-border-beige text-xs font-semibold text-ink focus:border-primary shadow-crisp-sm"
                    >
                      <option value={1}>1st Choice (Highest)</option>
                      <option value={2}>2nd Choice</option>
                      <option value={3}>3rd Choice</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePreference(item.id)}
                      title="Remove this preference"
                      aria-label="Remove preference"
                      className="p-1 rounded text-ink-muted hover:text-error hover:bg-error-container/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: Category & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label htmlFor={`cat-${item.id}`} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Preference Category <span className="text-primary">*</span>
                  </label>
                  <select
                    id={`cat-${item.id}`}
                    value={item.category}
                    onChange={(e) => {
                      handleChange(item.id, 'category', e.target.value);
                      handleChange(item.id, 'subjectOrActivity', '');
                    }}
                    className="w-full px-3 py-2 bg-surface text-ink text-xs font-medium rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
                  >
                    <option value="Department Subject">1. Department Core / Lab Subject</option>
                    <option value="Basic Science">2. First-Year Basic Science Subject</option>
                    <option value="Open Elective">3. Open Elective Subject</option>
                    <option value="Additional Responsibility">4. Additional Institutional Responsibility</option>
                  </select>
                </div>

                {/* Specific Subject or Activity Dropdown */}
                <div>
                  <label htmlFor={`subj-${item.id}`} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Select Course or Activity <span className="text-primary">*</span>
                  </label>
                  <select
                    id={`subj-${item.id}`}
                    value={item.subjectOrActivity}
                    onChange={(e) =>
                      handleChange(item.id, 'subjectOrActivity', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-surface text-ink text-xs font-medium rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
                  >
                    <option value="">Choose Course / Assignment...</option>
                    {item.category === 'Department Subject' &&
                      AVAILABLE_DEPARTMENT_SUBJECTS.map((s) => (
                        <option key={s.code} value={`${s.code}: ${s.title} (${s.sem})`}>
                          {s.code}: {s.title} ({s.sem} • {s.credits})
                        </option>
                      ))}

                    {item.category === 'Basic Science' &&
                      AVAILABLE_BASIC_SCIENCE_SUBJECTS.map((s) => (
                        <option key={s.code} value={`${s.code}: ${s.title}`}>
                          {s.code}: {s.title} ({s.sem})
                        </option>
                      ))}

                    {item.category === 'Open Elective' &&
                      AVAILABLE_OPEN_ELECTIVES.map((s) => (
                        <option key={s.code} value={`${s.code}: ${s.title}`}>
                          {s.code}: {s.title} ({s.sem})
                        </option>
                      ))}

                    {item.category === 'Additional Responsibility' &&
                      AVAILABLE_RESPONSIBILITIES.map((r) => (
                        <option key={r.code} value={r.title}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Justification & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`just-${item.id}`} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Academic Justification &amp; Experience
                  </label>
                  <textarea
                    id={`just-${item.id}`}
                    rows={2}
                    value={item.justification}
                    onChange={(e) =>
                      handleChange(item.id, 'justification', e.target.value)
                    }
                    placeholder="e.g. Previous teaching experience, publications, or research background in this domain."
                    className="w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
                  />
                </div>

                <div>
                  <label htmlFor={`rem-${item.id}`} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    Optional Remarks / Batch Preference
                  </label>
                  <textarea
                    id={`rem-${item.id}`}
                    rows={2}
                    value={item.remarks}
                    onChange={(e) =>
                      handleChange(item.id, 'remarks', e.target.value)
                    }
                    placeholder="e.g. Preferred lab batch A1/A2, or tutorial scheduling constraints."
                    className="w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Another Preference Button */}
        <button
          type="button"
          onClick={handleAddPreference}
          className="w-full py-2.5 px-4 rounded-card border-2 border-dashed border-border-beige hover:border-primary text-xs font-semibold text-ink-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5 bg-canvas-paper/50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Subject Preference Choice</span>
        </button>

        {/* Action Buttons: Save Draft & Submit */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-ink-light font-mono">
            * All submissions are date-stamped and queued for Department Timetable Committee review.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-4 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4 text-ink-light" />
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-semibold rounded-card transition-colors shadow-crisp flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Submit Preferences</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
