import { useEffect, useRef, useState } from 'react';
import type { Pt } from '../lib/contour';
import type { Theme } from './EpicycleCanvas';

interface Props {
  onUse: (points: Pt[]) => void;
  onCancel: () => void;
  theme: Theme;
  traceColor: string;
}

/**
 * A full-bleed drawing surface laid over the main canvas. The user sketches a
 * single stroke directly on the big canvas; on confirm the raw points run
 * through the same resample → normalize → FFT pipeline as everything else.
 */
export default function LiveDraw({ onUse, onCancel, theme, traceColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Pt[]>([]);
  const drawingRef = useRef(false);
  const [count, setCount] = useState(0);
  const bg = theme === 'dark' ? '#1c1a17' : '#faf9f5';

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(canvas.clientWidth * dpr)) {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const pts = pointsRef.current;
    if (pts.length > 1) {
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (!drawingRef.current) ctx.lineTo(pts[0].x, pts[0].y); // preview the closing segment
      ctx.stroke();
    }
  };

  useEffect(() => {
    redraw();
    const canvas = canvasRef.current;
    const ro = new ResizeObserver(redraw);
    if (canvas) ro.observe(canvas);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const local = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    pointsRef.current = [local(e)];
    setCount(1);
    redraw();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const p = local(e);
    const pts = pointsRef.current;
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 2.5) {
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

  return (
    <div className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-edge bg-paper/90 px-3 py-1 font-heading text-xs text-ink/70 backdrop-blur">
        Draw one closed stroke · {count} pts
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-edge bg-paper px-3 py-2 font-heading text-sm font-medium text-ink/80 transition-colors hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={use}
          disabled={count < 8}
          className="rounded-lg bg-accent px-4 py-2 font-heading text-sm font-medium text-paper transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Use drawing
        </button>
      </div>
    </div>
  );
}
