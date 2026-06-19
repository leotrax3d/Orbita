import { Slider } from './ui';

interface ControlsProps {
  count: number;
  speed: number;
  zoom: number;
  playing: boolean;
  maxCount: number;
  onCount: (v: number) => void;
  onSpeed: (v: number) => void;
  onZoom: (v: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
}

export default function Controls({
  count,
  speed,
  zoom,
  playing,
  maxCount,
  onCount,
  onSpeed,
  onZoom,
  onTogglePlay,
  onRestart,
}: ControlsProps) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
          Motion
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg border border-edge bg-paper px-3 py-1.5 font-heading text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="rounded-lg border border-edge bg-paper px-3 py-1.5 font-heading text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            aria-pressed={playing}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <Slider label="Epicycles" value={count} min={20} max={maxCount} step={1} display={`${count}`} onChange={onCount} />
        <Slider label="Speed" value={speed} min={1} max={20} step={1} display={`${speed}×`} onChange={onSpeed} />
        <Slider label="Zoom" value={zoom} min={0.3} max={3} step={0.1} display={`${zoom.toFixed(1)}×`} onChange={onZoom} />
      </div>
    </div>
  );
}
