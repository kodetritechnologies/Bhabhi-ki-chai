const sharp = require('sharp');
const fs = require('fs');

async function testFullMobileView() {
  const width = 390;
  const height = 300;
  const bannerHeight = 160;
  const edgeHeight = 44;

  // 1. Create canvas with background #FBE5CC
  const canvas = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 251, g: 229, b: 204, alpha: 1 } // #FBE5CC
    }
  }).png().toBuffer();

  // 2. Crop Banner image to 390x160
  const bannerImg = await sharp('public/images/Bhabhi Ki Chai_ Cozy Tea Stall Banner.png')
    .resize(width, bannerHeight, { fit: 'cover', position: 'center' })
    .toBuffer();

  // 3. Render Torn Paper Edge SVG at 390xedgeHeight
  const svgBuf = fs.readFileSync('public/images/torn-paper-edge.svg');
  const edgeImg = await sharp(svgBuf)
    .resize(width, edgeHeight)
    .toBuffer();

  // 4. Composite banner + edge + background
  const finalPreview = await sharp(canvas)
    .composite([
      { input: bannerImg, top: 0, left: 0 },
      // edge sits at bottom of banner (top = bannerHeight - edgeHeight)
      { input: edgeImg, top: bannerHeight - edgeHeight, left: 0 }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync('scripts/final-mobile-blend.png', finalPreview);
  console.log('✓ Successfully rendered final-mobile-blend.png');
}

testFullMobileView().catch(console.error);
