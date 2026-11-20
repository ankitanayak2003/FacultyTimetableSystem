import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  disabled?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  error,
  required = false,
  autoComplete = 'current-password',
  hint,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          {label} {required && <span className="text-primary">*</span>}
        </label>
        {hint && <span className="text-[11px] text-ink-light font-mono">{hint}</span>}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-light">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full pl-9 pr-10 py-2.5 bg-surface text-ink text-sm rounded-card border transition-all ${
            error
              ? 'border-error focus:ring-1 focus:ring-error'
              : 'border-border-beige focus:border-primary focus:ring-1 focus:ring-primary shadow-crisp-sm'
          } placeholder:text-ink-light disabled:opacity-60 disabled:cursor-not-allowed`}
        />

        <button
          type="button"
          tabIndex={0}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-primary transition-colors focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-error font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
