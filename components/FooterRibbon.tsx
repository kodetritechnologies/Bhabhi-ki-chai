'use client';

import React from 'react';

export default function FooterRibbon() {
  return (
    <footer className="relative w-full mt-4 mb-16 xl:mb-0 select-none overflow-hidden bg-transparent leading-none">
      {/* Chai Lovers' Parchment Banner - Torn paper top, flat & flush on sides and bottom */}
      <div className="w-full relative z-10 leading-none">
        <img
          src="/images/Chai%20Lovers%E2%80%99%20Parchment%20Banner.png"
          alt="Chai Lovers’ Parchment Banner"
          className="w-full h-auto block object-cover object-bottom pointer-events-none"
        />
      </div>
    </footer>
  );
}






