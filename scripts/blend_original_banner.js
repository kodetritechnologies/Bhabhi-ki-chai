const sharp = require('sharp');
const fs = require('fs');

async function createSeamlessBanner() {
  const originalPath = 'public/images/Vintage Torn-Edge Parchment Banner.original.png';
  
  // 1. Extract the torn parchment region from the original image (top: 270, height: 180, width: 2172)
  const { data, info } = await sharp(originalPath)
    .extract({ left: 0, top: 270, width: 2172, height: 180 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const targetBg = [251, 229, 204]; // #FBE5CC
  const newHeight = 180;
  const outBuf = Buffer.alloc(width * newHeight * channels);

  // Transition zone:
  // y < 25: 100% original torn edge, shadows and burnt fiber rips
  // y 25 -> 55: authentic paper texture smoothly easing into #FBE5CC
  // y >= 55: 100% solid #FBE5CC (guaranteeing 0px seam with the page background regardless of mobile crop)
  const fadeStart = 25;
  const fadeEnd = 55;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (y < fadeStart) {
        // Keep 100% original texture, burnt deckle edge and alpha
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = a;
      } else if (y <= fadeEnd) {
        // Smooth ease curve into #FBE5CC
        const t = (y - fadeStart) / (fadeEnd - fadeStart);
        const ease = t * t * (3 - 2 * t);

        outBuf[idx] = Math.round(r * (1 - ease) + targetBg[0] * ease);
        outBuf[idx + 1] = Math.round(g * (1 - ease) + targetBg[1] * ease);
        outBuf[idx + 2] = Math.round(b * (1 - ease) + targetBg[2] * ease);
        // Alpha becomes 255 (solid) as we blend into the page body
        outBuf[idx + 3] = Math.max(a, Math.round(255 * ease));
      } else {
        // 100% solid #FBE5CC
        outBuf[idx] = targetBg[0];
        outBuf[idx + 1] = targetBg[1];
        outBuf[idx + 2] = targetBg[2];
        outBuf[idx + 3] = 255;
      }
    }
  }

  // Save the full wide blended banner
  await sharp(outBuf, { raw: { width, height: newHeight, channels } })
    .png({ quality: 100 })
    .toFile('public/images/Vintage Torn-Edge Parchment Banner.png');

  console.log('✓ Successfully created public/images/Vintage Torn-Edge Parchment Banner.png');

  // Also create a mobile-optimized banner version (800x120) with high rip detail
  const mobileWidth = 800;
  const mobileHeight = 120;
  
  await sharp(outBuf, { raw: { width, height: newHeight, channels } })
    .extract({ left: Math.round((width - mobileWidth) / 2), top: 0, width: mobileWidth, height: mobileHeight })
    .png({ quality: 100 })
    .toFile('public/images/Vintage Torn-Edge Parchment Banner.mobile.png');

  console.log('✓ Successfully created public/images/Vintage Torn-Edge Parchment Banner.mobile.png');
}

createSeamlessBanner().catch(console.error);
