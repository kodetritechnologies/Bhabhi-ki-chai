function generateTornPaperPath(width, baseHeight, amplitude, stepMin, stepMax, seedVal, bottomY = 40) {
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
    let macro = Math.sin(x * 0.012) * 4.5 + Math.cos(x * 0.035) * 2.5;
    let micro = (random() - 0.5) * amplitude;
    let rip = random() > 0.86 ? (random() > 0.5 ? 4.5 : -4.5) : 0;
    let y = Math.max(2, Math.min(bottomY - 4, baseHeight + macro + micro + rip));
    points.push([parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1))]);
  }
  
  let path = `M 0 ${bottomY} L 0 ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i][0]} ${points[i][1]}`;
  }
  path += ` L ${width} ${bottomY} Z`;
  return path;
}

const shadowLayer = generateTornPaperPath(1440, 10, 6, 6, 15, 101, 48);
const fiberLayer = generateTornPaperPath(1440, 13, 7, 5, 12, 73, 48);
const mainLayer = generateTornPaperPath(1440, 16, 8, 4, 11, 42, 48);

console.log(JSON.stringify({ shadowLayer, fiberLayer, mainLayer }));
