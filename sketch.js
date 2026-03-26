// Binary patterns, dot grids, hatching, dithering, hard color blocks

const PALETTES = [
  {
    name: 'signal',
    bg: [0, 0, 0],
    colors: [
      [255, 0, 40],    // Hård rød
      [30, 60, 255],   // Skarp blå
      [255, 255, 255], // Hvid
      [0, 0, 0],       // Sort
      [140, 0, 255],   // Violet
    ],
    gradPairs: [[255,0,40], [30,60,255]],
  },
  {
    name: 'phosphor',
    bg: [0, 0, 0],
    colors: [
      [0, 255, 120],   // Grøn phosphor
      [255, 0, 60],    // Rød
      [255, 255, 255], // Hvid
      [0, 0, 0],       // Sort
      [0, 200, 255],   // Cyan
    ],
    gradPairs: [[0,255,120], [0,200,255]],
  },
  {
    name: 'heat',
    bg: [0, 0, 0],
    colors: [
      [255, 60, 0],    // Orange
      [255, 0, 80],    // Pink
      [255, 255, 255], // Hvid
      [0, 0, 0],       // Sort
      [255, 200, 0],   // Gul
    ],
    gradPairs: [[255,60,0], [255,0,80]],
  },
  {
    name: 'cold',
    bg: [0, 0, 0],
    colors: [
      [0, 100, 255],   // Blå
      [180, 0, 255],   // Lilla
      [255, 255, 255], // Hvid
      [0, 0, 0],       // Sort
      [255, 20, 60],   // Rød accent
    ],
    gradPairs: [[0,100,255], [180,0,255]],
  },
];

let pal;
let seed;
let pg;

function setup() {
  createCanvas(1080, 1080);
  pg = createGraphics(1080, 1080);
  pixelDensity(1);
  pg.pixelDensity(1);
  noLoop();
}

function draw() {
  seed = floor(random(999999));
  randomSeed(seed);
  noiseSeed(seed);

  pal = random(PALETTES);
  background(0);
  pg.background(0);

  let grid = buildGrid();
  for (let block of grid) {
    drawBlock(block);
  }

  image(pg, 0, 0);
  applyDisplacement();
  applyChromaticShift();
  applyScanlineNoise();

  console.log(`pfp-gen | ${pal.name} | seed: ${seed}`);
  let seedEl = document.getElementById('seed-display');
  if (seedEl) seedEl.innerText = 'seed: ' + seed;
}

// ═══════════════════════════════════════════════════════════════
// GRID — del canvas i uregelmæssige rektangler
// ═══════════════════════════════════════════════════════════════
function buildGrid() {
  let blocks = [];
  let cellSize = floor(random(60, 140));
  let cols = ceil(width / cellSize);
  let rows = ceil(height / cellSize);
  let occupied = Array.from({length: rows}, () => Array(cols).fill(false));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (occupied[r][c]) continue;

      let spanC = 1, spanR = 1;
      if (random() > 0.4) spanC = floor(random(1, min(4, cols - c + 1)));
      if (random() > 0.5) spanR = floor(random(1, min(3, rows - r + 1)));

      let canMerge = true;
      for (let dr = 0; dr < spanR && canMerge; dr++) {
        for (let dc = 0; dc < spanC && canMerge; dc++) {
          if (r + dr >= rows || c + dc >= cols || occupied[r + dr][c + dc]) canMerge = false;
        }
      }
      if (!canMerge) { spanC = 1; spanR = 1; }

      for (let dr = 0; dr < spanR; dr++) {
        for (let dc = 0; dc < spanC; dc++) {
          occupied[r + dr][c + dc] = true;
        }
      }

      blocks.push({
        x: c * cellSize,
        y: r * cellSize,
        w: spanC * cellSize,
        h: spanR * cellSize,
      });
    }
  }
  return blocks;
}

// ═══════════════════════════════════════════════════════════════
// BLOCK RENDERER
// ═══════════════════════════════════════════════════════════════
function drawBlock(block) {
  let type = floor(random(14));
  switch(type) {
    case 0: fillDotGrid(block); break;
    case 1: fillVerticalBars(block); break;
    case 2: fillHorizontalBars(block); break;
    case 3: fillDiagonalHatch(block); break;
    case 4: fillSolidColor(block); break;
    case 5: fillGradientBlend(block); break;
    case 6: fillDithering(block); break;
    case 7: fillBlank(block); break;
    case 8: fillCheckerboard(block); break;
    case 9: fillNoiseBlob(block); break;
    case 10: fillSmallGrid(block); break;
    case 11: fillDataRows(block); break;
    case 12: fillCrossHatch(block); break;
    case 13: fillStipple(block); break;
  }
}

function pickColor() { return random(pal.colors); }

// ─── DOT GRID ───
function fillDotGrid({x, y, w, h}) {
  let spacing = floor(random(4, 14));
  let dotSize = random(1, max(2, spacing * 0.5));
  let c = pickColor();

  if (random() > 0.5) { pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h); }

  pg.fill(c[0], c[1], c[2]);
  pg.noStroke();
  for (let dy = y + spacing; dy < y + h; dy += spacing) {
    for (let dx = x + spacing; dx < x + w; dx += spacing) {
      if (random() > 0.15) pg.ellipse(dx, dy, dotSize, dotSize);
    }
  }
}

// ─── VERTICAL BARS ───
function fillVerticalBars({x, y, w, h}) {
  let barW = floor(random(2, 16));
  let gap = floor(random(1, max(2, barW)));
  let c = pickColor();
  let bgc = random() > 0.5 ? [0,0,0] : pickColor();

  pg.fill(bgc[0], bgc[1], bgc[2]); pg.noStroke(); pg.rect(x, y, w, h);
  pg.fill(c[0], c[1], c[2]);

  for (let dx = x; dx < x + w; dx += barW + gap) {
    let bh = random() > 0.8 ? random(h * 0.3, h) : h;
    let by = random() > 0.8 ? y + random(0, h - bh) : y;
    pg.rect(dx, by, barW, bh);
  }
}

// ─── HORIZONTAL BARS ───
function fillHorizontalBars({x, y, w, h}) {
  let barH = floor(random(1, 8));
  let gap = floor(random(1, max(2, barH)));
  let c = pickColor();

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  pg.fill(c[0], c[1], c[2]);

  for (let dy = y; dy < y + h; dy += barH + gap) {
    let bw = random() > 0.9 ? random(w * 0.3, w) : w;
    let bx = random() > 0.9 ? x + random(0, w - bw) : x;
    pg.rect(bx, dy, bw, barH);
  }
}

// ─── DIAGONAL HATCH ───
function fillDiagonalHatch({x, y, w, h}) {
  let spacing = floor(random(3, 12));
  let c = pickColor();

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  pg.stroke(c[0], c[1], c[2]);
  pg.strokeWeight(random(0.5, 2));

  // Tegn diagonaler med clipping via drawingContext
  pg.drawingContext.save();
  pg.drawingContext.beginPath();
  pg.drawingContext.rect(x, y, w, h);
  pg.drawingContext.clip();

  for (let i = -(w + h); i < (w + h); i += spacing) {
    pg.line(x + i, y, x + i + h, y + h);
  }
  pg.drawingContext.restore();
}

// ─── SOLID COLOR ───
function fillSolidColor({x, y, w, h}) {
  let c = pickColor();
  pg.fill(c[0], c[1], c[2]); pg.noStroke(); pg.rect(x, y, w, h);

  if (random() > 0.4) {
    let c2 = pickColor();
    let m = random(4, min(w, h) * 0.3);
    pg.fill(c2[0], c2[1], c2[2]);
    pg.rect(x + m, y + m, w - m * 2, h - m * 2);
  }
}

// ─── GRADIENT BLEND ───
function fillGradientBlend({x, y, w, h}) {
  let c1 = pal.gradPairs[0];
  let c2 = pal.gradPairs[1];
  let horizontal = random() > 0.5;

  pg.loadPixels();
  for (let dy = y; dy < min(y + h, height); dy++) {
    for (let dx = x; dx < min(x + w, width); dx++) {
      let t = horizontal ? (dx - x) / w : (dy - y) / h;
      let idx = (dy * width + dx) * 4;
      pg.pixels[idx]     = lerp(c1[0], c2[0], t);
      pg.pixels[idx + 1] = lerp(c1[1], c2[1], t);
      pg.pixels[idx + 2] = lerp(c1[2], c2[2], t);
      pg.pixels[idx + 3] = 255;
    }
  }
  pg.updatePixels();
}

// ─── BAYER DITHERING ───
function fillDithering({x, y, w, h}) {
  let c1 = pickColor();
  let c2 = random() > 0.6 ? [0,0,0] : pickColor();
  let threshold = random(0.2, 0.8);
  let scale = floor(random(2, 6));

  let bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];

  pg.loadPixels();
  for (let dy = y; dy < min(y + h, height); dy++) {
    for (let dx = x; dx < min(x + w, width); dx++) {
      let bx = floor((dx - x) / scale) % 4;
      let by = floor((dy - y) / scale) % 4;
      let c = (bayer[by][bx] / 16) > threshold ? c1 : c2;
      let idx = (dy * width + dx) * 4;
      pg.pixels[idx] = c[0]; pg.pixels[idx+1] = c[1]; pg.pixels[idx+2] = c[2]; pg.pixels[idx+3] = 255;
    }
  }
  pg.updatePixels();
}

// ─── BLANK / OUTLINE ───
function fillBlank({x, y, w, h}) {
  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  if (random() > 0.5) {
    let c = pickColor();
    pg.noFill(); pg.stroke(c[0], c[1], c[2], random(40, 120)); pg.strokeWeight(0.5);
    pg.rect(x + 2, y + 2, w - 4, h - 4);
  }
}

// ─── CHECKERBOARD ───
function fillCheckerboard({x, y, w, h}) {
  let size = floor(random(3, 16));
  let c1 = pickColor();
  let c2 = random() > 0.5 ? [0,0,0] : pickColor();

  pg.noStroke();
  for (let dy = y; dy < y + h; dy += size) {
    for (let dx = x; dx < x + w; dx += size) {
      let isEven = (floor((dx - x) / size) + floor((dy - y) / size)) % 2 === 0;
      let c = isEven ? c1 : c2;
      pg.fill(c[0], c[1], c[2]);
      pg.rect(dx, dy, size, size);
    }
  }
}

// ─── NOISE BLOB ───
function fillNoiseBlob({x, y, w, h}) {
  let c = pickColor();
  let nScale = random(0.01, 0.04);
  let threshold = random(0.4, 0.65);

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);

  pg.loadPixels();
  for (let dy = y; dy < min(y + h, height); dy++) {
    for (let dx = x; dx < min(x + w, width); dx++) {
      let n = noise(dx * nScale + seed * 0.1, dy * nScale);
      if (n > threshold) {
        let idx = (dy * width + dx) * 4;
        let bright = map(n, threshold, 1, 0.5, 1);
        pg.pixels[idx] = c[0] * bright; pg.pixels[idx+1] = c[1] * bright; pg.pixels[idx+2] = c[2] * bright; pg.pixels[idx+3] = 255;
      }
    }
  }
  pg.updatePixels();
}

// ─── SMALL GRID / PIXEL MOSAIC ───
function fillSmallGrid({x, y, w, h}) {
  let cellW = floor(random(4, 20));
  let cellH = floor(random(4, 20));

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  pg.noStroke();

  for (let dy = y; dy < y + h; dy += cellH) {
    for (let dx = x; dx < x + w; dx += cellW) {
      if (random() > 0.3) {
        let c = pickColor();
        pg.fill(c[0], c[1], c[2], random(100, 255));
        pg.rect(dx, dy, cellW - 1, cellH - 1);
      }
    }
  }
}

// ─── DATA ROWS ───
function fillDataRows({x, y, w, h}) {
  let rowH = floor(random(2, 8));

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);

  for (let dy = y; dy < y + h; dy += rowH) {
    let dx = x;
    while (dx < x + w) {
      let bw = random(2, w * 0.4);
      if (random() > 0.6) bw = random(1, 3);

      if (random() > 0.25) {
        let c = pickColor();
        pg.fill(c[0], c[1], c[2]);
        pg.rect(dx, dy, bw, rowH);
      }
      dx += bw;
    }
  }
}

// ─── CROSS HATCH ───
function fillCrossHatch({x, y, w, h}) {
  let spacing = floor(random(3, 10));
  let c = pickColor();

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  pg.stroke(c[0], c[1], c[2]);
  pg.strokeWeight(random(0.5, 1.5));

  pg.drawingContext.save();
  pg.drawingContext.beginPath();
  pg.drawingContext.rect(x, y, w, h);
  pg.drawingContext.clip();

  for (let i = -(w + h); i < (w + h); i += spacing) {
    pg.line(x + i, y, x + i + h, y + h);
    pg.line(x + i + w, y, x + i + w - h, y + h);
  }
  pg.drawingContext.restore();
}

// ─── STIPPLE / STATIC ───
function fillStipple({x, y, w, h}) {
  let density = random(0.05, 0.4);
  let c = pickColor();

  pg.fill(0); pg.noStroke(); pg.rect(x, y, w, h);
  pg.fill(c[0], c[1], c[2]);

  let numDots = floor(w * h * density / 4);
  for (let i = 0; i < numDots; i++) {
    pg.rect(x + random(w), y + random(h), 1, 1);
  }
}

// ═══════════════════════════════════════════════════════════════
// POST-PROCESSING
// ═══════════════════════════════════════════════════════════════
function applyDisplacement() {
  loadPixels();
  let numDisplace = floor(random(5, 25));

  for (let d = 0; d < numDisplace; d++) {
    let sy = floor(random(height));
    let sh = floor(random(1, 30));
    let offset = floor(random(-80, 80));

    for (let row = sy; row < min(sy + sh, height); row++) {
      let temp = new Array(width * 4);
      for (let px = 0; px < width; px++) {
        let idx = (row * width + px) * 4;
        temp[px * 4] = pixels[idx]; temp[px * 4+1] = pixels[idx+1];
        temp[px * 4+2] = pixels[idx+2]; temp[px * 4+3] = pixels[idx+3];
      }
      for (let px = 0; px < width; px++) {
        let srcPx = ((px - offset) % width + width) % width;
        let dstIdx = (row * width + px) * 4;
        pixels[dstIdx] = temp[srcPx*4]; pixels[dstIdx+1] = temp[srcPx*4+1];
        pixels[dstIdx+2] = temp[srcPx*4+2]; pixels[dstIdx+3] = temp[srcPx*4+3];
      }
    }
  }
  updatePixels();
}

function applyChromaticShift() {
  loadPixels();
  let shift = floor(random(2, 6));
  let copy = pixels.slice();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let idx = (y * width + x) * 4;
      pixels[idx] = copy[(y * width + ((x + shift) % width)) * 4];
      pixels[idx + 2] = copy[(y * width + ((x - shift + width) % width)) * 4 + 2];
    }
  }
  updatePixels();
}

function applyScanlineNoise() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    if (random() > 0.97) {
      for (let x = 0; x < width; x++) {
        let idx = (y * width + x) * 4;
        let n = random(255);
        pixels[idx] = n; pixels[idx+1] = n; pixels[idx+2] = n;
      }
    }
  }
  updatePixels();
}

// ═══════════════════════════════════════════════════════════════
// INTERAKTION
// ═══════════════════════════════════════════════════════════════
function mousePressed() {
  // Only trigger on canvas, not on buttons
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    redraw();
    return false; // Prevents default browser behavior (scroll)
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas(`pfp_${pal.name}_${seed}`, 'png');
  if (key === ' ') redraw();
}
