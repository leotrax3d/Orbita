/** Small shared control primitives used across the sidebar panels. */

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step = 1, display, onChange }: SliderProps) {
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

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between"
    >
      <span className="font-heading text-sm font-medium text-ink/80">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-edge'}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex gap-1 rounded-lg border border-edge bg-paper p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 rounded-md px-2 py-1.5 font-heading text-xs font-medium transition-colors ${
              active ? 'bg-accent text-paper' : 'text-ink/70 hover:text-accent'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
