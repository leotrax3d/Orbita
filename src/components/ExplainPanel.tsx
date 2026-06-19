export default function ExplainPanel() {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        How it works
      </h2>

      <div className="space-y-4 font-body text-sm leading-relaxed text-ink/75">
        <p>
          A closed outline can be read as a periodic complex signal — each point is a
          number <span className="italic">z = x + i·y</span> as you travel once around the loop.
        </p>

        <div className="rounded-lg border border-edge bg-paper px-3 py-2 text-center">
          <p className="font-body text-base italic text-ink/80">
            z(t) = Σ c<sub>k</sub> e<sup> i(2π f<sub>k</sub> t + φ<sub>k</sub>)</sup>
          </p>
        </div>

        <p>
          The <span className="font-medium text-ink">Fourier transform</span> (FFT) splits that
          signal into rotating vectors — <span className="font-medium text-ink">epicycles</span>.
          Each has a radius |c<sub>k</sub>| (circle size), a frequency f<sub>k</sub> (how fast it
          spins, signed for either direction) and a phase φ<sub>k</sub> (where it starts).
        </p>

        <p>
          Chained tip-to-tail and animated, the end of the last vector retraces the original
          outline. The biggest circles set the broad shape; the small fast ones add detail —
          raise <span className="font-medium text-ink">Epicycles</span> to watch it sharpen.
        </p>

        <div className="border-t border-edge pt-3">
          <h3 className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wide text-ink/60">
            From image to vectors
          </h3>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              <span className="font-medium text-ink">Outline</span> mode: threshold → largest shape
              → trace its boundary.
            </li>
            <li>
              <span className="font-medium text-ink">Photo</span> mode: Sobel edges → many contours
              → stitched into one continuous path.
            </li>
            <li>Resample evenly by arc length, then FFT → epicycles, sorted by size.</li>
          </ol>
        </div>

        <p className="text-ink/55">
          Everything runs in your browser — no upload leaves your device.
        </p>
      </div>
    </div>
  );
}
