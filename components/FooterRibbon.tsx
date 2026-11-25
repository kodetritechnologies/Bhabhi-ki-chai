'use client';

import React from 'react';

export default function FooterRibbon() {
  return (
    <footer className="relative w-full mt-2 sm:mt-4 mb-[50px] xl:mb-0 select-none overflow-hidden bg-transparent leading-none">
      {/* 1. Mobile Banner: Proportionally Designed for Mobile Screens (3x Taller, Crisp Text & Doodles) */}
      <div className="block sm:hidden w-full relative z-10 leading-none">
        <img
          src="/images/chai-lovers-banner-mobile.png"
          alt="Chai Lovers’ Parchment Banner"
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






