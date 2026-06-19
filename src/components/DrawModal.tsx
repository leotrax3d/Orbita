import { useEffect, useRef, useState } from 'react';
import type { Pt } from '../lib/contour';

interface Props {
  onUse: (points: Pt[]) => void;
  onClose: () => void;
}

/**
 * A modal sketch pad. The user draws a single stroke; on confirm the raw points
 * are handed back and run through the same resample → normalize → FFT pipeline
 * as images and presets (it is treated as a closed loop).
 */
export default function DrawModal({ onUse, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Pt[]>([]);
  const drawingRef = useRef(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== canvas.clientWidth * dpr) {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = '#faf9f5';
    ctx.fillRect(0, 0, w, h);

    const pts = pointsRef.current;
    if (pts.length > 1) {
      ctx.strokeStyle = '#d97757';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (!drawingRef.current) {
        // Preview the implied closing segment once the stroke is finished.
        ctx.lineTo(pts[0].x, pts[0].y);
      }
      ctx.stroke();
    }
  };

  useEffect(redraw, []);

  const localPoint = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    pointsRef.current = [localPoint(e)];
    setCount(1);
    redraw();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = localPoint(e);
    const pts = pointsRef.current;
    const last = pts[pts.length - 1];
    // Decimate to ~2px spacing to keep the contour clean.
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 2) {
      pts.push(p);
      setCount(pts.length);
      redraw();
    }
  };

  const end = () => {
    drawingRef.current = false;
    redraw();
  };

  const clear = () => {
    pointsRef.current = [];
    setCount(0);
    redraw();
  };

  const use = () => {
    if (pointsRef.current.length >= 8) onUse(pointsRef.current.slice());
  };

  const enough = count >= 8;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge bg-paper p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">Draw a shape</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink/50 transition-colors hover:text-accent"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="aspect-square w-full touch-none rounded-xl border border-edge"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />

        <p className="mt-2 font-body text-xs text-ink/55">
          Draw one continuous stroke — the ends are joined into a closed loop. {count} points.
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={use}
            disabled={!enough}
            className="rounded-lg bg-accent px-4 py-2 font-heading text-sm font-medium text-paper transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use drawing
          </button>
        </div>
      </div>
    </div>
  );
}
