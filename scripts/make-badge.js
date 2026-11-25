const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeBadges() {
  const svgBadge = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#4D240E"/>
          <stop offset="65%" stop-color="#301507"/>
          <stop offset="100%" stop-color="#1D0C03"/>
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFEAA7"/>
          <stop offset="50%" stop-color="#F4B52E"/>
          <stop offset="100%" stop-color="#D68910"/>
        </linearGradient>
      </defs>
      <!-- Outer circle -->
      <circle cx="256" cy="256" r="250" fill="url(#bg)" stroke="url(#gold)" stroke-width="10"/>
      <circle cx="256" cy="256" r="238" fill="none" stroke="#FFEAA7" stroke-width="2" stroke-dasharray="6 4" opacity="0.7"/>
    </svg>
  `;

  // Resize clean logo to fit inside badge
  const logoInner = await sharp('public/images/bhabhi-logo-clean.png')
    .resize(410, 370, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoInner).metadata();
  const top = Math.round((512 - logoMeta.height) / 2);
  const left = Math.round((512 - logoMeta.width) / 2);

  await sharp(Buffer.from(svgBadge))
    .composite([{ input: logoInner, top, left }])
    .png()
    .toFile('public/images/bhabhi-badge-round.png');

  // Also make favicon from this round badge
  await sharp('public/images/bhabhi-badge-round.png')
    .resize(64, 64)
    .toFile('app/icon.png');

  await sharp('public/images/bhabhi-badge-round.png')
    .resize(64, 64)
    .toFile('public/icon.png');

  await sharp('public/images/bhabhi-badge-round.png')
    .resize(32, 32)
    .toFile('public/favicon.ico');

  await sharp('public/images/bhabhi-badge-round.png')
    .resize(32, 32)
    .toFile('app/favicon.ico');

  console.log('Successfully created bhabhi-badge-round.png and updated favicons!');
}

makeBadges()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
