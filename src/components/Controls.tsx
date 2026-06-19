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
}: ControlsProps) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
          Controls
        </h2>
        <button
          type="button"
          onClick={onTogglePlay}
          className="rounded-lg border border-edge bg-paper px-3 py-1.5 font-heading text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          aria-pressed={playing}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="space-y-5">
        <Slider
          label="Epicycles"
          value={count}
          min={20}
          max={maxCount}
          step={1}
          display={`${count}`}
          onChange={onCount}
        />
        <Slider
          label="Speed"
          value={speed}
          min={1}
          max={20}
          step={1}
          display={`${speed}×`}
          onChange={onSpeed}
        />
        <Slider
          label="Zoom"
          value={zoom}
          min={0.3}
          max={3}
          step={0.1}
          display={`${zoom.toFixed(1)}×`}
          onChange={onZoom}
        />
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-heading text-sm font-medium text-ink/80">{label}</span>
        <span className="font-heading text-sm tabular-nums text-accent">{display}</span>
      </div>
      <input
        type="range"
        className="orbita-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
