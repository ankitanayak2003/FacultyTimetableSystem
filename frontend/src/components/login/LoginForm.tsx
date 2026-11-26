import React, { useState } from 'react';
import { Mail, LogIn, Loader2, CheckCircle2, UserPlus, AlertCircle } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { PasswordInput } from './PasswordInput';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { UserRole, LoginFormData, FormErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

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

  const { loginWithEmailPassword, loginWithGoogle, authError, clearAuthError } = useAuth();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details: string;
  } | null>(null);

  const isAuthBusy = isLoading || isGoogleLoading;

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

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid academic email address.';
    }

    if (!formData.password || formData.password.length < 6) {
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
    if (authError) {
      clearAuthError();
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
    if (authError) {
      clearAuthError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthBusy) return;

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setAuthFeedback(null);
    try {
      const verifiedUser = await loginWithEmailPassword(
        formData.email,
        formData.password,
        formData.rememberMe,
        formData.role
      );
      setAuthFeedback({
        type: 'success',
        message: 'Authentication Verified',
        details: `Signed in as ${verifiedUser.displayName} (${verifiedUser.role}). Redirecting to designated dashboard workspace...`,
      });
      if (onLoginSuccess) {
        onLoginSuccess(verifiedUser.role);
      }
    } catch (err: any) {
      setAuthFeedback({
        type: 'error',
        message: 'Sign In Failed',
        details: err?.message || 'Unable to verify credentials. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isAuthBusy) return;
    setIsGoogleLoading(true);
    setAuthFeedback(null);
    clearAuthError();
    try {
      const verifiedUser = await loginWithGoogle(formData.role);
      if (verifiedUser) {
        setAuthFeedback({
          type: 'success',
          message: 'Google Identity Verified',
          details: `Signed in as ${verifiedUser.displayName} (${verifiedUser.role}). Redirecting to designated dashboard workspace...`,
        });
        if (onLoginSuccess) {
          onLoginSuccess(verifiedUser.role);
        }
      }
    } catch (err: any) {
      setAuthFeedback({
        type: 'error',
        message: 'Google Sign-In Denied',
        details: err?.message || 'Your Google account is not authorized for AQS access.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
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

      {/* Auth Feedback / Error Banner */}
      {(authFeedback || authError) && (
        <div
          role={authFeedback?.type === 'success' ? 'status' : 'alert'}
          className={`mb-4 p-3 rounded-card border bg-surface shadow-crisp animate-fade-in flex items-start gap-2.5 ${
            authFeedback?.type === 'success' ? 'border-border-beige' : 'border-error/40'
          }`}
        >
          <div
            className={`p-1 rounded-full flex-shrink-0 mt-0.5 ${
              authFeedback?.type === 'success'
                ? 'bg-success-container/70 text-success'
                : 'bg-error/10 text-error'
            }`}
          >
            {authFeedback?.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div className="text-xs">
            <div className="font-semibold text-ink">
              {authFeedback ? authFeedback.message : 'Authentication Notice'}
            </div>
            <div className="text-ink-muted mt-0.5 leading-snug">
              {authFeedback ? authFeedback.details : authError}
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
        <div className="pt-1.5 space-y-2.5">
          <button
            type="submit"
            disabled={isAuthBusy}
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
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-border-subtle" />
            <span className="flex-shrink mx-3 text-[11px] font-mono uppercase tracking-wider text-ink-light">
              or
            </span>
            <div className="flex-grow border-t border-border-subtle" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthBusy}
            className="w-full py-2.5 px-4 bg-surface text-ink text-sm font-semibold rounded-card border border-border-beige hover:bg-canvas-muted transition-colors shadow-crisp-sm flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-wait"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continue with Google</span>
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
