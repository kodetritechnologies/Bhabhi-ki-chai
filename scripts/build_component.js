const fs = require('fs');

function generateTornPaperPath(width, baseHeight, amplitude, stepMin, stepMax, seedVal, bottomY = 64) {
  let x = 0;
  let points = [[0, baseHeight]];
  let seed = seedVal || 42;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  
  while (x < width) {
    let step = stepMin + random() * (stepMax - stepMin);
    x = Math.min(width, x + step);
    let macro = Math.sin(x * 0.008) * 4.2 + Math.cos(x * 0.024) * 2.6 + Math.sin(x * 0.055) * 1.4;
    let micro = (random() - 0.5) * amplitude;
    let rip = random() > 0.89 ? (random() > 0.5 ? 3.2 : -3.2) : 0;
    let y = Math.max(2, Math.min(bottomY - 4, baseHeight + macro + micro + rip));
    points.push([parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1))]);
  }
  
  let path = 'M 0 ' + bottomY + ' L 0 ' + points[0][1];
  for (let i = 1; i < points.length; i++) {
    path += ' L ' + points[i][0] + ' ' + points[i][1];
  }
  path += ' L ' + width + ' ' + bottomY + ' Z';
  return path;
}

const w = 1440;
const h = 64;
const shadowPath = generateTornPaperPath(w, 11, 5, 4, 10, 101, h);
const fiberPath = generateTornPaperPath(w, 14.5, 5, 4, 9, 73, h);
const decklePath = generateTornPaperPath(w, 16, 4.5, 3, 8, 89, h);
const mainPath = generateTornPaperPath(w, 17.5, 6, 3, 8, 42, h);

const code = `'use client';

import React from 'react';

interface TornPaperEdgeProps {
  className?: string;
}

/**
 * Authentic Vintage Desi Torn-Paper / Parchment Edge Divider
 * Seamlessly transitions from the rustic wooden Tapri counter hero banner
 * into the warm #FBE5CC parchment page body with realistic deckle rip texture,
 * burnt paper fiber detailing, and ambient drop shadows.
 */
export default function TornPaperEdge({ className = 'w-full h-10 sm:h-14 lg:h-20' }: TornPaperEdgeProps) {
  return (
    <div className={\`w-full pointer-events-none select-none leading-none \${className}\`}>
      <svg
        viewBox="0 0 1440 64"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tornParchmentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCE1C2" />
            <stop offset="20%" stopColor="#FAE3C6" />
            <stop offset="50%" stopColor="#FBE5CC" />
            <stop offset="100%" stopColor="#FBE5CC" />
          </linearGradient>
          <filter id="tornShadowFilter" x="-2%" y="-30%" width="104%" height="160%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* 1. Ambient soft drop shadow cast onto the wooden counter */}
        <path d="${shadowPath}" fill="rgba(18, 7, 1, 0.45)" filter="url(#tornShadowFilter)" />
        <path d="${shadowPath}" fill="rgba(28, 12, 3, 0.22)" />

        {/* 2. Aged / Burnt paper torn fiber rim */}
        <path d="${fiberPath}" fill="#C8853A" />

        {/* 3. Lighter cellulose deckle fibers */}
        <path d="${decklePath}" fill="#F4DEC3" opacity="0.8" />

        {/* 4. Main authentic parchment body blending 100% seamlessly into #FBE5CC */}
        <path d="${mainPath}" fill="url(#tornParchmentGrad)" />
      </svg>
    </div>
  );
}
`;

fs.writeFileSync('components/TornPaperEdge.tsx', code);
console.log('✓ Created components/TornPaperEdge.tsx');
