import { Segmented, Slider, Toggle } from './ui';
import type { Theme } from './EpicycleCanvas';

export const TRACE_COLORS = [
  { name: 'Clay', value: '#d97757' },
  { name: 'Ink', value: '#2d2a26' },
  { name: 'Azure', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#a855f7' },
];

interface Props {
  strokeWidth: number;
  trailLength: number;
  theme: Theme;
  traceColor: string;
  glow: boolean;
  rainbow: boolean;
  showCircles: boolean;
  showGhost: boolean;
  onStrokeWidth: (v: number) => void;
  onTrailLength: (v: number) => void;
  onTheme: (v: Theme) => void;
  onTraceColor: (v: string) => void;
  onToggleGlow: () => void;
  onToggleRainbow: () => void;
  onToggleCircles: () => void;
  onToggleGhost: () => void;
}

export default function StyleOptions({
  strokeWidth,
  trailLength,
  theme,
  traceColor,
  glow,
  rainbow,
  showCircles,
  showGhost,
  onStrokeWidth,
  onTrailLength,
  onTheme,
  onTraceColor,
  onToggleGlow,
  onToggleRainbow,
  onToggleCircles,
  onToggleGhost,
}: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        Style
      </h2>

      <div className="space-y-4">
        <Slider
          label="Stroke width"
          value={strokeWidth}
          min={1}
          max={8}
          step={0.5}
          display={`${strokeWidth} px`}
          onChange={onStrokeWidth}
        />
        <Slider
          label="Trail"
          value={trailLength}
          min={0.05}
          max={1}
          step={0.05}
          display={trailLength >= 1 ? 'Full' : `${Math.round(trailLength * 100)}%`}
          onChange={onTrailLength}
        />

        <div>
          <span className="mb-1.5 block font-heading text-sm font-medium text-ink/80">Canvas</span>
          <Segmented
            value={theme}
            onChange={onTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>

        <div className={rainbow ? 'pointer-events-none opacity-40' : ''}>
          <span className="mb-1.5 block font-heading text-sm font-medium text-ink/80">Trace color</span>
          <div className="flex items-center gap-2">
            {TRACE_COLORS.map((c) => {
              const active = c.value === traceColor;
              return (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={active}
                  onClick={() => onTraceColor(c.value)}
                  className={`h-7 w-7 rounded-full transition-transform ${active ? 'scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c.value, boxShadow: active ? `0 0 0 2px #faf9f5, 0 0 0 4px ${c.value}` : undefined }}
                />
              );
            })}
            <label
              title="Custom color"
              className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-edge"
              style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
            >
              <input
                type="color"
                value={traceColor}
                onChange={(e) => onTraceColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Custom trace color"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-edge pt-3">
          <Toggle label="Rainbow trail" checked={rainbow} onChange={onToggleRainbow} />
          <Toggle label="Glow" checked={glow} onChange={onToggleGlow} />
          <Toggle label="Epicycle circles" checked={showCircles} onChange={onToggleCircles} />
          <Toggle label="Target overlay" checked={showGhost} onChange={onToggleGhost} />
        </div>
      </div>
    </div>
  );
}
