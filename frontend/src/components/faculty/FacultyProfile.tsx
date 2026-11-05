import React from 'react';
import {
  Mail,
  Hash,
  Building,
  GraduationCap,
  Scale,
  Award,
  Lock,
} from 'lucide-react';
import {
  FacultyProfileData,
  FACULTY_WORKLOAD_BREAKDOWN,
} from '../../data/facultyDemoData';

interface FacultyProfileProps {
  faculty: FacultyProfileData;
}

export const FacultyProfile: React.FC<FacultyProfileProps> = ({ faculty }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Profile Header Card */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 text-primary font-headline text-2xl font-bold flex items-center justify-center flex-shrink-0 font-mono">
              AR
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
                  {faculty.designation}
                </span>
                <span className="text-[11px] font-mono text-ink-light">
                  ID: {faculty.facultyId}
                </span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary-dark">
                {faculty.fullName}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Department of {faculty.department} • {faculty.collegeName}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Appointment Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container/70 text-success text-xs font-mono font-medium border border-success/30">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>{faculty.status}</span>
            </span>
          </div>
        </div>

        {/* Read-Only Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {/* Faculty ID */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Hash className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Faculty Identification
              </span>
            </div>
            <div className="font-mono text-base font-bold text-ink pl-5">
              {faculty.facultyId}
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Institutional Email
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-ink pl-5 truncate">
              {faculty.email}
            </div>
          </div>

          {/* Department */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Department &amp; Cadre
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {faculty.departmentCode} — {faculty.designation}
            </div>
          </div>

          {/* Qualification */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Highest Qualification
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {faculty.qualification}
            </div>
          </div>

          {/* Specialization */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Academic Specialization
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {faculty.specialization}
            </div>
          </div>

          {/* Max Workload */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Normative Max Workload
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-ink pl-5">
              {faculty.maxWeeklyWorkload} Hours / Week (AICTE/VTU Cap)
            </div>
          </div>
        </div>

        {/* Read-Only Notice */}
        <div className="mt-6 p-3 rounded-card bg-canvas-muted border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primary font-semibold">Institutional Security Notice:</strong>{' '}
            Faculty academic service records, designations, and maximum workload thresholds are authenticated directly through the University Academic Office and ERP. Profile editing is administratively restricted.
          </p>
        </div>
      </div>

      {/* Active Academic Allotments Card */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-lg font-semibold text-primary">
              Active Instructional Assignments
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Subjects and laboratory batches assigned for Odd Semester 2026–27.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
            {FACULTY_WORKLOAD_BREAKDOWN.assignedHours} Hours / Week
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {FACULTY_WORKLOAD_BREAKDOWN.courses.map((c, i) => (
            <div
              key={i}
              className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-primary">
                    {c.code}
                  </span>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-ink-light">
                    {c.classSection}
                  </span>
                </div>
                <h4 className="font-headline text-xs font-semibold text-ink leading-tight">
                  {c.title}
                </h4>
              </div>

              <div className="text-right flex-shrink-0 font-mono text-xs">
                <span className="font-bold text-primary block">{c.hoursPerWeek} Hrs/Wk</span>
                <span className="text-[10px] text-ink-light font-normal">{c.credits}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
