import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EpicycleCanvas, { type EpicycleCanvasHandle, type Theme } from './components/EpicycleCanvas';
import Controls from './components/Controls';
import Uploader, { type Status } from './components/Uploader';
import PresetPicker from './components/PresetPicker';
import StyleOptions from './components/StyleOptions';
import ExportPanel from './components/ExportPanel';
import ExplainPanel from './components/ExplainPanel';
import LiveDraw from './components/LiveDraw';
import Header from './components/Header';
import { Tabs } from './components/ui';
import { fileToContour, type Pt, type TraceMode } from './lib/contour';
import { contourToShape, type Shape } from './lib/fourier';
import { PRESETS } from './lib/presets';

type Tab = 'source' | 'motion' | 'style' | 'export' | 'explain';

const TABS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'source', label: 'Source' },
  { value: 'motion', label: 'Motion' },
  { value: 'style', label: 'Style' },
  { value: 'export', label: 'Export' },
  { value: 'explain', label: 'Explain' },
];

const VIDEO_TYPES = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

function pickVideoMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null;
  for (const t of VIDEO_TYPES) if (MediaRecorder.isTypeSupported(t)) return t;
  return null;
}

export default function App() {
  const [shape, setShape] = useState<Shape>(() => contourToShape(PRESETS[0].build()));
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [source, setSource] = useState(`${PRESETS[0].label} · preset`);

  const [count, setCount] = useState(120);
  const [speed, setSpeed] = useState(6);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(true);

  const [traceMode, setTraceMode] = useState<TraceMode>('outline');
  const [detail, setDetail] = useState(6);

  const [strokeWidth, setStrokeWidth] = useState(2);
  const [trailLength, setTrailLength] = useState(1);
  const [theme, setTheme] = useState<Theme>('light');
  const [traceColor, setTraceColor] = useState('#d97757');
  const [glow, setGlow] = useState(false);
  const [showCircles, setShowCircles] = useState(true);
  const [showGhost, setShowGhost] = useState(false);

  const [restartToken, setRestartToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', msg: '' });
  const [drawing, setDrawing] = useState(false);
  const [tab, setTab] = useState<Tab>('source');

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState('');

  const canvasRef = useRef<EpicycleCanvasHandle>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);

  const canRecord = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      'captureStream' in HTMLCanvasElement.prototype &&
      pickVideoMime() !== null,
    [],
  );
  const recordFormat = useMemo(() => {
    const m = pickVideoMime();
    return m?.includes('mp4') ? 'MP4' : m ? 'WebM' : '—';
  }, []);

  const restart = useCallback(() => setRestartToken((t) => t + 1), []);

  const selectPreset = useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setShape(contourToShape(preset.build()));
    setPresetId(id);
    setSource(`${preset.label} · preset`);
    setStatus({ type: 'idle', msg: '' });
  }, []);

  const handleImage = useCallback(
    async (file: File) => {
      setBusy(true);
      setStatus({ type: 'info', msg: traceMode === 'detail' ? 'Detecting edges…' : 'Extracting contour…' });
      try {
        const { path, segments } = await fileToContour(file, { mode: traceMode, detail });
        setShape(contourToShape(path));
        setPresetId('');
        setSource(`${file.name} · ${segments} ${segments === 1 ? 'part' : 'parts'}`);
        setStatus({ type: 'idle', msg: '' });
      } catch (err) {
        setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Could not process that image.' });
      } finally {
        setBusy(false);
      }
    },
    [traceMode, detail],
  );

  const handleDrawing = useCallback((points: Pt[]) => {
    setShape(contourToShape(points));
    setPresetId('');
    setSource('Your drawing');
    setDrawing(false);
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

  const exportSVG = useCallback(() => {
    const pts = shape.points;
    if (pts.length === 0) return;
    const S = 600;
    const cx = S / 2;
    const cy = S / 2;
    const scale = S * 0.42;
    const coords = pts
      .map((p) => `${(cx + scale * p.re).toFixed(2)},${(cy + scale * p.im).toFixed(2)}`)
      .join(' ');
    const bg = theme === 'dark' ? '#1c1a17' : '#faf9f5';
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">` +
      `<rect width="${S}" height="${S}" fill="${bg}"/>` +
      `<polygon points="${coords}" fill="none" stroke="${traceColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbita.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [shape, theme, traceColor, strokeWidth]);

  const startRecording = useCallback(() => {
    setRecordError('');
    const canvas = canvasRef.current?.getCanvas() as
      | (HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream })
      | null
      | undefined;
    const mime = pickVideoMime();
    if (!canvas || !mime || !canvas.captureStream) {
      setRecordError('Recording is not supported here.');
      return;
    }
    let recorder: MediaRecorder;
    try {
      const stream = canvas.captureStream(60);
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    } catch {
      setRecordError('Could not start the recorder.');
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbita.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    setPlaying(true);
    recorder.start();
    recorderRef.current = recorder;
    recordStartRef.current = performance.now();
    setRecordSeconds(0);
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  // Recording timer + 60s safety cap.
  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      const s = (performance.now() - recordStartRef.current) / 1000;
      setRecordSeconds(s);
      if (s > 60) stopRecording();
    }, 200);
    return () => window.clearInterval(id);
  }, [recording, stopRecording]);

  const activeCount = Math.min(count, shape.epicycles.length);

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-4 lg:min-h-0 lg:px-8">
        <div className="grid h-full gap-4 lg:grid-cols-[1fr_23rem]">
          {/* Signature canvas */}
          <section className="relative h-[52vh] min-h-[340px] overflow-hidden rounded-2xl border border-edge bg-paper shadow-[0_1px_2px_rgba(45,42,38,0.04)] lg:h-full">
            <EpicycleCanvas
              ref={canvasRef}
              shape={shape}
              count={count}
              speed={speed}
              zoom={zoom}
              playing={playing && !drawing}
              showCircles={showCircles}
              showGhost={showGhost}
              strokeWidth={strokeWidth}
              trailLength={trailLength}
              theme={theme}
              traceColor={traceColor}
              glow={glow}
              restartToken={restartToken}
            />

            {!drawing && (
              <>
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-edge bg-paper/85 px-3 py-1 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: traceColor }} />
                  <span className="font-heading text-xs font-medium text-ink/70">{source}</span>
                </div>
                <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-edge bg-paper/85 px-3 py-1 font-heading text-xs tabular-nums text-ink/60 backdrop-blur-sm">
                  {activeCount} / {shape.epicycles.length} vectors
                </div>
                {recording && (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-accent-dark px-3 py-1 font-heading text-xs font-medium text-paper">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-paper" /> REC {recordSeconds.toFixed(0)}s
                  </div>
                )}
              </>
            )}

            {drawing && (
              <LiveDraw onUse={handleDrawing} onCancel={() => setDrawing(false)} theme={theme} traceColor={traceColor} />
            )}
          </section>

          {/* Control rail */}
          <aside className="flex flex-col lg:h-full lg:min-h-0">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />

            <div className="mt-3 space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              {tab === 'source' && (
                <>
                  <Uploader
                    onImage={handleImage}
                    busy={busy}
                    status={status}
                    mode={traceMode}
                    detail={detail}
                    onMode={setTraceMode}
                    onDetail={setDetail}
                  />
                  <PresetPicker
                    activeId={presetId}
                    onSelect={selectPreset}
                    onDraw={() => {
                      setDrawing(true);
                      setStatus({ type: 'idle', msg: '' });
                    }}
                  />
                </>
              )}

              {tab === 'motion' && (
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
                  onRestart={restart}
                />
              )}

              {tab === 'style' && (
                <StyleOptions
                  strokeWidth={strokeWidth}
                  trailLength={trailLength}
                  theme={theme}
                  traceColor={traceColor}
                  glow={glow}
                  showCircles={showCircles}
                  showGhost={showGhost}
                  onStrokeWidth={setStrokeWidth}
                  onTrailLength={setTrailLength}
                  onTheme={setTheme}
                  onTraceColor={setTraceColor}
                  onToggleGlow={() => setGlow((v) => !v)}
                  onToggleCircles={() => setShowCircles((v) => !v)}
                  onToggleGhost={() => setShowGhost((v) => !v)}
                />
              )}

              {tab === 'export' && (
                <ExportPanel
                  onExportPNG={exportPNG}
                  onExportSVG={exportSVG}
                  recording={recording}
                  canRecord={canRecord}
                  recordFormat={recordFormat}
                  recordSeconds={recordSeconds}
                  recordError={recordError}
                  onToggleRecord={() => (recording ? stopRecording() : startRecording())}
                />
              )}

              {tab === 'explain' && <ExplainPanel />}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
