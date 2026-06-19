import type { Pt } from './contour';

/**
 * Classic heart curve, sampled densely. The pipeline resamples it by arc length,
 * so the exact sample count here only needs to be high enough to look smooth.
 *
 *   x = 16 sin³t
 *   y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t   (negated for screen coordinates)
 */
export function heartContour(samples = 720): Pt[] {
  const pts: Pt[] = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    pts[i] = { x, y };
  }
  return pts;
}
