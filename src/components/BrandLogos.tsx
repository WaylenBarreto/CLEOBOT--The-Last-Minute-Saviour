import React from "react";

export const GoogleLogoIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export const GmailLogoIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20H6V10L2 7V18C2 19.1 2.9 20 4 20Z" fill="#4285F4" />
    <path d="M20 20H18V10L22 7V18C22 19.1 21.1 20 20 20Z" fill="#34A853" />
    <path d="M6 10V20H10V12L6 10Z" fill="#FBBC05" />
    <path d="M18 10V20H14V12L18 10Z" fill="#FBBC05" />
    <path d="M12 14L18 9.5V7L12 11.5L6 7V9.5L12 14Z" fill="#EA4335" />
  </svg>
);

export const GoogleCalendarLogoIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="#4285F4" />
    <path d="M19 3H15V8H21V5C21 3.9 20.1 3 19 3Z" fill="#EA4335" />
    <path d="M5 21H9V16H3V19C3 20.1 3.9 21 5 21Z" fill="#34A853" />
    <path d="M21 19C21 20.1 20.1 21 19 21H15V16H21V19Z" fill="#FBBC05" />
    <rect x="6" y="8" width="12" height="10" rx="1" fill="white" />
    <text x="12" y="16" fill="#4285F4" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">31</text>
  </svg>
);
