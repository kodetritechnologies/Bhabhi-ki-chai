const fs = require('fs');
const sharp = require('sharp');

async function buildMobileFooterBanner() {
  const width = 800;
  const height = 170;

  // 1. Extract the torn edge top from Chai Lovers’ Parchment Banner
  // The original has the realistic hand-torn paper edge with fibers & shadows!
  const topEdge = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 400, top: 0, width: 1200, height: 60 })
    .resize(width, 40)
    .toBuffer();

  // 2. Base solid parchment background
  const baseParchment = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 232, g: 186, b: 124, alpha: 1 } // #E8BA7C warm aged parchment
    }
  }).png().toBuffer();

  // 3. Extract the primary slogan: "Doston ke saath, Chai ke saath. Always! ☕"
  // From original Chai Lovers' Parchment Banner
  const slogan = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 740, top: 25, width: 680, height: 95 })
    .resize({ width: 560 })
    .toBuffer();

  // 4. Extract left hut doodle
  const hutLeft = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 400, top: 35, width: 280, height: 90 })
    .resize({ width: 90 })
    .toBuffer();

  // 5. Extract right hut doodle
  const hutRight = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 1460, top: 35, width: 280, height: 90 })
    .resize({ width: 90 })
    .toBuffer();

  // 6. Extract "Chai Manager ♡"
  const chaiManager = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 20, top: 40, width: 250, height: 80 })
    .resize({ width: 140 })
    .toBuffer();

  // 7. Extract "Made with ❤️ for Chai Lovers"
  const madeWithLove = await sharp('public/images/Chai Lovers’ Parchment Banner.png')
    .extract({ left: 1810, top: 40, width: 320, height: 80 })
    .resize({ width: 180 })
    .toBuffer();

  // 8. Mask the base with the top torn edge
  // Top torn edge has transparency above the rip
  const fullBanner = await sharp(baseParchment)
    .composite([
      { input: topEdge, top: 0, left: 0 },
      { input: hutLeft, top: 28, left: 15 },
      { input: slogan, top: 25, left: Math.round((width - 560) / 2) },
      { input: hutRight, top: 28, left: width - 105 },
      { input: chaiManager, top: 118, left: 30 },
      { input: madeWithLove, top: 118, left: width - 210 }
    ])
    .png({ quality: 100 })
    .toBuffer();

  fs.writeFileSync('public/images/chai-lovers-banner-mobile.png', fullBanner);
  console.log('✓ Successfully created public/images/chai-lovers-banner-mobile.png');
}

buildMobileFooterBanner().catch(console.error);
