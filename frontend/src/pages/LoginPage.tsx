import React, { useState, useEffect } from 'react';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';
import { LoginForm } from '../components/login/LoginForm';
import { StudentRegistration } from '../components/login/StudentRegistration';
import { AqsBrandLogo } from '../components/common/AqsBrandLogo';
import { UserRole } from '../types/auth';
import slide1 from '../assets/login_slide_1.png';
import slide2 from '../assets/login_slide_2.png';
import slide3 from '../assets/login_slide_3.png';
import slide4 from '../assets/login_slide_4.png';

type AuthView = 'login' | 'student-registration';

export interface LoginPageProps {
  onLoginSuccess?: (role: UserRole) => void;
  onNavigateToClassSchedule?: () => void;
}

interface FeatureSlide {
  title: string;
  description: string;
  image: string;
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    title: 'Smart Academic Planning',
    description: 'Organize academic schedules and institutional teaching requirements.',
    image: slide1,
  },
  {
    title: 'Balanced Faculty Workload',
    description: 'Distribute teaching hours and assignments fairly.',
    image: slide2,
  },
  {
    title: 'Clash-Free Timetables',
    description: 'Avoid overlapping classes, faculty assignments and room bookings.',
    image: slide3,
  },
  {
    title: 'One Connected Campus',
    description: 'Connect administrators, coordinators, faculty and students through one platform.',
    image: slide4,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToClassSchedule,
}) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Automatic 4-second slideshow interval with lifecycle cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleRegistrationSuccess = (registeredEmail: string) => {
    setPrefilledEmail(registeredEmail);
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top Institutional Header */}
      <InstitutionalHeader />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-2.5 sm:p-3 lg:p-4 academic-grid-pattern">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          {/* Card Wrapper: Two-Column Layout matching Dean reference dimensions */}
          <div className="w-full bg-surface rounded-card border border-border-beige shadow-crisp-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[550px] lg:min-h-[580px]">
            {/* LEFT SIDE – Feature Image Slideshow */}
            <div className="lg:col-span-6 bg-canvas-paper p-5 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border-beige flex flex-col justify-between">
              {/* AQS Branding Header */}
              <div>
                <div className="flex flex-col items-start">
                  <h1 className="sr-only">AQS - Academic Quality &amp; Scheduling</h1>
                  <AqsBrandLogo className="h-9 sm:h-11 w-auto max-w-full text-primary-dark" />
                  <p className="text-xs sm:text-sm font-semibold text-ink-muted tracking-wide mt-1 leading-snug">
                    Academic Quality &amp; Scheduling
                  </p>
                </div>
              </div>

              {/* Slideshow Display Area with Floating Image */}
              <div className="relative my-2 flex-1 min-h-[220px] sm:min-h-[240px] flex items-center justify-center overflow-hidden">
                {FEATURE_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeSlideIndex;
                  return (
                    <div
                      key={slide.title}
                      className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${
                        isActive
                          ? 'opacity-100 pointer-events-auto z-10'
                          : 'opacity-0 pointer-events-none z-0'
                      }`}
                      aria-hidden={!isActive}
                    >
                      {/* Floating Image */}
                      <div className="w-full flex-1 flex items-center justify-center px-2 py-0.5">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-auto max-h-[170px] sm:max-h-[190px] lg:max-h-[210px] object-contain select-none drop-shadow-sm transition-transform duration-700 ease-out"
                        />
                      </div>

                      {/* Feature Presentation Typography */}
                      <div className="text-center mt-1.5 max-w-md px-2">
                        <h3 className="font-headline text-base sm:text-lg font-bold text-primary-dark tracking-tight mb-0.5">
                          {slide.title}
                        </h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slideshow Indicator Dots */}
              <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs text-ink-light">
                <div className="flex items-center gap-2">
                  {FEATURE_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      title={`Slide ${idx + 1}: ${FEATURE_SLIDES[idx].title}`}
                      aria-label={`Go to slide ${idx + 1}: ${FEATURE_SLIDES[idx].title}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeSlideIndex
                          ? 'w-7 bg-primary'
                          : 'w-2 bg-border-beige hover:bg-ink-light/50'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-ink-light">
                  {activeSlideIndex + 1} / {FEATURE_SLIDES.length}
                </span>
              </div>
            </div>

            {/* RIGHT SIDE – Portal Sign In */}
            <div className="lg:col-span-6 bg-surface p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
              <div className="w-full max-w-md mx-auto">
                {currentView === 'login' ? (
                  <LoginForm
                    initialEmail={prefilledEmail}
                    onLoginSuccess={onLoginSuccess}
                    onNavigateToClassSchedule={onNavigateToClassSchedule}
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

          {/* Academic Footer */}
          <footer className="mt-2 text-center text-[11px] text-ink-muted">
            <p>
              © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM).
              All rights reserved.
            </p>
            <p className="mt-0.5 text-[10px] text-ink-light">
              Autonomous Workload Balancing &amp; Timetable Generation Engine • Affiliated to VTU Belagavi
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
