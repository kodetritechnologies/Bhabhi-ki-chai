const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Raw SVG matching the user's uploaded image exactly:
// Features:
// - 3 steam lines (left wave, center tall S-curve, right wave)
// - Cream / ivory cup rim with dark espresso/tea center
// - Cream / ivory cup body with glowing warm amber-orange tea fill
// - Pedestal saucer base
// - Curved ear handle on the right
// - Clean rounded aesthetics, crisp at 16x16, 32x32, 64x64, 128x128, 512x512

function getCupSvg({ withBg = false, size = 512 }) {
  const bgMarkup = withBg ? `
    <defs>
      <radialGradient id="badgeBg" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#4A230F"/>
        <stop offset="65%" stop-color="#2D1407"/>
        <stop offset="100%" stop-color="#1B0903"/>
      </radialGradient>
      <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFEBB3"/>
        <stop offset="40%" stop-color="#F4B52E"/>
        <stop offset="100%" stop-color="#C66A23"/>
      </linearGradient>
    </defs>
    <!-- Circular Badge for app logos / headers -->
    <circle cx="256" cy="256" r="250" fill="url(#badgeBg)" stroke="url(#goldBorder)" stroke-width="12"/>
    <circle cx="256" cy="256" r="236" fill="none" stroke="#FFEBB3" stroke-width="2.5" stroke-dasharray="7 5" opacity="0.6"/>
  ` : '';

  // Center position for 512x512
  const transform = withBg ? 'transform="translate(16, 20) scale(4.8)"' : 'transform="translate(16, 20) scale(4.8)"';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <!-- Warm amber chai liquid gradient matching the image #E3751B / #D36811 -->
    <linearGradient id="teaLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F49A24"/>
      <stop offset="35%" stop-color="#E27318"/>
      <stop offset="100%" stop-color="#C5580C"/>
    </linearGradient>

    <!-- Cream ceramic porcelain gradient #FFF3E1 -> #FCE8CF -> #F3D3AE -->
    <linearGradient id="creamBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5E6"/>
      <stop offset="45%" stop-color="#FDECD6"/>
      <stop offset="100%" stop-color="#F0CCA0"/>
    </linearGradient>

    <!-- Steam soft glow -->
    <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FDECD6" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#FFF8EE" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Handle shadow / rim inner -->
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F3CDA2"/>
      <stop offset="60%" stop-color="#FFF2E0"/>
      <stop offset="100%" stop-color="#DEB584"/>
    </linearGradient>
  </defs>

  ${bgMarkup}

  <g transform="translate(42, 28) scale(4.28)">
    <!-- 1. STEAM WISPS (matching the 3 wavy wisps in user photo) -->
    <!-- Left Steam (curves left then right) -->
    <path d="M37 36 C33 31.5 33.5 27 38 23 C40.5 20.5 40.5 18 38 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Middle Steam (tallest serpentine S-curve rising high) -->
    <path d="M47.5 35 C42.5 29.5 44 23 50 17.5 C53.5 13.5 52 8 46.5 4" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Right Steam (curves right then up) -->
    <path d="M58 36 C54 31.5 54.5 27 59 23 C61.5 20.5 61.5 18 59 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- 2. CUP HANDLE (Curved ear handle on the right) -->
    <!-- Thick outer loop -->
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="url(#handleGrad)" stroke-width="6.2" stroke-linecap="round"/>
    <!-- Subtle inner bevel -->
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>

    <!-- 3. PEDESTAL BASE / FOOT (flared base) -->
    <path d="M36 82.5 C34 85 33 87.5 35 89 C36.5 90 41 90.5 48 90.5 C55 90.5 59.5 90 61 89 C63 87.5 62 85 60 82.5 Z" 
          fill="url(#creamBodyGrad)"/>
    <!-- Bottom base rim highlight -->
    <path d="M36 89.5 C40 91 56 91 60 89.5" 
          fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>

    <!-- 4. OUTER CUP BODY (Cream porcelain silhouette) -->
    <path d="M25 44 C25 44 27.5 72 36.5 81.5 C38.5 83.5 57.5 83.5 59.5 81.5 C68.5 72 71 44 71 44 Z" 
          fill="url(#creamBodyGrad)"/>

    <!-- 5. TOP RIM & INNER DEPTH -->
    <!-- Dark espresso / tea surface inside cup -->
    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="#200E05"/>
    <ellipse cx="48" cy="45" rx="18" ry="5.2" fill="#321608"/>

    <!-- Outer Cream Rim Ring -->
    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="none" stroke="url(#creamBodyGrad)" stroke-width="4.8"/>
    <!-- Rim top gloss highlight -->
    <ellipse cx="48" cy="42.8" rx="22" ry="6.5" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity="0.8"/>

    <!-- 6. FRONT AMBER/ORANGE TEA GRAPHIC (Exact vibrant chai fill from image) -->
    <path d="M29.5 51 C37.5 52.8 58.5 52.8 66.5 51 C65.5 68 60 76.5 55 79.5 C51 81 45 81 41 79.5 C36 76.5 30.5 68 29.5 51 Z" 
          fill="url(#teaLiquidGrad)"/>

    <!-- Subtle warm inner depth / shine on the chai liquid -->
    <path d="M31.5 53.5 C37 54.8 45 55 49 54.5 C47.5 64 44 72 39.5 75 C36 72 32.5 65 31.5 53.5 Z" 
          fill="#FFE28A" opacity="0.22"/>
  </g>
</svg>
`;
}

// SVG with standalone clean transparent background for favicon.ico, icon.svg, etc.
function getIconSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <!-- Warm amber chai liquid gradient -->
    <linearGradient id="teaLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F59E27"/>
      <stop offset="35%" stop-color="#E37318"/>
      <stop offset="100%" stop-color="#C5580C"/>
    </linearGradient>

    <!-- Cream ceramic porcelain gradient -->
    <linearGradient id="creamBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF6EA"/>
      <stop offset="45%" stop-color="#FCECD6"/>
      <stop offset="100%" stop-color="#F0CCA0"/>
    </linearGradient>

    <!-- Steam soft glow -->
    <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FDECD6" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#FFF8EE" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Handle gradient -->
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F3CDA2"/>
      <stop offset="60%" stop-color="#FFF2E0"/>
      <stop offset="100%" stop-color="#DEB584"/>
    </linearGradient>
  </defs>

  <g transform="translate(3, 4) scale(0.94)">
    <!-- 1. STEAM WISPS -->
    <!-- Left Steam -->
    <path d="M37 36 C33 31.5 33.5 27 38 23 C40.5 20.5 40.5 18 38 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Middle Steam (tallest S-curve) -->
    <path d="M47.5 35 C42.5 29.5 44 23 50 17.5 C53.5 13.5 52 8 46.5 4" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Right Steam -->
    <path d="M58 36 C54 31.5 54.5 27 59 23 C61.5 20.5 61.5 18 59 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- 2. CUP HANDLE -->
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="url(#handleGrad)" stroke-width="6.2" stroke-linecap="round"/>
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>

    <!-- 3. PEDESTAL BASE / FOOT -->
    <path d="M36 82.5 C34 85 33 87.5 35 89 C36.5 90 41 90.5 48 90.5 C55 90.5 59.5 90 61 89 C63 87.5 62 85 60 82.5 Z" 
          fill="url(#creamBodyGrad)"/>
    <path d="M36 89.5 C40 91 56 91 60 89.5" 
          fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>

    <!-- 4. OUTER CUP BODY -->
    <path d="M25 44 C25 44 27.5 72 36.5 81.5 C38.5 83.5 57.5 83.5 59.5 81.5 C68.5 72 71 44 71 44 Z" 
          fill="url(#creamBodyGrad)"/>

    <!-- 5. TOP RIM & INNER DEPTH -->
    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="#200E05"/>
    <ellipse cx="48" cy="45" rx="18" ry="5.2" fill="#321608"/>

    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="none" stroke="url(#creamBodyGrad)" stroke-width="4.8"/>
    <ellipse cx="48" cy="42.8" rx="22" ry="6.5" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity="0.8"/>

    <!-- 6. FRONT AMBER/ORANGE TEA GRAPHIC -->
    <path d="M29.5 51 C37.5 52.8 58.5 52.8 66.5 51 C65.5 68 60 76.5 55 79.5 C51 81 45 81 41 79.5 C36 76.5 30.5 68 29.5 51 Z" 
          fill="url(#teaLiquidGrad)"/>
    <path d="M31.5 53.5 C37 54.8 45 55 49 54.5 C47.5 64 44 72 39.5 75 C36 72 32.5 65 31.5 53.5 Z" 
          fill="#FFE28A" opacity="0.22"/>
  </g>
</svg>
`;
}

// Circular badge version with dark rich background & golden ring (like current website badge)
function getBadgeSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="badgeBg" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#46210C"/>
      <stop offset="60%" stop-color="#2D1407"/>
      <stop offset="100%" stop-color="#180802"/>
    </radialGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3C7"/>
      <stop offset="35%" stop-color="#F4B52E"/>
      <stop offset="75%" stop-color="#DF8723"/>
      <stop offset="100%" stop-color="#9A430E"/>
    </linearGradient>

    <!-- Warm amber chai liquid gradient -->
    <linearGradient id="teaLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F59E27"/>
      <stop offset="35%" stop-color="#E37318"/>
      <stop offset="100%" stop-color="#C5580C"/>
    </linearGradient>

    <!-- Cream ceramic porcelain gradient -->
    <linearGradient id="creamBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF6EA"/>
      <stop offset="45%" stop-color="#FCECD6"/>
      <stop offset="100%" stop-color="#F0CCA0"/>
    </linearGradient>

    <!-- Steam soft glow -->
    <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FDECD6" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="#FFF8EE" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Handle gradient -->
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F3CDA2"/>
      <stop offset="60%" stop-color="#FFF2E0"/>
      <stop offset="100%" stop-color="#DEB584"/>
    </linearGradient>
  </defs>

  <!-- Outer Badge Circle -->
  <circle cx="256" cy="256" r="248" fill="url(#badgeBg)" stroke="url(#goldBorder)" stroke-width="12"/>
  <circle cx="256" cy="256" r="234" fill="none" stroke="#FFEBB3" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.6"/>

  <!-- Subtle glow behind the cup -->
  <circle cx="256" cy="265" r="140" fill="#E37318" opacity="0.12" filter="blur(20px)"/>

  <!-- The Steaming Cup Icon -->
  <g transform="translate(68, 62) scale(3.76)">
    <!-- 1. STEAM WISPS -->
    <path d="M37 36 C33 31.5 33.5 27 38 23 C40.5 20.5 40.5 18 38 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <path d="M47.5 35 C42.5 29.5 44 23 50 17.5 C53.5 13.5 52 8 46.5 4" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>

    <path d="M58 36 C54 31.5 54.5 27 59 23 C61.5 20.5 61.5 18 59 15" 
          fill="none" stroke="url(#steamGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- 2. CUP HANDLE -->
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="url(#handleGrad)" stroke-width="6.2" stroke-linecap="round"/>
    <path d="M63 46 C75 46 82.5 53 82.5 61 C82.5 69 74.5 75.5 64 75" 
          fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>

    <!-- 3. PEDESTAL BASE / FOOT -->
    <path d="M36 82.5 C34 85 33 87.5 35 89 C36.5 90 41 90.5 48 90.5 C55 90.5 59.5 90 61 89 C63 87.5 62 85 60 82.5 Z" 
          fill="url(#creamBodyGrad)"/>
    <path d="M36 89.5 C40 91 56 91 60 89.5" 
          fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>

    <!-- 4. OUTER CUP BODY -->
    <path d="M25 44 C25 44 27.5 72 36.5 81.5 C38.5 83.5 57.5 83.5 59.5 81.5 C68.5 72 71 44 71 44 Z" 
          fill="url(#creamBodyGrad)"/>

    <!-- 5. TOP RIM & INNER DEPTH -->
    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="#200E05"/>
    <ellipse cx="48" cy="45" rx="18" ry="5.2" fill="#321608"/>

    <ellipse cx="48" cy="44" rx="23" ry="7.8" fill="none" stroke="url(#creamBodyGrad)" stroke-width="4.8"/>
    <ellipse cx="48" cy="42.8" rx="22" ry="6.5" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity="0.8"/>

    <!-- 6. FRONT AMBER/ORANGE TEA GRAPHIC -->
    <path d="M29.5 51 C37.5 52.8 58.5 52.8 66.5 51 C65.5 68 60 76.5 55 79.5 C51 81 45 81 41 79.5 C36 76.5 30.5 68 29.5 51 Z" 
          fill="url(#teaLiquidGrad)"/>
    <path d="M31.5 53.5 C37 54.8 45 55 49 54.5 C47.5 64 44 72 39.5 75 C36 72 32.5 65 31.5 53.5 Z" 
          fill="#FFE28A" opacity="0.22"/>
  </g>
</svg>
`;
}

module.exports = { getIconSvg, getBadgeSvg };
