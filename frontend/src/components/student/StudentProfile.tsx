import React from 'react';
import {
  User,
  Mail,
  Hash,
  Building,
  GraduationCap,
  Award,
  MapPin,
  Lock,
} from 'lucide-react';
import {
  StudentProfileData,
  ENROLLED_COURSES,
} from '../../data/studentDemoData';

interface StudentProfileProps {
  student: StudentProfileData;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ student }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 text-primary font-headline text-2xl font-bold flex items-center justify-center flex-shrink-0 font-mono">
              AR
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
                  {student.degree}
                </span>
                <span className="text-[11px] font-mono text-ink-light">
                  Batch {student.admissionBatch}
                </span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary-dark">
                {student.fullName}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {student.department} • {student.collegeName}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Scholar Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container/70 text-success text-xs font-mono font-medium border border-success/30">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>{student.status}</span>
            </span>
          </div>
        </div>

        {/* Read-Only Academic Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {/* USN */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Hash className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                University Seat Number (USN)
              </span>
            </div>
            <div className="font-mono text-base font-bold text-ink pl-5">
              {student.usn}
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
              {student.email}
            </div>
          </div>

          {/* Department */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Department &amp; Section
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {student.departmentCode} — {student.section}
            </div>
          </div>

          {/* Semester & Term */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Active Term
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {student.semester} ({student.academicYear})
            </div>
          </div>

          {/* Academic Standing */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Cumulative Performance
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-ink pl-5">
              CGPA: <span className="text-primary font-bold">{student.cgpa}</span> / 10.0
            </div>
          </div>

          {/* Assigned Faculty Proctor */}
          <div className="p-3.5 rounded-card bg-canvas-paper border border-border-subtle">
            <div className="flex items-center gap-2 text-ink-light text-xs mb-1">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold uppercase font-mono tracking-wider">
                Assigned Proctor
              </span>
            </div>
            <div className="text-xs font-semibold text-ink pl-5">
              {student.proctorName}
            </div>
          </div>
        </div>

        {/* Read-Only Notice */}
        <div className="mt-6 p-3 rounded-card bg-canvas-muted border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primary font-semibold">Institutional Read-Only Access:</strong>{' '}
            Scholar profiles are synchronized automatically with the Visvesvaraya Technological University (VTU) portal and institutional registrar. For semester branch changes or proctor reassignments, contact the Academic Office.
          </p>
        </div>
      </div>

      {/* Enrolled Courses for Current Semester */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-lg font-semibold text-primary">
              Registered Course Allocations
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Curriculum subjects and laboratories assigned for {student.semester} ({student.academicYear}).
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
            7 VTU Subjects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-beige text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3">Course Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3">Course Type</th>
                <th className="p-3">Faculty In-Charge</th>
                <th className="p-3">Credits (L:T:P)</th>
                <th className="p-3 text-right">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border-subtle">
              {ENROLLED_COURSES.map((course) => {
                const isLab = course.type === 'Laboratory';
                return (
                  <tr key={course.code} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">
                      {course.code}
                    </td>
                    <td className="p-3 font-medium text-ink">
                      {course.title}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          isLab
                            ? 'bg-accent-teal/15 text-accent-teal'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {course.type}
                      </span>
                    </td>
                    <td className="p-3 text-ink-muted">
                      <div>{course.faculty}</div>
                      <div className="text-[10px] text-ink-light">{course.facultyDesignation}</div>
                    </td>
                    <td className="p-3 font-mono text-ink-muted">
                      {course.credits}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded bg-canvas-paper border border-border-subtle text-ink">
                        <MapPin className="w-3 h-3 text-primary" />
                        {course.room}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
