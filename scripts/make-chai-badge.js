const sharp = require('sharp');

async function makeChaiBadge() {
  const svgBadge = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#4D240E"/>
          <stop offset="65%" stop-color="#301507"/>
          <stop offset="100%" stop-color="#1B0A03"/>
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF3C4"/>
          <stop offset="35%" stop-color="#F4B52E"/>
          <stop offset="100%" stop-color="#C96B3B"/>
        </linearGradient>
      </defs>

      <!-- Outer Ring & Base -->
      <circle cx="256" cy="256" r="250" fill="url(#bg)" stroke="url(#gold)" stroke-width="12"/>
      <circle cx="256" cy="256" r="236" fill="none" stroke="#FFEAA7" stroke-width="2.5" stroke-dasharray="8 5" opacity="0.8"/>

      <!-- Crown on Top -->
      <path d="M196 110 L216 142 L256 95 L296 142 L316 110 L308 160 L204 160 Z" fill="#F4B52E" stroke="#FFEAA7" stroke-width="2"/>
      <circle cx="196" cy="105" r="5" fill="#FFEAA7"/>
      <circle cx="256" cy="90" r="6" fill="#FFEAA7"/>
      <circle cx="316" cy="105" r="5" fill="#FFEAA7"/>

      <!-- Steaming waves -->
      <path d="M226 210 C216 190 236 175 226 155" fill="none" stroke="#FFE5B4" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
      <path d="M256 205 C246 185 266 170 256 150" fill="none" stroke="#FFE5B4" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
      <path d="M286 210 C276 190 296 175 286 155" fill="none" stroke="#FFE5B4" stroke-width="5" stroke-linecap="round" opacity="0.75"/>

      <!-- Cutting Chai Glass Body -->
      <path d="M180 230 L200 400 C204 425 220 435 256 435 C292 435 308 425 312 400 L332 230 Z" 
            fill="#C96B3B" stroke="#FFEAA7" stroke-width="7" stroke-linejoin="round"/>
      
      <!-- Liquid Tea fill -->
      <path d="M188 275 L204 395 C208 415 224 425 256 425 C288 425 304 415 308 395 L324 275 Z" fill="#D97706"/>

      <!-- Glass Flutes -->
      <line x1="225" y1="245" x2="232" y2="395" stroke="#FFEAA7" stroke-width="3" stroke-opacity="0.45"/>
      <line x1="256" y1="245" x2="256" y2="400" stroke="#FFEAA7" stroke-width="4" stroke-opacity="0.5"/>
      <line x1="287" y1="245" x2="280" y2="395" stroke="#FFEAA7" stroke-width="3" stroke-opacity="0.45"/>

      <!-- Rim -->
      <ellipse cx="256" cy="230" rx="76" ry="16" fill="#3D1806" stroke="#FFEAA7" stroke-width="5"/>
      <ellipse cx="256" cy="275" rx="66" ry="11" fill="#FFEAA7" fill-opacity="0.25"/>

      <!-- Star sparkles -->
      <polygon points="120,250 125,258 135,260 127,265 129,275 120,270 111,275 113,265 105,260 115,258" fill="#F4B52E"/>
      <polygon points="392,250 397,258 407,260 399,265 401,275 392,270 383,275 385,265 377,260 387,258" fill="#F4B52E"/>
    </svg>
  `;

  await sharp(Buffer.from(svgBadge))
    .png()
    .toFile('public/images/chai-pe-charcha-badge.png');

  // Favicons
  await sharp('public/images/chai-pe-charcha-badge.png')
    .resize(64, 64)
    .toFile('app/icon.png');

  await sharp('public/images/chai-pe-charcha-badge.png')
    .resize(64, 64)
    .toFile('public/icon.png');

  await sharp('public/images/chai-pe-charcha-badge.png')
    .resize(32, 32)
    .toFile('public/favicon.ico');

  await sharp('public/images/chai-pe-charcha-badge.png')
    .resize(32, 32)
    .toFile('app/favicon.ico');

  console.log('Chai Pe Charcha badge & favicons successfully created!');
}

makeChaiBadge()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
