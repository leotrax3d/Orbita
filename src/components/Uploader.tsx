import { useRef, useState } from 'react';

export type Status = { type: 'idle' | 'info' | 'error'; msg: string };

interface UploaderProps {
  onImage: (file: File) => void;
  busy: boolean;
  status: Status;
}

export default function Uploader({ onImage, busy, status }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) onImage(file);
  };

  return (
    <div>
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
        className={`group cursor-pointer rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
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
        <p className="mt-1 font-body text-xs text-ink/55">
          PNG · JPG · SVG — high-contrast silhouettes trace best
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {status.msg && (
        <p
          className={`mt-2 font-body text-xs ${
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
