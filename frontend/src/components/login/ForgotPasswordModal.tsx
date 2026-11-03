import React, { useState } from 'react';
import { X, Mail, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Institutional email address is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid college email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-surface rounded-card border border-border-beige shadow-crisp-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-canvas-muted/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 id="forgot-password-title" className="font-headline text-lg font-semibold text-primary">
              Institutional Credential Recovery
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label="Close dialog"
            className="p-1 text-ink-muted hover:text-ink rounded hover:bg-canvas-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-3">
              <div className="w-12 h-12 rounded-full bg-success-container/70 text-success mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-headline text-lg font-medium text-ink mb-1">
                Recovery Request Registered
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed mb-4">
                In this preview phase, password reset tokens are simulated. For live deployment, instructions will be routed to{' '}
                <span className="font-mono font-medium text-ink">{email}</span> through the SMVITM Administrative Mail Relay.
              </p>
              <div className="p-3 bg-canvas-muted rounded text-xs text-ink-muted border border-border-subtle mb-5 text-left">
                <span className="font-semibold text-primary block mb-0.5">Note on Faculty Credentials:</span>
                Principal, Dean, HOD, and Faculty password overrides may also be expedited directly by contacting the Academic Dean’s Office (Bantakal Campus).
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed">
                Enter your verified college email address. A password recovery verification protocol will be triggered for your academic account.
              </p>

              <div>
                <label htmlFor="recovery-email" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                  Institutional Email <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="name@sode-edu.in"
                    className={`w-full pl-9 pr-3 py-2.5 bg-surface text-ink text-sm rounded-card border transition-all ${
                      error
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                    }`}
                  />
                </div>
                {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink rounded-card border border-border-beige hover:bg-canvas-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
                >
                  Send Recovery Link <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
