import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ShieldCheck, Award, Building2, BookOpen, CalendarRange, UserCheck, GraduationCap } from 'lucide-react';
import { UserRole, RoleOption } from '../../types/auth';

export const USER_ROLES: RoleOption[] = [
  {
    id: 'Principal',
    label: 'Principal',
    description: 'Executive governance, final approval & institutional oversight',
    badge: 'Executive',
  },
  {
    id: 'Dean',
    label: 'Dean',
    description: 'Academic council, curriculum audits & workload policies',
    badge: 'Council',
  },
  {
    id: 'HOD',
    label: 'HOD',
    description: 'Department leadership, course allocation & timetable ratification',
    badge: 'Department',
  },
  {
    id: 'Basic Science Coordinator',
    label: 'Basic Science Coordinator',
    description: 'First-year & foundational sciences batch synchronization',
    badge: 'First Year',
  },
  {
    id: 'Department Coordinator',
    label: 'Department Coordinator',
    description: 'Timetable crafting, lab allotting & constraint solving',
    badge: 'Operations',
  },
  {
    id: 'Faculty',
    label: 'Faculty',
    description: 'Personalized teaching schedule, room reservations & workload view',
    badge: 'Teaching',
  },
  {
    id: 'Student',
    label: 'Student',
    description: 'Section timetable access, room allocations & elective schedules',
    badge: 'Scholar',
  },
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Principal':
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'Dean':
        return <Award className="w-4 h-4 text-accent-violet" />;
      case 'HOD':
        return <Building2 className="w-4 h-4 text-accent-teal" />;
      case 'Basic Science Coordinator':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'Department Coordinator':
        return <CalendarRange className="w-4 h-4 text-accent-teal" />;
      case 'Faculty':
        return <UserCheck className="w-4 h-4 text-accent-violet" />;
      case 'Student':
        return <GraduationCap className="w-4 h-4 text-primary" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoleData = USER_ROLES.find((r) => r.id === selectedRole) || USER_ROLES[0];

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label
        id="role-selector-label"
        className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5"
      >
        Select Institutional Role <span className="text-primary">*</span>
      </label>

      <button
        type="button"
        aria-labelledby="role-selector-label"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-surface rounded-card border transition-all text-left ${
          error
            ? 'border-error ring-1 ring-error'
            : isOpen
            ? 'border-primary ring-1 ring-primary shadow-crisp'
            : 'border-border-beige hover:border-ink-light'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded bg-canvas-muted border border-border-subtle flex-shrink-0">
            {getRoleIcon(selectedRole)}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink truncate">
                {activeRoleData.label}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-canvas-muted text-ink-muted font-medium border border-border-subtle">
                {activeRoleData.badge}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {activeRoleData.description}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-ink-muted transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {error && (
        <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
          {error}
        </p>
      )}

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="role-selector-label"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface rounded-card border border-border-beige shadow-crisp-lg overflow-hidden py-1 max-h-72 overflow-y-auto"
        >
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-light border-b border-border-subtle bg-canvas-paper">
            Designated System Authorities (7 Roles)
          </div>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary-subtle text-primary border-l-4 border-primary'
                    : 'hover:bg-canvas-muted text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1 rounded bg-canvas-paper border border-border-subtle flex-shrink-0">
                    {getRoleIcon(role.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{role.label}</span>
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-surface border border-border-subtle text-ink-muted">
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
                      {role.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
