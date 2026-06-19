/**
 * Contour extraction and geometry helpers.
 *
 * The DOM-free functions (`resampleClosed`, `normalize`) are pure and unit-testable.
 * `fileToBoundary` is the browser pipeline: image -> grayscale -> Otsu threshold ->
 * largest connected component -> Moore-neighbor boundary trace.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Complex {
  re: number;
  im: number;
}

/* ------------------------------------------------------------------ */
/* Pure geometry (no DOM)                                              */
/* ------------------------------------------------------------------ */

/**
 * Resample a closed polygon to exactly `n` points spaced evenly by arc length.
 * The input is treated as a loop (last point connects back to the first).
 */
export function resampleClosed(points: Pt[], n: number): Pt[] {
  const m = points.length;
  if (m === 0) return [];
  if (m === 1) return Array.from({ length: n }, () => ({ ...points[0] }));

  // Cumulative arc length around the loop. `cum` has length m + 1.
  const cum: number[] = new Array(m + 1);
  cum[0] = 0;
  for (let i = 1; i <= m; i++) {
    const a = points[i - 1];
    const b = points[i % m];
    cum[i] = cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
  }
  const total = cum[m];
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0] }));

  const out: Pt[] = new Array(n);
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / n) * total;
    while (seg < m - 1 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg];
    const t = segLen > 0 ? (target - cum[seg]) / segLen : 0;
    const a = points[seg];
    const b = points[(seg + 1) % m];
    out[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  return out;
}

/**
 * Center points on their centroid and scale so the largest coordinate magnitude
 * is 1. Returns complex numbers (x -> re, y -> im) ready for the DFT.
 */
export function normalize(points: Pt[]): Complex[] {
  const n = points.length;
  if (n === 0) return [];

  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;

  let maxAbs = 1e-9;
  for (const p of points) {
    maxAbs = Math.max(maxAbs, Math.abs(p.x - cx), Math.abs(p.y - cy));
  }

  return points.map((p) => ({ re: (p.x - cx) / maxAbs, im: (p.y - cy) / maxAbs }));
}

/* ------------------------------------------------------------------ */
/* Browser image pipeline                                             */
/* ------------------------------------------------------------------ */

/**
 * Decode an image file and return the ordered boundary of its dominant shape.
 * Throws a human-readable error when no traceable contour is found.
 */
export async function fileToBoundary(file: File, maxSize = 320): Promise<Pt[]> {
  const img = await loadImage(file);
  const { data, width, height } = drawToImageData(img, maxSize);
  const mask = buildForegroundMask(data, width, height);
  const component = largestComponent(mask, width, height);
  if (!component) {
    throw new Error('No distinct shape found — try a higher-contrast image.');
  }
  const boundary = mooreTrace(component, width, height);
  if (boundary.length < 8) {
    throw new Error('Contour too small to trace — try a larger or bolder image.');
  }
  return boundary;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load that file as an image.'));
    };
    img.src = url;
  });
}

function drawToImageData(img: HTMLImageElement, maxSize: number) {
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
  const scale = Math.min(1, maxSize / longest);
  const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context is unavailable in this browser.');
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  return { data, width, height };
}

/**
 * Grayscale + Otsu threshold. Foreground is whichever class does NOT dominate the
 * image border, so this handles both dark-on-light and light-on-dark images.
 */
function buildForegroundMask(data: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const n = w * h;
  const gray = new Uint8Array(n);
  const hist = new Array<number>(256).fill(0);

  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    // Treat (near-)transparent pixels as white background.
    const lum = a < 16 ? 255 : Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = lum;
    hist[lum]++;
  }

  const t = otsuThreshold(hist, n);

  // Decide which class is background by sampling the border ring.
  let borderDark = 0;
  let borderCount = 0;
  const sample = (i: number) => {
    if (gray[i] <= t) borderDark++;
    borderCount++;
  };
  for (let x = 0; x < w; x++) {
    sample(x);
    sample((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    sample(y * w);
    sample(y * w + (w - 1));
  }
  const backgroundIsDark = borderDark * 2 > borderCount;

  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const isDark = gray[i] <= t;
    const isForeground = backgroundIsDark ? !isDark : isDark;
    mask[i] = isForeground ? 1 : 0;
  }
  return mask;
}

function otsuThreshold(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0;
  let wB = 0;
  let maxVar = -1;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
}

/** BFS flood fill (8-connectivity); returns a mask of only the largest blob. */
function largestComponent(mask: Uint8Array, w: number, h: number): Uint8Array | null {
  const n = w * h;
  const labels = new Int32Array(n); // 0 = unvisited
  const queue = new Int32Array(n);
  let bestLabel = -1;
  let bestSize = 0;
  let label = 0;

  for (let start = 0; start < n; start++) {
    if (mask[start] !== 1 || labels[start] !== 0) continue;
    label++;
    let qs = 0;
    let qe = 0;
    queue[qe++] = start;
    labels[start] = label;
    let size = 0;

    while (qs < qe) {
      const p = queue[qs++];
      size++;
      const px = p % w;
      const py = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = py + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = px + dx;
          if (nx < 0 || nx >= w) continue;
          const np = ny * w + nx;
          if (mask[np] === 1 && labels[np] === 0) {
            labels[np] = label;
            queue[qe++] = np;
          }
        }
      }
    }

    if (size > bestSize) {
      bestSize = size;
      bestLabel = label;
    }
  }

  if (bestLabel < 0) return null;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = labels[i] === bestLabel ? 1 : 0;
  return out;
}

/**
 * Moore-neighbor boundary tracing (clockwise). Returns the ordered outer
 * boundary of the first foreground pixel found by a top-to-bottom scan.
 */
function mooreTrace(mask: Uint8Array, w: number, h: number): Pt[] {
  // Clockwise neighbor offsets starting East.
  const dirs = [
    [1, 0], // 0 E
    [1, 1], // 1 SE
    [0, 1], // 2 S
    [-1, 1], // 3 SW
    [-1, 0], // 4 W
    [-1, -1], // 5 NW
    [0, -1], // 6 N
    [1, -1], // 7 NE
  ];
  const fg = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  // Start = topmost, then leftmost foreground pixel.
  let sx = -1;
  let sy = -1;
  for (let y = 0; y < h && sy < 0; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === 1) {
        sx = x;
        sy = y;
        break;
      }
    }
  }
  if (sx < 0) return [];

  const contour: Pt[] = [{ x: sx, y: sy }];
  let cx = sx;
  let cy = sy;
  // We entered the start pixel from the West (its left neighbor is background).
  let backtrack = 4;
  const maxSteps = w * h * 4;

  for (let step = 0; step < maxSteps; step++) {
    let found = -1;
    // Scan clockwise beginning just after the backtrack direction.
    for (let i = 1; i <= 8; i++) {
      const d = (backtrack + i) % 8;
      if (fg(cx + dirs[d][0], cy + dirs[d][1])) {
        found = d;
        break;
      }
    }
    if (found < 0) break; // isolated pixel

    cx += dirs[found][0];
    cy += dirs[found][1];
    backtrack = (found + 4) % 8; // direction from the new pixel back to the old one

    if (cx === sx && cy === sy) break; // closed the loop
    contour.push({ x: cx, y: cy });
  }

  return contour;
}
