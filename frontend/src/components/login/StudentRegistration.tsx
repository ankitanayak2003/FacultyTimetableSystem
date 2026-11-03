import React, { useState } from 'react';
import {
  User,
  Mail,
  Hash,
  Building,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { StudentRegistrationData, FormErrors } from '../../types/auth';

interface StudentRegistrationProps {
  onBackToLogin: () => void;
  onSuccessRedirect?: (email: string) => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Data Science',
  'Artificial Intelligence & Machine Learning',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Basic Science & Humanities',
];

const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  onBackToLogin,
  onSuccessRedirect,
}) => {
  const [formData, setFormData] = useState<StudentRegistrationData>({
    fullName: '',
    email: '',
    usn: '',
    department: '',
    semester: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full student name is required.';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Please enter at least 3 characters.';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'College email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g., student@sode-edu.in).';
    }

    // USN
    if (!formData.usn.trim()) {
      newErrors.usn = 'University Seat Number (USN) is required.';
    } else if (formData.usn.trim().length < 6) {
      newErrors.usn = 'Please enter a valid university USN (e.g. 4MW21CS045).';
    }

    // Department
    if (!formData.department) {
      newErrors.department = 'Please select your department of study.';
    }

    // Semester
    if (!formData.semester) {
      newErrors.semester = 'Please select your active academic semester.';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'usn' ? value.toUpperCase() : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate clean client-side submission without backend connection
    setTimeout(() => {
      setIsSubmitting(false);
      setRegistrationSuccess(true);
    }, 1200);
  };

  return (
    <div className="w-full">
      {/* Top back navigation */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Portal Sign In</span>
        </button>
      </div>

      {registrationSuccess ? (
        <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-success-container/70 text-success mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-headline text-2xl font-semibold text-ink mb-1">
            Student Enrollment Registered!
          </h3>
          <p className="text-sm text-ink-muted leading-relaxed mb-5 max-w-md mx-auto">
            Your scholar account profile for{' '}
            <strong className="text-ink">{formData.fullName}</strong> (USN:{' '}
            <span className="font-mono text-primary font-semibold">
              {formData.usn}
            </span>
            ) has been validated.
          </p>

          <div className="p-4 bg-canvas-muted rounded-card border border-border-subtle text-left max-w-md mx-auto text-xs space-y-1.5 mb-6">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-ink-muted">Registered Email:</span>
              <span className="font-mono text-ink font-medium">{formData.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-ink-muted">Department:</span>
              <span className="text-ink font-medium">{formData.department}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-ink-muted">Academic Term:</span>
              <span className="text-ink font-medium">{formData.semester}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-muted">Registration Mode:</span>
              <span className="font-mono text-accent-teal font-medium">Frontend Validated (Phase 1)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                if (onSuccessRedirect) {
                  onSuccessRedirect(formData.email);
                } else {
                  onBackToLogin();
                }
              }}
              className="w-full py-2.5 px-5 bg-primary text-white text-sm font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp flex items-center justify-center gap-2"
            >
              Proceed to Sign In with New Account
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-border-subtle">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold uppercase mb-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Enrollment Portal
              </div>
              <h2 className="font-headline text-2xl font-semibold text-primary">
                Create Student Account
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Enroll with your institutional university credentials to view class timetables.
              </p>
            </div>
          </div>

          {/* Institutional Policy Notice */}
          <div className="p-3 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5 mb-5">
            <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary font-semibold">Institutional Access Policy:</strong>{' '}
              Public registration is restricted to enrolled students only. Faculty, HOD, Coordinator, Dean, and Principal accounts are provisioned exclusively by the Academic Dean's office.
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
              >
                Full Student Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ananya Rao"
                  className={`w-full pl-9 pr-3 py-2 bg-surface text-ink text-sm rounded-card border transition-all ${
                    errors.fullName
                      ? 'border-error focus:ring-1 focus:ring-error'
                      : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-error font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email & USN Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* College Email */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
                >
                  College Email <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@sode-edu.in"
                    className={`w-full pl-9 pr-3 py-2 bg-surface text-ink text-sm rounded-card border transition-all ${
                      errors.email
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-error font-medium">{errors.email}</p>
                )}
              </div>

              {/* Student USN */}
              <div>
                <label
                  htmlFor="reg-usn"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
                >
                  Student USN <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-usn"
                    name="usn"
                    type="text"
                    value={formData.usn}
                    onChange={handleChange}
                    placeholder="4MW21CS045"
                    className={`w-full pl-9 pr-3 py-2 bg-surface font-mono uppercase text-ink text-sm rounded-card border transition-all ${
                      errors.usn
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                    }`}
                  />
                </div>
                {errors.usn && (
                  <p className="mt-1 text-xs text-error font-medium">{errors.usn}</p>
                )}
              </div>
            </div>

            {/* Department & Semester Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label
                  htmlFor="reg-department"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
                >
                  Department <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                    <Building className="w-4 h-4" />
                  </div>
                  <select
                    id="reg-department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-3 py-2 bg-surface text-ink text-sm rounded-card border transition-all appearance-none cursor-pointer ${
                      errors.department
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                    }`}
                  >
                    <option value="">Select Department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <p className="mt-1 text-xs text-error font-medium">{errors.department}</p>
                )}
              </div>

              {/* Semester */}
              <div>
                <label
                  htmlFor="reg-semester"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
                >
                  Semester <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    id="reg-semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-3 py-2 bg-surface text-ink text-sm rounded-card border transition-all appearance-none cursor-pointer ${
                      errors.semester
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
                    }`}
                  >
                    <option value="">Select Semester...</option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.semester && (
                  <p className="mt-1 text-xs text-error font-medium">{errors.semester}</p>
                )}
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                id="reg-password"
                name="password"
                label="Create Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                error={errors.password}
                required
                autoComplete="new-password"
                hint=">= 8 chars"
              />

              <PasswordInput
                id="reg-confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Actions */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Institutional Registration...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Student Registration</span>
                  </>
                )}
              </button>
            </div>

            {/* Return link */}
            <div className="text-center pt-2 text-xs text-ink-muted">
              Already have an institutional student account?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="font-semibold text-primary hover:text-primary-hover underline underline-offset-2"
              >
                Sign In here
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
