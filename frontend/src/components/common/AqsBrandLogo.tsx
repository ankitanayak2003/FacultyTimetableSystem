import React from 'react';

/**
 * Prominent AQS Institutional Brand Mark
 * Faithfully matches the exact geometry, rounded tube monoline strokes, and terminals
 * from the institutional reference font ROMUSA (aqs font.jpeg).
 */
export const AqsBrandLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto text-primary' }) => (
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
