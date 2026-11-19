import React, { useState, useEffect } from 'react';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';
import { LoginForm } from '../components/login/LoginForm';
import { StudentRegistration } from '../components/login/StudentRegistration';
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

/**
 * Prominent AQS Institutional Brand Mark
 * Faithfully matches the exact geometry, rounded tube monoline strokes, and terminals
 * from the institutional reference font ROMUSA (aqs font.jpeg).
 */
const AqsBrandLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 740 236"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="AQS"
  >
    <title>AQS</title>
    <g
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* A */}
      <path d="M 23.5,211 L 23.5,46 A 35,35 0 0 1 58.5,11 L 172.5,11 A 35,35 0 0 1 207.5,46 L 207.5,211" />
      <path d="M 23.5,111 L 207.5,111" />

      {/* Q */}
      <g transform="translate(254, 0)">
        <path d="M 58.5,11 L 172.5,11 A 35,35 0 0 1 207.5,46 L 207.5,176 A 35,35 0 0 1 172.5,211 L 58.5,211 A 35,35 0 0 1 23.5,176 L 23.5,46 A 35,35 0 0 1 58.5,11 Z" />
        <path d="M 160,165 L 218,223" />
      </g>

      {/* S */}
      <g transform="translate(508, 0)">
        <path d="M 207.5,11 L 58.5,11 A 35,35 0 0 0 23.5,46 L 23.5,76 A 35,35 0 0 0 58.5,111 L 172.5,111 A 35,35 0 0 1 207.5,146 L 207.5,176 A 35,35 0 0 1 172.5,211 L 23.5,211" />
      </g>
    </g>
  </svg>
);

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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 academic-grid-pattern">
        <div className="w-full max-w-7xl mx-auto">
          {/* Card Wrapper: Two-Column Layout */}
          <div className="bg-surface rounded-2xl border border-border-beige shadow-crisp-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[780px] lg:min-h-[840px]">
            {/* LEFT SIDE – Feature Image Slideshow */}
            <div className="lg:col-span-6 bg-canvas-paper pt-3 sm:pt-4 lg:pt-5 px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8 border-b lg:border-b-0 lg:border-r border-border-beige flex flex-col justify-between">
              {/* AQS Branding Header */}
              <div>
                <div className="flex flex-col items-start">
                  <h1 className="sr-only">AQS - Academic Quality &amp; Scheduling</h1>
                  <AqsBrandLogo className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto max-w-full text-primary-dark" />
                  <p className="text-xl sm:text-2xl lg:text-[26px] font-medium text-ink-muted tracking-wide mt-2 leading-snug">
                    Academic Quality &amp; Scheduling
                  </p>
                </div>
              </div>

              {/* Slideshow Display Area with Floating Image (Directly on AQS Card) */}
              <div className="relative my-2 sm:my-4 flex-1 min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] flex items-center justify-center overflow-hidden">
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
                      {/* Floating Image (No background, almost touches sides of card) */}
                      <div className="w-full flex-1 flex items-center justify-center px-1 sm:px-2 py-1">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-auto max-h-[440px] sm:max-h-[500px] lg:max-h-[540px] object-contain select-none drop-shadow-sm transition-transform duration-700 ease-out"
                        />
                      </div>

                      {/* Feature Presentation Typography */}
                      <div className="text-center mt-2 sm:mt-3 max-w-lg px-2">
                        <h3 className="font-headline text-2xl sm:text-3xl font-bold text-primary-dark tracking-tight mb-1.5">
                          {slide.title}
                        </h3>
                        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slideshow Indicator Dots */}
              <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-ink-light">
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
            <div className="lg:col-span-6 bg-surface pt-3 sm:pt-4 lg:pt-5 px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8 flex flex-col justify-between overflow-y-auto">
              <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-between">
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
