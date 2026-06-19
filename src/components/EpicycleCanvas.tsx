import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { SAMPLE_COUNT, type Shape } from '../lib/fourier';

export interface EpicycleCanvasHandle {
  /** Returns the current frame as a PNG data URL (or null if unavailable). */
  toPNG: () => string | null;
  /** The underlying canvas element, for captureStream-based video recording. */
  getCanvas: () => HTMLCanvasElement | null;
}

export type Theme = 'light' | 'dark';

interface Props {
  shape: Shape;
  count: number;
  speed: number;
  zoom: number;
  playing: boolean;
  showCircles: boolean;
  showGhost: boolean;
  strokeWidth: number;
  trailLength: number; // 0..1 fraction of the full period kept on screen
  theme: Theme;
  traceColor: string;
  glow: boolean;
  /** Bump to restart the trace from t = 0. */
  restartToken: number;
}

interface Pt {
  x: number;
  y: number;
}

const TWO_PI = Math.PI * 2;

const THEMES: Record<Theme, { bg: string; circle: string; radius: string; ghost: string }> = {
  light: {
    bg: '#faf9f5',
    circle: 'rgba(45, 42, 38, 0.10)',
    radius: 'rgba(45, 42, 38, 0.18)',
    ghost: 'rgba(45, 42, 38, 0.22)',
  },
  dark: {
    bg: '#1c1a17',
    circle: 'rgba(250, 249, 245, 0.10)',
    radius: 'rgba(250, 249, 245, 0.22)',
    ghost: 'rgba(250, 249, 245, 0.25)',
  },
};

/**
 * The signature surface: draws the epicycle chain and the path its tip traces.
 * Slider/toggle/style values are read through refs so the animation loop never
 * restarts; it restarts only on a new shape or an explicit trace reset.
 */
function EpicycleCanvas(props: Props, ref: React.Ref<EpicycleCanvasHandle>) {
  const { shape, restartToken } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep the latest props in a ref the RAF loop can read without re-subscribing.
  const propsRef = useRef(props);
  propsRef.current = props;

  useImperativeHandle(ref, () => ({
    toPNG: () => canvasRef.current?.toDataURL('image/png') ?? null,
    getCanvas: () => canvasRef.current,
  }));

  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const { epicycles, points } = shape;
    let raf = 0;
    let time = 0;
    let path: Pt[] = [];

    const render = () => {
      const p = propsRef.current;
      const { w, h } = sizeRef.current;
      const theme = THEMES[p.theme];

      ctx.shadowBlur = 0;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);

      if (epicycles.length > 0 && w > 0 && h > 0) {
        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) * 0.42 * p.zoom;

        if (p.showGhost && points.length > 1) {
          ctx.strokeStyle = theme.ghost;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cx + scale * points[0].re, cy + scale * points[0].im);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(cx + scale * points[i].re, cy + scale * points[i].im);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const n = Math.min(p.count, epicycles.length);
        let x = cx;
        let y = cy;

        if (p.showCircles) {
          ctx.lineWidth = 1;
          for (let i = 0; i < n; i++) {
            const e = epicycles[i];
            const r = scale * e.amp;
            const px = x;
            const py = y;
            const angle = e.freq * time + e.phase;
            x += r * Math.cos(angle);
            y += r * Math.sin(angle);
            if (r > 0.6) {
              ctx.strokeStyle = theme.circle;
              ctx.beginPath();
              ctx.arc(px, py, r, 0, TWO_PI);
              ctx.stroke();
              ctx.strokeStyle = theme.radius;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }
        } else {
          // Still advance the chain to find the tip, without drawing it.
          for (let i = 0; i < n; i++) {
            const e = epicycles[i];
            const r = scale * e.amp;
            const angle = e.freq * time + e.phase;
            x += r * Math.cos(angle);
            y += r * Math.sin(angle);
          }
        }

        const maxLen = Math.max(2, Math.round(SAMPLE_COUNT * p.trailLength));
        if (p.playing) {
          path.push({ x, y });
          while (path.length > maxLen) path.shift();
        } else {
          while (path.length > maxLen) path.shift();
        }

        if (path.length > 1) {
          if (p.glow) {
            ctx.shadowColor = p.traceColor;
            ctx.shadowBlur = 12;
          }
          ctx.strokeStyle = p.traceColor;
          ctx.lineWidth = p.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = p.traceColor;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, p.strokeWidth), 0, TWO_PI);
        ctx.fill();

        if (p.playing) {
          time += (TWO_PI / SAMPLE_COUNT) * p.speed;
          if (time >= TWO_PI) time -= TWO_PI;
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [shape, restartToken]);

  return (
    <canvas ref={canvasRef} className="block h-full w-full" aria-label="Fourier epicycle animation" />
  );
}

export default forwardRef(EpicycleCanvas);
