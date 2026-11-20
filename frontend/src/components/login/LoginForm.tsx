import React, { useState } from 'react';
import { Mail, LogIn, Loader2, CheckCircle2, UserPlus } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { PasswordInput } from './PasswordInput';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { UserRole, LoginFormData, FormErrors } from '../../types/auth';

interface LoginFormProps {
  onNavigateToStudentRegistration: () => void;
  initialEmail?: string;
  onLoginSuccess?: (role: UserRole) => void;
  onNavigateToClassSchedule?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onNavigateToStudentRegistration,
  initialEmail = '',
  onLoginSuccess,
  onNavigateToClassSchedule,
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: initialEmail || '',
    password: '',
    role: 'Faculty',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
    details: string;
  } | null>(null);

  const getEmailPlaceholder = (role: UserRole) => {
    switch (role) {
      case 'Principal':
        return 'principal@sode-edu.in';
      case 'Dean':
        return 'dean.academics@sode-edu.in';
      case 'HOD':
        return 'hod.cse@sode-edu.in';
      case 'Basic Science Coordinator':
        return 'coord.basicsci@sode-edu.in';
      case 'Department Coordinator':
        return 'coord.timetable@sode-edu.in';
      case 'Faculty':
        return 'faculty.name@sode-edu.in';
      case 'Student':
        return 'ananya.22ai@sode-edu.in';
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.role) {
      newErrors.role = 'Please designate your institutional role.';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid academic email address.';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (authFeedback) {
      setAuthFeedback(null);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: undefined }));
    }
    if (authFeedback) {
      setAuthFeedback(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setAuthFeedback({
        type: 'success',
        message: 'Authentication Verified',
        details: `Signed in as ${formData.role}. Redirecting to designated dashboard workspace...`,
      });

      if (onLoginSuccess) {
        onLoginSuccess(formData.role);
      }
    }, 600);
  };

  return (
    <div className="w-full">
      {/* Header matching Dean reference */}
      <div className="mb-5">
        <h2 className="font-headline text-3xl font-semibold text-primary tracking-tight">
          Portal Sign In
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Institutional Access &amp; Authentication
        </p>
      </div>

      {/* Auth Feedback Banner */}
      {authFeedback && (
        <div
          role="status"
          className="mb-4 p-3 rounded-card border bg-surface border-border-beige shadow-crisp animate-fade-in flex items-start gap-2.5"
        >
          <div className="p-1 rounded-full bg-success-container/70 text-success flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-ink">{authFeedback.message}</div>
            <div className="text-ink-muted mt-0.5 leading-snug">
              {authFeedback.details}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-canvas-muted text-ink-muted border border-border-subtle">
                Role: {formData.role}
              </span>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-canvas-muted text-ink-muted border border-border-subtle">
                Remember: {formData.rememberMe ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Role Selector */}
        <RoleSelector
          selectedRole={formData.role}
          onSelectRole={handleRoleSelect}
          error={errors.role}
        />

        {/* Email Input */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
          >
            Institutional Email <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={getEmailPlaceholder(formData.role)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`w-full pl-9 pr-4 py-2.5 bg-surface text-ink text-sm rounded-card border transition-all ${
                errors.email
                  ? 'border-error focus:ring-1 focus:ring-error'
                  : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
              } placeholder:text-ink-light`}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="mt-1 text-xs text-error font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border-beige text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
            />
            <span className="text-xs text-ink-muted">Remember this device</span>
          </label>

          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-xs font-medium text-primary hover:text-primary-hover hover:underline underline-offset-2 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Institutional Access...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In as {formData.role}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Student Registration Link / CTA */}
      <div className="mt-6 pt-5 border-t border-border-subtle">
        <div className="p-3 bg-canvas-muted rounded-card border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2.5 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded bg-surface border border-border-subtle text-primary flex-shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-ink block truncate">
                Enrolled Student?
              </span>
              <span className="text-[11px] text-ink-muted">
                <button
                  type="button"
                  onClick={onNavigateToStudentRegistration}
                  className="hover:underline hover:text-primary transition-colors text-left font-medium"
                >
                  Create an account
                </button>{' '}
                or{' '}
                <button
                  type="button"
                  onClick={onNavigateToClassSchedule}
                  className="hover:underline hover:text-primary font-medium text-primary transition-colors text-left"
                >
                  view your class schedule
                </button>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToStudentRegistration}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-surface text-primary hover:bg-primary hover:text-white border border-border-beige text-xs font-semibold rounded transition-colors shadow-crisp-sm flex-shrink-0"
          >
            Register as Student
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={formData.email}
      />
    </div>
  );
};
