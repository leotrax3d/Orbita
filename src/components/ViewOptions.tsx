interface Props {
  showCircles: boolean;
  showGhost: boolean;
  onToggleCircles: () => void;
  onToggleGhost: () => void;
  onRestart: () => void;
  onExport: () => void;
}

export default function ViewOptions({
  showCircles,
  showGhost,
  onToggleCircles,
  onToggleGhost,
  onRestart,
  onExport,
}: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        View
      </h2>

      <div className="space-y-2.5">
        <Toggle label="Epicycle circles" checked={showCircles} onChange={onToggleCircles} />
        <Toggle label="Target overlay" checked={showGhost} onChange={onToggleGhost} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between"
    >
      <span className="font-heading text-sm font-medium text-ink/80">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-edge'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
