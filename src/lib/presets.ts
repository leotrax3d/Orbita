import type { Pt } from './contour';

export interface Preset {
  id: string;
  label: string;
  build: () => Pt[];
}

/** Sample a closed parametric curve f(t), t in [0, 2π), into `n` points. */
function sampleCurve(n: number, f: (t: number) => Pt): Pt[] {
  const pts: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) pts[i] = f((i / n) * Math.PI * 2);
  return pts;
}

/** Classic heart curve (negated y for screen coordinates). */
export function heartContour(n = 720): Pt[] {
  return sampleCurve(n, (t) => ({
    x: 16 * Math.sin(t) ** 3,
    y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
  }));
}

/** Five-pointed star as a 10-vertex polygon; edges are resampled downstream. */
function starContour(points = 5, outer = 1, inner = 0.42): Pt[] {
  const verts: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    verts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  return verts;
}

/** Rose curve r = cos(k·t); k = 4 yields an eight-petal flower. */
function flowerContour(n = 720, k = 4): Pt[] {
  return sampleCurve(n, (t) => {
    const r = Math.cos(k * t);
    return { x: r * Math.cos(t), y: r * Math.sin(t) };
  });
}

/** Lemniscate of Gerono — a clean figure-eight. */
function infinityContour(n = 720): Pt[] {
  return sampleCurve(n, (t) => ({
    x: Math.cos(t),
    y: Math.sin(t) * Math.cos(t),
  }));
}

export const PRESETS: Preset[] = [
  { id: 'heart', label: 'Heart', build: () => heartContour() },
  { id: 'star', label: 'Star', build: () => starContour() },
  { id: 'flower', label: 'Flower', build: () => flowerContour() },
  { id: 'infinity', label: 'Infinity', build: () => infinityContour() },
];
