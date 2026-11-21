import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const USER_ROLES: { id: UserRole; label: string }[] = [
  { id: 'Principal', label: 'Principal' },
  { id: 'Dean', label: 'Dean' },
  { id: 'HOD', label: 'HOD' },
  { id: 'Basic Science Coordinator', label: 'Basic Science Coordinator' },
  { id: 'Department Coordinator', label: 'Department Coordinator' },
  { id: 'Faculty', label: 'Faculty' },
  { id: 'Student', label: 'Student' },
];

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  error?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label
        id="role-selector-label"
        className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
      >
        Select Institutional Role <span className="text-primary">*</span>
      </label>

      {/* Main Role Selector Button – Clean, Prominent Typography */}
      <button
        type="button"
        aria-labelledby="role-selector-label"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-surface rounded-card border transition-all text-left ${
          error
            ? 'border-error ring-1 ring-error'
            : isOpen
            ? 'border-primary ring-1 ring-primary shadow-crisp'
            : 'border-border-beige hover:border-ink-light'
        }`}
      >
        <span className="text-base sm:text-lg font-bold text-ink truncate">
          {selectedRole}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-ink-muted transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {error && (
        <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Dropdown Options List – Pure Role Names with Bold Typography */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="role-selector-label"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface rounded-card border border-border-beige shadow-crisp-lg overflow-hidden py-1 max-h-72 overflow-y-auto"
        >
          {USER_ROLES.map((role) => {
            const isSelected = role.id === selectedRole;
            return (
              <button
                key={role.id}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  onSelectRole(role.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary-subtle text-primary font-bold border-l-4 border-primary'
                    : 'hover:bg-canvas-muted text-ink font-semibold'
                }`}
              >
                <span className="text-base sm:text-lg">{role.label}</span>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
