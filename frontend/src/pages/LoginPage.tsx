import React, { useState } from 'react';
import { Calendar, ShieldCheck, Cpu } from 'lucide-react';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';
import { LoginForm } from '../components/login/LoginForm';
import { StudentRegistration } from '../components/login/StudentRegistration';
import { SchedulePreview } from '../components/login/SchedulePreview';

type AuthView = 'login' | 'student-registration';

export const LoginPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  const handleRegistrationSuccess = (registeredEmail: string) => {
    setPrefilledEmail(registeredEmail);
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top Institutional Header */}
      <InstitutionalHeader />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 academic-grid-pattern">
        <div className="w-full max-w-6xl mx-auto">
          {/* Card Wrapper with refined borders */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
            {/* Left Section: Branding & Timetable Preview (Columns: 5 or 6) */}
            <div className="lg:col-span-5 xl:col-span-6 bg-canvas-paper p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border-beige flex flex-col justify-between">
              <div>
                {/* Academic Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-mono font-medium mb-5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Academic Year 2026–2027 • Odd Semester</span>
                </div>

                {/* System Title & Tagline */}
                <h1 className="font-headline text-3xl sm:text-4xl font-semibold text-primary-dark leading-[1.15] tracking-tight mb-3">
                  Faculty Workload &amp; Timetable Management System
                </h1>
                <p className="text-sm text-ink-muted leading-relaxed mb-6">
                  Intelligent academic scheduling and automated faculty workload optimization platform built for SMVITM departments.
                </p>

                {/* Scheduling Visual Representation */}
                <div className="mt-2 mb-6">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-light mb-2 flex items-center justify-between">
                    <span>Live Timetable Allocation Preview</span>
                    <span className="text-[10px] text-accent-teal font-medium">VTU Curriculum Compliant</span>
                  </div>
                  <SchedulePreview />
                </div>
              </div>

              {/* Bottom Institutional Seal / Footer note */}
              <div className="pt-6 border-t border-border-subtle mt-4 flex items-center justify-between text-xs text-ink-light">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-medium">SMVITM Bantakal, Udupi</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-accent-teal" />
                  <span>AI/CP Solver Assisted</span>
                </div>
              </div>
            </div>

            {/* Right Section: Interactive Auth Form (Columns: 7 or 6) */}
            <div className="lg:col-span-7 xl:col-span-6 bg-surface p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              <div className="w-full max-w-md mx-auto">
                {currentView === 'login' ? (
                  <LoginForm
                    initialEmail={prefilledEmail}
                    onNavigateToStudentRegistration={() =>
                      setCurrentView('student-registration')
                    }
                  />
                ) : (
                  <StudentRegistration
                    onBackToLogin={() => setCurrentView('login')}
                    onSuccessRedirect={handleRegistrationSuccess}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Simple Academic Footer */}
          <footer className="mt-6 text-center text-xs text-ink-muted">
            <p>
              © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM).
              All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-ink-light">
              Autonomous Workload Balancing &amp; Timetable Generation Engine • Affiliated to VTU Belagavi
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
