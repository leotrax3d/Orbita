import type { Epicycle } from '../lib/fourier';

interface Props {
  epicycles: Epicycle[];
  bars?: number;
}

/** A compact bar chart of the largest epicycle amplitudes (the shape's spectrum). */
export default function Spectrum({ epicycles, bars = 48 }: Props) {
  // epicycles are already sorted by amplitude descending; skip the DC term (k=0).
  const slice = epicycles.filter((e) => e.freq !== 0).slice(0, bars);
  const max = slice.length ? slice[0].amp : 1;

  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-1 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        Amplitude spectrum
      </h2>
      <p className="mb-3 font-body text-xs text-ink/55">
        The {bars} strongest frequency components — most of the shape lives in the first few.
      </p>
      <div className="flex h-24 items-end gap-[2px]">
        {slice.map((e, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-accent/80"
            style={{ height: `${Math.max(2, (e.amp / max) * 100)}%` }}
            title={`freq ${e.freq}, amp ${e.amp.toFixed(3)}`}
          />
        ))}
      </div>
    </div>
  );
}
