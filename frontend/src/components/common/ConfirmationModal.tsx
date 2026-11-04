import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonOrRemarks: string) => void;
  title: string;
  description: string;
  warningNote?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningNote,
  confirmLabel = 'Confirm Action',
  confirmVariant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Enter rationale or remarks...',
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide an explicit rationale before proceeding.');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
  };

  const getVariantButtonClass = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-error text-white hover:bg-error/90 focus:ring-error/30 shadow-crisp-sm';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300 shadow-crisp-sm';
      case 'primary':
      default:
        return 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/30 shadow-crisp-sm';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp-lg w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-start justify-between gap-4 bg-canvas-paper">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-primary-subtle text-primary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-primary">
                {title}
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Workflow Audit Action
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-light hover:text-ink hover:bg-canvas-muted rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            {description}
          </p>

          {warningNote && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-card flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>{warningNote}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {requireReason ? 'Institutional Rationale *' : 'Optional Remarks / Version Notes'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={reasonPlaceholder}
              className={`w-full p-2.5 text-xs rounded-card border bg-canvas-paper text-ink transition-colors focus:outline-none focus:ring-1 ${
                error
                  ? 'border-error ring-error/30'
                  : 'border-border-beige focus:border-primary focus:ring-primary/20'
              }`}
            />
            {error && (
              <p className="text-[11px] text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded text-ink-muted hover:text-ink hover:bg-canvas-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${getVariantButtonClass()}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
