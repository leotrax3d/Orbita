import { useCallback, useEffect, useState } from 'react';
import EpicycleCanvas from './components/EpicycleCanvas';
import Controls from './components/Controls';
import Uploader, { type Status } from './components/Uploader';
import Header from './components/Header';
import { fileToBoundary } from './lib/contour';
import { contourToEpicycles, type Epicycle } from './lib/fourier';
import { heartContour } from './lib/presets';

export default function App() {
  const [epicycles, setEpicycles] = useState<Epicycle[]>([]);
  const [count, setCount] = useState(120);
  const [speed, setSpeed] = useState(6);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', msg: '' });
  const [source, setSource] = useState('heart · preset');

  // Animate immediately with a preset so the canvas is never empty.
  useEffect(() => {
    setEpicycles(contourToEpicycles(heartContour()));
  }, []);

  const handleImage = useCallback(async (file: File) => {
    setBusy(true);
    setStatus({ type: 'info', msg: 'Extracting contour…' });
    try {
      const boundary = await fileToBoundary(file);
      setEpicycles(contourToEpicycles(boundary));
      setSource(file.name);
      setStatus({ type: 'idle', msg: '' });
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Could not process that image.',
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const activeCount = Math.min(count, epicycles.length || count);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          {/* Signature canvas */}
          <section className="overflow-hidden rounded-2xl border border-edge bg-paper shadow-[0_1px_2px_rgba(45,42,38,0.04)]">
            <div className="relative h-[56vh] min-h-[320px] w-full lg:h-[72vh]">
              <EpicycleCanvas
                epicycles={epicycles}
                count={count}
                speed={speed}
                zoom={zoom}
                playing={playing}
              />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-edge bg-paper/85 px-3 py-1 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-heading text-xs font-medium text-ink/70">{source}</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-edge bg-paper/85 px-3 py-1 font-heading text-xs tabular-nums text-ink/60 backdrop-blur-sm">
                {activeCount} / {epicycles.length} vectors
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Uploader onImage={handleImage} busy={busy} status={status} />

            <Controls
              count={count}
              speed={speed}
              zoom={zoom}
              playing={playing}
              maxCount={500}
              onCount={setCount}
              onSpeed={setSpeed}
              onZoom={setZoom}
              onTogglePlay={() => setPlaying((p) => !p)}
            />

            <div className="rounded-2xl border border-edge bg-white/40 p-5">
              <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
                The series
              </h2>
              <p className="font-body text-base italic leading-relaxed text-ink/75">
                z(t) = Σ c<sub>k</sub> e<sup> i(2π f<sub>k</sub> t + φ<sub>k</sub>)</sup>
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/60">
                Each epicycle contributes one term: radius |c<sub>k</sub>|, frequency f<sub>k</sub>,
                phase φ<sub>k</sub>. More vectors resolve finer detail.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 lg:px-8">
        <p className="border-t border-edge pt-5 font-body text-sm text-ink/50">
          Orbita — Fourier epicycles via FFT. Static site, computed entirely in your browser.
        </p>
      </footer>
    </div>
  );
}
