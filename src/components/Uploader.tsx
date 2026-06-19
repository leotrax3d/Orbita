import { useRef, useState } from 'react';
import { Segmented, Slider } from './ui';
import type { TraceMode } from '../lib/contour';

export type Status = { type: 'idle' | 'info' | 'error'; msg: string };

interface UploaderProps {
  onImage: (file: File) => void;
  busy: boolean;
  status: Status;
  mode: TraceMode;
  detail: number;
  onMode: (m: TraceMode) => void;
  onDetail: (d: number) => void;
}

export default function Uploader({
  onImage,
  busy,
  status,
  mode,
  detail,
  onMode,
  onDetail,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) onImage(file);
  };

  return (
    <div className="rounded-2xl border border-edge bg-white/40 p-5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={`group cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-edge hover:border-accent/60'
        }`}
      >
        <svg
          className="mx-auto h-7 w-7 text-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <p className="mt-2 font-heading text-sm font-medium text-ink">
          {busy ? 'Processing…' : 'Drop an image or click to upload'}
        </p>
        <p className="mt-1 font-body text-xs text-ink/55">PNG · JPG · SVG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block font-heading text-sm font-medium text-ink/80">Trace mode</span>
        <Segmented
          value={mode}
          onChange={onMode}
          options={[
            { value: 'outline', label: 'Outline' },
            { value: 'detail', label: 'Photo / detail' },
          ]}
        />
        <p className="mt-1.5 font-body text-xs text-ink/55">
          {mode === 'outline'
            ? 'One silhouette — best for logos & bold shapes.'
            : 'Edge tracing across many parts — best for portraits & photos.'}
        </p>
      </div>

      {mode === 'detail' && (
        <div className="mt-3">
          <Slider
            label="Detail"
            value={detail}
            min={1}
            max={10}
            step={1}
            display={`${detail}`}
            onChange={onDetail}
          />
        </div>
      )}

      {status.msg && (
        <p
          className={`mt-3 font-body text-xs ${
            status.type === 'error' ? 'text-accent-dark' : 'text-ink/60'
          }`}
          role={status.type === 'error' ? 'alert' : 'status'}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
