/**
 * Fourier decomposition of a closed contour into epicycles.
 *
 * A contour is a periodic complex signal z(t) = x(t) + i·y(t). Its discrete
 * Fourier transform yields one rotating vector ("epicycle") per frequency:
 *
 *     z(t) = Σ  c_k · e^{ i (2π f_k t + φ_k) }
 *             k
 *
 * Each term has amplitude |c_k| (circle radius), frequency f_k (rotation speed,
 * signed for clockwise/counter-clockwise) and phase φ_k (starting angle).
 */
import { fft, complex } from 'mathjs';
import { normalize, resampleClosed, type Complex, type Pt } from './contour';

export interface Epicycle {
  freq: number;
  amp: number;
  phase: number;
}

/** Number of samples taken around a contour — also the number of epicycles produced. */
export const SAMPLE_COUNT = 1024;

/** Run the FFT on a normalized complex signal and return epicycles sorted by amplitude. */
export function computeEpicycles(signal: Complex[]): Epicycle[] {
  const N = signal.length;
  if (N === 0) return [];

  const input = signal.map((c) => complex(c.re, c.im));
  const spectrum = fft(input) as unknown as Array<{ re: number; im: number }>;

  const epicycles: Epicycle[] = spectrum.map((X, k) => {
    const re = X.re;
    const im = X.im;
    // Map bins above Nyquist to negative frequencies so vectors can spin both ways.
    const freq = k <= N / 2 ? k : k - N;
    return {
      freq,
      amp: Math.hypot(re, im) / N,
      phase: Math.atan2(im, re),
    };
  });

  // Largest circles first — drawing them in this order keeps the chain stable.
  epicycles.sort((a, b) => b.amp - a.amp);
  return epicycles;
}

/** Full pipeline: raw ordered boundary -> resample -> normalize -> epicycles. */
export function contourToEpicycles(boundary: Pt[], sampleCount = SAMPLE_COUNT): Epicycle[] {
  const resampled = resampleClosed(boundary, sampleCount);
  const normalized = normalize(resampled);
  return computeEpicycles(normalized);
}
