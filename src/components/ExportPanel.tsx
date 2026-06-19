interface Props {
  onExportPNG: () => void;
  onExportSVG: () => void;
  recording: boolean;
  canRecord: boolean;
  recordFormat: string;
  recordSeconds: number;
  recordError: string;
  onToggleRecord: () => void;
}

export default function ExportPanel({
  onExportPNG,
  onExportSVG,
  recording,
  canRecord,
  recordFormat,
  recordSeconds,
  recordError,
  onToggleRecord,
}: Props) {
  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-ink/70">
        Export
      </h2>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExportPNG}
            className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
          >
            Frame · PNG
          </button>
          <button
            type="button"
            onClick={onExportSVG}
            className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
          >
            Path · SVG
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={onToggleRecord}
            disabled={!canRecord}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 font-heading text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              recording
                ? 'bg-accent-dark text-paper'
                : 'bg-accent text-paper hover:bg-accent-dark'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-paper ${recording ? 'animate-pulse' : ''}`}
              style={recording ? undefined : { boxShadow: 'inset 0 0 0 2px #faf9f5' }}
            />
            {recording ? `Stop · ${recordSeconds.toFixed(0)}s` : 'Record video'}
          </button>
          <p className="mt-1.5 font-body text-xs text-ink/55">
            {canRecord
              ? recording
                ? `Recording the canvas (${recordFormat}). Click stop to download.`
                : `Captures the live animation as ${recordFormat}.`
              : 'Video recording is not supported in this browser.'}
          </p>
          {recordError && <p className="mt-1 font-body text-xs text-accent-dark">{recordError}</p>}
        </div>
      </div>
    </div>
  );
}
