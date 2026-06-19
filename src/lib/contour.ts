/**
 * Contour extraction and geometry helpers.
 *
 * Two tracing modes:
 *   - "outline": Otsu threshold -> largest connected component -> single boundary.
 *     Best for silhouettes, logos and high-contrast shapes.
 *   - "detail":  Sobel edges -> many contours -> stitched into one path.
 *     Best for photos / portraits, where features live in interior edges.
 *
 * The DOM-free functions (resampleClosed, normalize, stitchPaths) are pure.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Complex {
  re: number;
  im: number;
}

export type TraceMode = 'outline' | 'detail';

export interface TraceOptions {
  mode: TraceMode;
  /** 1–10; higher keeps more (and finer) edges in detail mode. */
  detail: number;
}

export interface TraceResult {
  /** Ordered points; treated as a closed loop downstream. */
  path: Pt[];
  /** How many separate contours were stitched together. */
  segments: number;
}

/* ------------------------------------------------------------------ */
/* Pure geometry (no DOM)                                             */
/* ------------------------------------------------------------------ */

/** Resample a closed polygon to exactly `n` points spaced evenly by arc length. */
export function resampleClosed(points: Pt[], n: number): Pt[] {
  const m = points.length;
  if (m === 0) return [];
  if (m === 1) return Array.from({ length: n }, () => ({ ...points[0] }));

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

/** Center on the centroid and scale so the largest coordinate magnitude is 1. */
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

/**
 * Concatenate many contours into one path, visiting them greedily by nearest
 * endpoint so the connecting "travel" segments stay short.
 */
export function stitchPaths(paths: Pt[][]): Pt[] {
  const list = paths.filter((p) => p.length > 1);
  if (list.length === 0) return [];
  if (list.length === 1) return list[0];

  const used = new Array<boolean>(list.length).fill(false);
  const result: Pt[] = [];

  // Start from the longest contour (usually the dominant outline).
  let currentIdx = 0;
  for (let i = 1; i < list.length; i++) if (list[i].length > list[currentIdx].length) currentIdx = i;

  used[currentIdx] = true;
  result.push(...list[currentIdx]);

  for (let placed = 1; placed < list.length; placed++) {
    const tail = result[result.length - 1];
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      if (used[i]) continue;
      const head = list[i][0];
      const d = (head.x - tail.x) ** 2 + (head.y - tail.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best < 0) break;
    used[best] = true;
    result.push(...list[best]);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Browser image pipeline                                             */
/* ------------------------------------------------------------------ */

/** Decode an image and return an ordered contour for the chosen trace mode. */
export async function fileToContour(file: File, opts: TraceOptions): Promise<TraceResult> {
  const img = await loadImage(file);

  if (opts.mode === 'detail') {
    const { data, width, height } = drawToImageData(img, 260);
    const edges = sobelEdgeMask(data, width, height, opts.detail);
    const minSize = Math.max(8, Math.round(36 - opts.detail * 3));
    let paths = extractContours(edges, width, height, minSize);
    if (paths.length === 0) {
      throw new Error('No edges detected — try a higher-contrast photo or raise Detail.');
    }
    paths.sort((a, b) => b.length - a.length);
    if (paths.length > 600) paths = paths.slice(0, 600);
    const path = stitchPaths(paths);
    if (path.length < 8) throw new Error('Not enough edge detail to trace.');
    return { path, segments: paths.length };
  }

  const { data, width, height } = drawToImageData(img, 320);
  const mask = buildForegroundMask(data, width, height);
  const component = largestComponent(mask, width, height);
  if (!component) throw new Error('No distinct shape found — try a higher-contrast image.');
  const boundary = mooreTrace(component, width, height);
  if (boundary.length < 8) throw new Error('Contour too small to trace — try a bolder image.');
  return { path: boundary, segments: 1 };
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

function luminance(data: Uint8ClampedArray, i: number): number {
  const a = data[i * 4 + 3];
  if (a < 16) return 255; // transparent → white background
  return 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
}

/* ------------------------ outline mode --------------------------- */

function buildForegroundMask(data: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const n = w * h;
  const gray = new Uint8Array(n);
  const hist = new Array<number>(256).fill(0);

  for (let i = 0; i < n; i++) {
    const lum = Math.round(luminance(data, i));
    gray[i] = lum;
    hist[lum]++;
  }

  const t = otsuThreshold(hist, n);

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
    mask[i] = (backgroundIsDark ? !isDark : isDark) ? 1 : 0;
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

function largestComponent(mask: Uint8Array, w: number, h: number): Uint8Array | null {
  const { labels, comps } = labelComponents(mask, w, h);
  if (comps.length === 0) return null;
  let best = comps[0];
  for (const c of comps) if (c.size > best.size) best = c;
  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = labels[i] === best.label ? 1 : 0;
  return out;
}

/* ------------------------- detail mode --------------------------- */

/** Sobel gradient magnitude, thresholded to keep roughly the top P% as edges.
 * Exported for unit testing. */
export function sobelEdgeMask(data: Uint8ClampedArray, w: number, h: number, detail: number): Uint8Array {
  const n = w * h;
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) gray[i] = luminance(data, i);

  const mag = new Float32Array(n);
  let maxMag = 1e-6;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = gray[i - w - 1];
      const tc = gray[i - w];
      const tr = gray[i - w + 1];
      const ml = gray[i - 1];
      const mr = gray[i + 1];
      const bl = gray[i + w - 1];
      const bc = gray[i + w];
      const br = gray[i + w + 1];
      const gx = tr + 2 * mr + br - tl - 2 * ml - bl;
      const gy = bl + 2 * bc + br - tl - 2 * tc - tr;
      const m = Math.hypot(gx, gy);
      mag[i] = m;
      if (m > maxMag) maxMag = m;
    }
  }

  // Percentile threshold over all pixels (robust to overall contrast). More
  // detail keeps a larger fraction. Floor the bin so flat (zero-gradient)
  // regions are never selected on clean, high-contrast images.
  const hist = new Int32Array(256);
  for (let i = 0; i < n; i++) hist[Math.min(255, Math.floor((mag[i] / maxMag) * 255))]++;

  const percent = Math.min(28, Math.max(8, detail * 2 + 6));
  const want = (n * percent) / 100;
  let acc = 0;
  let thrBin = 255;
  for (let b = 255; b >= 0; b--) {
    acc += hist[b];
    if (acc >= want) {
      thrBin = b;
      break;
    }
  }
  thrBin = Math.max(1, thrBin);
  const thr = (thrBin / 255) * maxMag;

  const raw = new Uint8Array(n);
  for (let i = 0; i < n; i++) raw[i] = mag[i] >= thr ? 1 : 0;
  // Dilate by one pixel so thin, broken edges connect into traceable components.
  return dilate(raw, w, h);
}

/** 3×3 binary dilation. */
function dilate(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] !== 1) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          out[ny * w + nx] = 1;
        }
      }
    }
  }
  return out;
}

/** Boundary contour of every connected component at least `minSize` pixels.
 * Exported for unit testing. */
export function extractContours(mask: Uint8Array, w: number, h: number, minSize: number): Pt[][] {
  const { labels, comps } = labelComponents(mask, w, h);
  const paths: Pt[][] = [];
  for (const c of comps) {
    if (c.size < minSize) continue;
    const path = traceFrom(
      (x, y) => x >= 0 && y >= 0 && x < w && y < h && labels[y * w + x] === c.label,
      c.sx,
      c.sy,
      c.size * 4 + 64,
    );
    if (path.length >= 6) paths.push(path);
  }
  return paths;
}

/* ----------------------- shared primitives ----------------------- */

interface Component {
  label: number;
  size: number;
  sx: number; // seed (topmost-leftmost) pixel
  sy: number;
}

/** Label 8-connected foreground components; records size and seed of each. */
function labelComponents(mask: Uint8Array, w: number, h: number) {
  const n = w * h;
  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  const comps: Component[] = [];
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
    comps.push({ label, size, sx: start % w, sy: (start / w) | 0 });
  }
  return { labels, comps };
}

function mooreTrace(mask: Uint8Array, w: number, h: number): Pt[] {
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
  return traceFrom((x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1, sx, sy, w * h * 4);
}

/** Moore-neighbor boundary tracing (clockwise) from a known start pixel. */
function traceFrom(fg: (x: number, y: number) => boolean, sx: number, sy: number, maxSteps: number): Pt[] {
  const dirs = [
    [1, 0], // E
    [1, 1], // SE
    [0, 1], // S
    [-1, 1], // SW
    [-1, 0], // W
    [-1, -1], // NW
    [0, -1], // N
    [1, -1], // NE
  ];

  const contour: Pt[] = [{ x: sx, y: sy }];
  let cx = sx;
  let cy = sy;
  let backtrack = 4; // entered from the West

  for (let step = 0; step < maxSteps; step++) {
    let found = -1;
    for (let i = 1; i <= 8; i++) {
      const d = (backtrack + i) % 8;
      if (fg(cx + dirs[d][0], cy + dirs[d][1])) {
        found = d;
        break;
      }
    }
    if (found < 0) break;

    cx += dirs[found][0];
    cy += dirs[found][1];
    backtrack = (found + 4) % 8;

    if (cx === sx && cy === sy) break;
    contour.push({ x: cx, y: cy });
  }
  return contour;
}
