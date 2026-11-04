import React from 'react';
import {
  Clock,
  BookOpen,
  Scale,
  CalendarDays,
  BookmarkCheck,
  MapPin,
  ArrowRight,
  Info,
  Calendar,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import {
  FacultyProfileData,
  FACULTY_ODD_TIMETABLE,
  FACULTY_WORKLOAD_BREAKDOWN,
  INITIAL_LEAVE_REQUESTS,
  FacultyNotificationItem,
} from '../../data/facultyDemoData';
import { FacultyTab } from './FacultySidebar';

interface FacultyOverviewProps {
  faculty: FacultyProfileData;
  onNavigateToTab: (tab: FacultyTab) => void;
  preferenceStatus: string;
  notifications: FacultyNotificationItem[];
}

export const FacultyOverview: React.FC<FacultyOverviewProps> = ({
  faculty,
  onNavigateToTab,
  preferenceStatus,
  notifications,
}) => {
  // Monday's teaching slots
  const todaysSchedule = FACULTY_ODD_TIMETABLE.filter(
    (s) => s.day === 'Monday'
  ).sort((a, b) => a.period - b.period);

  // Recent 3 notifications
  const recentNotifs = notifications.slice(0, 3);

  // Active leaves summary
  const pendingLeaves = INITIAL_LEAVE_REQUESTS.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = INITIAL_LEAVE_REQUESTS.filter((l) => l.status === 'Approved').length;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-mono font-medium mb-3">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Academic Year {faculty.academicYear} • Odd Semester</span>
            </div>

            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary-dark tracking-tight leading-tight">
              Welcome back, {faculty.fullName}!
            </h2>

            <p className="text-sm text-ink-muted leading-relaxed mt-1.5">
              Review your teaching schedule, laboratory commitments, and submit your elective preferences for the Department of{' '}
              <strong className="text-ink font-semibold">{faculty.department}</strong>.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded bg-canvas-muted text-ink-light text-xs font-mono border border-border-subtle">
              <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Faculty Portal • Frontend Demonstration Mode</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToTab('preferences')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Subject Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('leaves')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface text-ink text-xs font-semibold rounded-card border border-border-beige hover:bg-canvas-muted transition-colors shadow-crisp-sm"
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Assigned Workload */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Assigned Load
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            {faculty.assignedWeeklyHours} <span className="text-sm font-sans font-normal text-ink-muted">Hrs/Wk</span>
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>{faculty.maxWeeklyWorkload - faculty.assignedWeeklyHours} Hrs Available</span>
            <span className="font-mono text-success font-semibold">Optimal</span>
          </div>
        </div>

        {/* Card 2: Max Workload Cap */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Maximum Norm
            </span>
            <div className="p-1.5 rounded bg-accent-teal/15 text-accent-teal">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            {faculty.maxWeeklyWorkload} <span className="text-sm font-sans font-normal text-ink-muted">Hrs/Wk</span>
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>VTU Guidelines</span>
            <span className="font-mono text-accent-teal font-semibold">Associate Prof</span>
          </div>
        </div>

        {/* Card 3: Assigned Subjects */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Courses Handled
            </span>
            <div className="p-1.5 rounded bg-accent-violet/15 text-accent-violet">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            3 Subjects
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>2 Theory + 1 Lab</span>
            <span className="font-mono text-accent-violet font-semibold">Sem 4 (A &amp; B)</span>
          </div>
        </div>

        {/* Card 4: Subject Preferences Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Preferences
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-xl font-bold text-ink truncate">
            {preferenceStatus}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>Even Sem 26–27</span>
            <span className="font-mono text-primary font-semibold">3 Logged</span>
          </div>
        </div>

        {/* Card 5: Leave Request Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Leave Status
            </span>
            <div className="p-1.5 rounded bg-canvas-muted text-ink">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="font-headline text-xl font-bold text-ink">
            {pendingLeaves > 0 ? `${pendingLeaves} Pending` : `${approvedLeaves} Approved`}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>Duty Leave (OOD)</span>
            <span className="font-mono text-accent-teal font-semibold">Dean Review</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule + Notifications/Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Today's Schedule */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-beige shadow-crisp p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <div>
              <h3 className="font-headline text-lg font-semibold text-primary">
                Today's Teaching Schedule (Monday)
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Instructional lectures and tutorial sessions allocated for today.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('timetable')}
              className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-2 flex items-center gap-1"
            >
              <span>Weekly Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaysSchedule.map((slot) => {
              const isLab = slot.type === 'Laboratory';
              return (
                <div
                  key={slot.id}
                  className="p-3.5 bg-canvas-paper/70 hover:bg-canvas-muted rounded-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 flex-shrink-0 text-center py-1.5 px-2 rounded bg-surface border border-border-subtle font-mono text-xs">
                      <span className="font-bold text-primary block">
                        Period {slot.period}
                      </span>
                      <span className="text-[10px] text-ink-light">
                        {slot.time.split(' - ')[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isLab ? 'text-accent-teal' : 'text-primary'
                          }`}
                        >
                          {slot.courseCode}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-surface border border-border-subtle text-ink-light">
                          {slot.classSection}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary-subtle text-primary">
                          {slot.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-headline font-semibold text-ink leading-tight">
                        {slot.courseTitle}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                    <span className="font-mono text-[11px] text-ink-muted">
                      {slot.time}
                    </span>
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-surface border border-border-subtle font-semibold text-ink flex items-center gap-1 flex-shrink-0">
                      <MapPin className="w-3 h-3 text-primary" />
                      {slot.room}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Workload Equilibrium snippet */}
          <div className="mt-5 p-3.5 bg-canvas-muted rounded-card border border-border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-ink font-medium">
                Workload Balance: {FACULTY_WORKLOAD_BREAKDOWN.assignedHours} of {FACULTY_WORKLOAD_BREAKDOWN.maxHours} Hours Assigned
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('workload')}
              className="text-primary font-semibold hover:underline text-xs"
            >
              View Workload Details →
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Department Announcements */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h4 className="font-headline font-semibold text-sm text-ink">
                  Department Notices
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('notifications')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentNotifs.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-card bg-canvas-paper border border-border-subtle hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface text-ink-light border border-border-subtle">
                      {n.category}
                    </span>
                    <span className="text-[10px] font-mono text-ink-light">
                      {n.timestamp}
                    </span>
                  </div>
                  <h5 className="text-xs font-headline font-semibold text-ink leading-snug line-clamp-1">
                    {n.title}
                  </h5>
                  <p className="text-[11px] text-ink-muted leading-tight mt-1 line-clamp-2">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Academic Calendar Callout */}
          <div className="p-4 bg-canvas-paper rounded-card border border-border-beige text-xs text-ink-muted space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-light block">
              Academic Milestone
            </span>
            <div className="font-headline text-sm font-semibold text-primary">
              CIE-1 &amp; Mid-Term Review
            </div>
            <p className="text-[11px] leading-relaxed text-ink-light">
              Continuous Internal Evaluation scheduled between Nov 24–28. Question paper templates available via Department Coordinator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
