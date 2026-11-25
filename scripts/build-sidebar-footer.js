const fs = require('fs');
const sharp = require('sharp');

async function buildFooterWithSpace() {
  const width = 504;
  const height = 720;
  const bgColor = { r: 54, g: 29, b: 13, alpha: 1 }; // #361D0D
  
  // 1. Prepare base background canvas (504 x 720) of #361D0D
  const baseBg = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: bgColor
    }
  }).png().toBuffer();
  
  // 2. Prepare cropped cup image from user's upload (width 504, height 610)
  const cupImg = await sharp('public/images/cutting-chai-user.jpg')
    .extract({ left: 60, top: 0, width: 800, height: 1024 })
    .resize(width, 610)
    .png()
    .toBuffer();
    
  // Gradient mask for cup: top 18% fades smoothly into #361D0D
  const maskSvg = Buffer.from(`
    <svg width="${width}" height="610" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0"/>
          <stop offset="15%" stop-color="white" stop-opacity="0.5"/>
          <stop offset="30%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>
  `);
  
  const fadedCup = await sharp(cupImg)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 3. Clean isolated text 'Chai Pe Charcha Always! 😊'
  const textOverlay = await sharp('public/images/clean-tagline-text.png')
    .resize({ width: 280 })
    .png()
    .toBuffer();

  // 4. Composite onto base
  const outputBuffer = await sharp(baseBg)
    .composite([
      { input: fadedCup, top: height - 610, left: 0 },
      { input: textOverlay, top: 18, left: Math.round((width - 280) / 2) }
    ])
    .png({ quality: 100 })
    .toBuffer();

  fs.writeFileSync('public/images/sidebar-footer-exact.png', outputBuffer);
  fs.writeFileSync('public/images/sidebar-chai.png', outputBuffer);
  fs.writeFileSync('public/images/sidebar-bottom-exact-192.png', outputBuffer);
  console.log('✓ Successfully created clean footer with proper text & cup placement!');
}

buildFooterWithSpace().catch(console.error);
