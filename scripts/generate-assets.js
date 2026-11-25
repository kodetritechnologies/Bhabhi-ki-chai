const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { getIconSvg, getBadgeSvg } = require('./build-chai-logo');

async function generateAll() {
  console.log('Generating assets matching user image...');

  const iconSvg = getIconSvg();
  const badgeSvg = getBadgeSvg();

  // 1. Write SVGs
  fs.writeFileSync('public/icon.svg', iconSvg.trim());
  fs.writeFileSync('public/images/chai-cup.svg', iconSvg.trim());
  fs.writeFileSync('public/images/chai-badge.svg', badgeSvg.trim());

  // 2. Render Badge PNG (512x512)
  const badgeBuffer = Buffer.from(badgeSvg);
  await sharp(badgeBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile('public/images/chai-pe-charcha-badge.png');
  console.log('✓ Created public/images/chai-pe-charcha-badge.png');

  await sharp(badgeBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile('public/images/bhabhi-badge-round.png');
  console.log('✓ Created public/images/bhabhi-badge-round.png');

  // 3. Render Transparent Cup PNG (512x512)
  const iconBuffer = Buffer.from(iconSvg);
  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile('public/images/bhabhi-logo-transparent.png');
  console.log('✓ Created public/images/bhabhi-logo-transparent.png');

  // 4. App icons & Favicons
  // For favicon, we create sharp, high contrast icon
  await sharp(badgeBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icon.png');
  
  await sharp(badgeBuffer)
    .resize(192, 192)
    .png()
    .toFile('app/icon.png');
  console.log('✓ Created public/icon.png and app/icon.png');

  // Multi-size favicon
  const ico32Buffer = await sharp(badgeBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  fs.writeFileSync('public/favicon.ico', ico32Buffer);
  fs.writeFileSync('public/chai-favicon.ico', ico32Buffer);
  fs.writeFileSync('app/favicon.ico', ico32Buffer);
  console.log('✓ Created favicons');

  // Also extract and enhance the original uploaded image if needed as a direct option
  const userUploadPath = 'C:/Users/vihay/.gemini/antigravity/brain/afa919fa-a3f2-4fe1-9ef0-3a5ab6f6e8aa/.user_uploaded/media_1795482514896_7ed69b94.png';
  if (fs.existsSync(userUploadPath)) {
    fs.copyFileSync(userUploadPath, 'public/images/user-cup-original.png');
    console.log('✓ Copied user original cup to public/images/user-cup-original.png');
  }

  console.log('All assets successfully generated!');
}

generateAll().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
