'use client';

import React from 'react';

export default function CuttingChaiIllustration({ className = 'w-32 h-44' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Animated steam ripples */}
      <div className="absolute -top-7 flex space-x-2 pointer-events-none z-10">
        <svg
          className="w-4 h-8 animate-steam text-[#D4A373]/70"
          viewBox="0 0 24 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 44C8 36 16 28 12 20C8 12 16 4 12 0" />
        </svg>
        <svg
          className="w-4 h-8 animate-steam-delay text-[#D4A373]/80"
          viewBox="0 0 24 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 44C16 36 8 28 12 20C16 12 8 4 12 0" />
        </svg>
        <svg
          className="w-4 h-8 animate-steam text-[#D4A373]/60"
          viewBox="0 0 24 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 44C10 34 14 24 12 14C10 8 14 4 12 0" />
        </svg>
      </div>

      {/* Cutting Chai Glass Graphic */}
      <svg
        viewBox="0 0 140 190"
        className="w-full h-full drop-shadow-md filter"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Chai Tea Gradient */}
          <linearGradient id="teaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D98A3C" />
            <stop offset="25%" stopColor="#C47327" />
            <stop offset="70%" stopColor="#A85714" />
            <stop offset="100%" stopColor="#7E3A06" />
          </linearGradient>

          {/* Froth / Malai gradient */}
          <linearGradient id="frothGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5D0A9" />
            <stop offset="50%" stopColor="#FFEBD1" />
            <stop offset="100%" stopColor="#EDBE8F" />
          </linearGradient>

          {/* Glass reflection */}
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="20%" stopColor="white" stopOpacity="0.1" />
            <stop offset="80%" stopColor="white" stopOpacity="0.0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Glass Base Shadow */}
        <ellipse cx="70" cy="182" rx="36" ry="6" fill="#4A2412" fillOpacity="0.18" />

        {/* Glass Outer Wall */}
        <path
          d="M26 28 L36 172 C37 178 45 182 70 182 C95 182 103 178 104 172 L114 28 Z"
          fill="#FFFDF7"
          fillOpacity="0.45"
          stroke="#382114"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Chai Liquid Fill */}
        <path
          d="M30 68 L36 168 C37 174 46 177 70 177 C94 177 103 174 104 168 L110 68 C100 73 85 75 70 75 C55 75 40 73 30 68 Z"
          fill="url(#teaGradient)"
        />

        {/* Froth / Foam on Top of Chai */}
        <ellipse cx="70" cy="68" rx="40" ry="8" fill="url(#frothGrad)" stroke="#A85714" strokeWidth="1.5" />
        
        {/* Little froth bubbles */}
        <circle cx="56" cy="68" r="2.5" fill="#FFEBD1" />
        <circle cx="68" cy="66" r="3" fill="#FFEBD1" />
        <circle cx="82" cy="69" r="2" fill="#FFEBD1" />
        <circle cx="92" cy="67" r="1.8" fill="#FFEBD1" />
        <circle cx="48" cy="70" r="1.5" fill="#FFEBD1" />

        {/* Traditional Vertical Flutes/Grooves of Cutting Glass */}
        <line x1="45" y1="36" x2="52" y2="168" stroke="#382114" strokeWidth="1.8" strokeOpacity="0.45" strokeDasharray="3 1" />
        <line x1="62" y1="38" x2="64" y2="171" stroke="#382114" strokeWidth="1.8" strokeOpacity="0.45" />
        <line x1="78" y1="38" x2="76" y2="171" stroke="#382114" strokeWidth="1.8" strokeOpacity="0.45" />
        <line x1="95" y1="36" x2="88" y2="168" stroke="#382114" strokeWidth="1.8" strokeOpacity="0.45" strokeDasharray="3 1" />

        {/* Glass Rim Top */}
        <ellipse
          cx="70"
          cy="28"
          rx="44"
          ry="9"
          fill="none"
          stroke="#382114"
          strokeWidth="3.5"
        />

        {/* White Glossy Reflection Strip */}
        <path
          d="M34 35 L40 162 C40 162 42 165 48 165 L43 35 Z"
          fill="url(#glassReflection)"
        />

        {/* Tapri Star doodle shine */}
        <path
          d="M120 40 L123 45 L128 47 L123 49 L120 54 L117 49 L112 47 L117 45 Z"
          fill="#F4B52E"
        />
        <path
          d="M20 75 L22 79 L26 80 L22 81 L20 85 L18 81 L14 80 L18 79 Z"
          fill="#F4B52E"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
