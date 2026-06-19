import { PRESETS } from '../lib/presets';

interface Props {
  activeId: string;
  onSelect: (id: string) => void;
  onDraw: () => void;
}

export default function PresetPicker({ activeId, onSelect, onDraw }: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        Shapes
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => {
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`rounded-lg border px-3 py-2 font-heading text-sm font-medium transition-colors ${
                active
                  ? 'border-accent bg-accent/10 text-accent-dark'
                  : 'border-edge bg-paper text-ink/80 hover:border-accent/60'
              }`}
              aria-pressed={active}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onDraw}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        Draw your own
      </button>
    </div>
  );
}
