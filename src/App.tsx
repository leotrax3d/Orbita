import { useCallback, useRef, useState } from 'react';
import EpicycleCanvas, { type EpicycleCanvasHandle } from './components/EpicycleCanvas';
import Controls from './components/Controls';
import Uploader, { type Status } from './components/Uploader';
import PresetPicker from './components/PresetPicker';
import ViewOptions from './components/ViewOptions';
import DrawModal from './components/DrawModal';
import Header from './components/Header';
import { fileToBoundary, type Pt } from './lib/contour';
import { contourToShape, type Shape } from './lib/fourier';
import { PRESETS } from './lib/presets';

export default function App() {
  // Compute the first shape eagerly so the canvas is never empty on first paint.
  const [shape, setShape] = useState<Shape>(() => contourToShape(PRESETS[0].build()));
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [source, setSource] = useState(`${PRESETS[0].label} · preset`);

  const [count, setCount] = useState(120);
  const [speed, setSpeed] = useState(6);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(true);

  const [showCircles, setShowCircles] = useState(true);
  const [showGhost, setShowGhost] = useState(false);
  const [restartToken, setRestartToken] = useState(0);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', msg: '' });
  const [drawOpen, setDrawOpen] = useState(false);

  const canvasRef = useRef<EpicycleCanvasHandle>(null);
  const restart = useCallback(() => setRestartToken((t) => t + 1), []);

  const selectPreset = useCallback(
    (id: string) => {
      const preset = PRESETS.find((p) => p.id === id);
      if (!preset) return;
      setShape(contourToShape(preset.build()));
      setPresetId(id);
      setSource(`${preset.label} · preset`);
      setStatus({ type: 'idle', msg: '' });
    },
    [],
  );

  const handleImage = useCallback(async (file: File) => {
    setBusy(true);
    setStatus({ type: 'info', msg: 'Extracting contour…' });
    try {
      const boundary = await fileToBoundary(file);
      setShape(contourToShape(boundary));
      setPresetId('');
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

  const handleDrawing = useCallback((points: Pt[]) => {
    setShape(contourToShape(points));
    setPresetId('');
    setSource('Your drawing');
    setDrawOpen(false);
    setStatus({ type: 'idle', msg: '' });
  }, []);

  const exportPNG = useCallback(() => {
    const url = canvasRef.current?.toPNG();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbita.png';
    a.click();
  }, []);

  const activeCount = Math.min(count, shape.epicycles.length);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          {/* Signature canvas */}
          <section className="overflow-hidden rounded-2xl border border-edge bg-paper shadow-[0_1px_2px_rgba(45,42,38,0.04)]">
            <div className="relative h-[56vh] min-h-[320px] w-full lg:h-[72vh]">
              <EpicycleCanvas
                ref={canvasRef}
                shape={shape}
                count={count}
                speed={speed}
                zoom={zoom}
                playing={playing}
                showCircles={showCircles}
                showGhost={showGhost}
                restartToken={restartToken}
              />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-edge bg-paper/85 px-3 py-1 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-heading text-xs font-medium text-ink/70">{source}</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-edge bg-paper/85 px-3 py-1 font-heading text-xs tabular-nums text-ink/60 backdrop-blur-sm">
                {activeCount} / {shape.epicycles.length} vectors
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Uploader onImage={handleImage} busy={busy} status={status} />

            <PresetPicker activeId={presetId} onSelect={selectPreset} onDraw={() => setDrawOpen(true)} />

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

            <ViewOptions
              showCircles={showCircles}
              showGhost={showGhost}
              onToggleCircles={() => setShowCircles((v) => !v)}
              onToggleGhost={() => setShowGhost((v) => !v)}
              onRestart={restart}
              onExport={exportPNG}
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

      {drawOpen && <DrawModal onUse={handleDrawing} onClose={() => setDrawOpen(false)} />}
    </div>
  );
}
