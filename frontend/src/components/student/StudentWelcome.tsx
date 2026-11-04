import React from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Info,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  StudentProfileData,
  WEEKLY_TIMETABLE_SLOTS,
  ENROLLED_COURSES,
  TIMETABLE_METADATA,
} from '../../data/studentDemoData';
import { StudentTab } from './StudentSidebar';

interface StudentWelcomeProps {
  student: StudentProfileData;
  onNavigateToTab: (tab: StudentTab) => void;
  isPublished: boolean;
}

export const StudentWelcome: React.FC<StudentWelcomeProps> = ({
  student,
  onNavigateToTab,
  isPublished,
}) => {
  // Get Monday's schedule as representative "Today's Schedule"
  const todaysSchedule = WEEKLY_TIMETABLE_SLOTS.filter(
    (s) => s.day === 'Monday'
  ).sort((a, b) => a.period - b.period);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            {/* Academic Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-mono font-medium mb-3">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Academic Year {student.academicYear} • {student.semester}</span>
            </div>

            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary-dark tracking-tight leading-tight">
              Welcome back, {student.fullName}!
            </h2>

            <p className="text-sm text-ink-muted leading-relaxed mt-1.5">
              Access your personal weekly academic timetable, classroom allocations, and laboratory schedules for the Department of{' '}
              <strong className="text-ink font-semibold">{student.department}</strong> ({student.section}).
            </p>

            {/* Demo Notice */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded bg-canvas-muted text-ink-light text-xs font-mono border border-border-subtle">
              <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Frontend Demonstration View • Sample Student Data (Read-Only Portal)</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToTab('timetable')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
            >
              <span>Open Full Weekly Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Lectures */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Today's Schedule
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            {isPublished ? `${todaysSchedule.length} Sessions` : '0 Sessions'}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>Core Theory &amp; Remedial</span>
            <span className="font-mono text-primary font-semibold">Monday</span>
          </div>
        </div>

        {/* Card 2: Registered Courses */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Registered Courses
            </span>
            <div className="p-1.5 rounded bg-accent-teal/15 text-accent-teal">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            {ENROLLED_COURSES.length} Subjects
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>22 Total VTU Credits</span>
            <span className="font-mono text-accent-teal font-semibold">CBCS Scheme</span>
          </div>
        </div>

        {/* Card 3: Designated Classroom */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Primary Venue
            </span>
            <div className="p-1.5 rounded bg-accent-violet/15 text-accent-violet">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl font-bold text-ink">
            LH-201
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>Lecture Hall (2nd Floor)</span>
            <span className="font-mono text-accent-violet font-semibold">AI-Lab 01</span>
          </div>
        </div>

        {/* Card 4: Publication Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-light">
              Timetable Status
            </span>
            <div
              className={`p-1.5 rounded ${
                isPublished
                  ? 'bg-success-container/70 text-success'
                  : 'bg-error-container/70 text-error'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-xl font-bold text-ink truncate">
            {isPublished ? 'Published' : 'Under Review'}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center justify-between">
            <span>{TIMETABLE_METADATA.version}</span>
            <span
              className={`font-mono font-semibold ${
                isPublished ? 'text-success' : 'text-error'
              }`}
            >
              {isPublished ? 'Official' : 'Drafting'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Schedule at a Glance + Proctor/Mentor card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Today's Schedule */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border-beige shadow-crisp p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <div>
              <h3 className="font-headline text-lg font-semibold text-primary">
                Today's Schedule at a Glance
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Current day's class lineup and venue distribution for Section A.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('timetable')}
              className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-2 flex items-center gap-1"
            >
              <span>Weekly View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isPublished ? (
            <div className="p-8 text-center bg-canvas-paper rounded-card border border-border-subtle text-ink-muted text-xs">
              Timetable is currently unpublished. Class schedules will display here once ratified.
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysSchedule.map((slot) => {
                const isLab = slot.type === 'Laboratory';
                return (
                  <div
                    key={slot.id}
                    className="p-3 bg-canvas-paper/70 hover:bg-canvas-muted rounded-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 flex-shrink-0 text-center py-1 px-1.5 rounded bg-surface border border-border-subtle font-mono text-xs">
                        <span className="font-semibold text-primary block">
                          P{slot.period}
                        </span>
                        <span className="text-[10px] text-ink-light">
                          {slot.time.split(' - ')[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isLab ? 'text-accent-teal' : 'text-primary'
                            }`}
                          >
                            {slot.courseCode}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-ink-light">
                            {slot.type}
                          </span>
                        </div>
                        <h5 className="text-xs font-headline font-semibold text-ink leading-tight mt-0.5">
                          {slot.courseTitle}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-ink-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                      <span className="text-[11px] truncate">{slot.faculty}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface border border-border-subtle font-semibold text-ink flex items-center gap-1 flex-shrink-0">
                        <MapPin className="w-3 h-3 text-primary" />
                        {slot.room}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Proctor / Mentor Card & Campus Notes */}
        <div className="lg:col-span-4 space-y-4">
          {/* Proctor Information Card */}
          <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
              <UserCheck className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-semibold text-sm text-ink">
                Assigned Faculty Proctor
              </h4>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center font-mono text-sm flex-shrink-0">
                SB
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-ink block truncate">
                  {student.proctorName}
                </span>
                <span className="text-[11px] text-ink-light block truncate">
                  {student.proctorDepartment}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-ink-muted pt-2 border-t border-border-subtle">
              <div className="flex justify-between">
                <span className="text-ink-light">Proctor Email:</span>
                <span className="font-mono font-medium text-ink truncate ml-2">
                  {student.proctorEmail}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-light">Meeting Slot:</span>
                <span className="font-mono font-medium text-primary">
                  Tue 04:00 PM (P7)
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Contact / Help Note */}
          <div className="p-4 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Building className="w-4 h-4" />
              <span>Timetable Inquiries</span>
            </div>
            <p className="leading-relaxed text-[11px] text-ink-light">
              For clashes, room adjustments, or lab batch reallocations, reach out to your Department Timetable Coordinator or HOD office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
