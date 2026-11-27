'use client';

import React from 'react';

export default function FooterRibbon({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  return (
    <footer
      className={`relative w-full mt-1 sm:mt-4 ${
        hasBottomNav ? 'mb-[46px] xl:mb-0' : 'mb-0'
      } select-none overflow-hidden bg-transparent leading-none`}
    >
      {/* Mobile & Tablet Partner Branding (since Sidebar is hidden below xl) */}
      <div className="xl:hidden px-3 sm:px-6 pb-2 pt-1">
        <a
          href="https://kodetri.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#1C0D05]/90 hover:bg-[#150903] backdrop-blur-md border border-[#F4B52E]/35 hover:border-[#F4B52E]/80 transition-all duration-200 shadow-md"
          title="Visit Kodetri Technologies"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold tracking-wider text-[#E5CCA8] uppercase shrink-0">
              🤝 Partner By
            </span>
            <span className="font-sans font-bold text-xs text-[#FFF4DF] group-hover:text-[#F4B52E] transition-colors truncate">
              Kodetri Technologies
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#D8BBA2] group-hover:text-[#F4B52E] transition-colors shrink-0">
            kodetri.com ↗
          </span>
        </a>
      </div>

      {/* 1. Mobile Banner: Proportionally Designed for Mobile Screens */}
      <div className="block sm:hidden w-full relative z-10 leading-none">
        <img
          src="/images/Chai%20Doston%20Ke%20Saath%20Banner.png"
          alt="Chai Doston Ke Saath Banner"
          className="w-full h-auto block object-contain pointer-events-none"
        />
      </div>

      {/* 2. Desktop & Tablet Panoramic Banner (Full Wide Aspect Ratio) */}
      <div className="hidden sm:block w-full relative z-10 leading-none">
        <img
          src="/images/Chai%20Lovers%E2%80%99%20Parchment%20Banner.png"
          alt="Chai Lovers’ Parchment Banner"
          className="w-full h-auto block object-cover object-bottom pointer-events-none"
        />
      </div>
    </footer>
  );
}






