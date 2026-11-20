import React from 'react';
import { AqsBrandLogo } from './AqsBrandLogo';

export interface GlobalTopHeaderProps {
  breadcrumbCategory: string;
  breadcrumbModule: string;
  pageTitle: string;
  userName: string;
  academicYear?: string; // Dean user exception only
  onToggleMobileNav?: () => void;
}

/**
 * Top Header Bar – Minimalistic Design
 * Permanently fixed at the top of the viewport (position: fixed, top: 0, left: 0, right: 0, z-50).
 * Displays exactly two text elements on the right: User Name and AQS Brand Name.
 * Dean exception: Displays Academic Year in between.
 * No avatar circles, no profile cards, no role badges, no emojis, no status pills.
 */
export const GlobalTopHeader: React.FC<GlobalTopHeaderProps> = ({
  breadcrumbCategory,
  breadcrumbModule,
  pageTitle,
  userName,
  academicYear,
  onToggleMobileNav,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-surface border-b border-border-beige h-14 px-4 sm:px-6 shadow-crisp-sm transition-none">
      <div className="h-full flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left side: Breadcrumb & Page Title (No college logos or decorative crests) */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded transition-colors flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-light">
              <span>{breadcrumbCategory}</span>
              <span>/</span>
              <span className="text-primary font-semibold">{breadcrumbModule}</span>
            </div>
            <h1 className="font-headline text-base sm:text-lg font-semibold text-primary truncate leading-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side: Minimalist display */}
        {/* Only User Name and AQS Brand Name (plus Academic Year for Dean user only) */}
        {/* Strictly no avatar circles, no user initials, no profile cards, no role badges, no emojis, no status pills */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 select-none">
          <span className="font-semibold text-ink text-xs sm:text-sm tracking-tight">
            {userName}
          </span>

          {academicYear && (
            <>
              <span className="text-border-beige font-normal text-xs sm:text-sm select-none">
                •
              </span>
              <span className="font-medium text-ink-muted text-xs sm:text-sm">
                {academicYear}
              </span>
            </>
          )}

          <span className="text-border-beige font-normal text-xs sm:text-sm select-none">
            •
          </span>

          <AqsBrandLogo className="h-4 sm:h-4.5 w-auto text-primary" />
        </div>
      </div>
    </header>
  );
};
