import { useEffect, useRef } from 'react';
import { SAMPLE_COUNT, type Epicycle } from '../lib/fourier';

interface Props {
  epicycles: Epicycle[];
  count: number;
  speed: number;
  zoom: number;
  playing: boolean;
}

const TWO_PI = Math.PI * 2;

/**
 * The signature surface: draws the epicycle chain and the path its tip traces.
 * Slider values are read through refs so the animation loop never restarts; it
 * only restarts when a new contour (`epicycles`) is loaded.
 */
export default function EpicycleCanvas({ epicycles, count, speed, zoom, playing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const countRef = useRef(count);
  const speedRef = useRef(speed);
  const zoomRef = useRef(zoom);
  const playingRef = useRef(playing);
  countRef.current = count;
  speedRef.current = speed;
  zoomRef.current = zoom;
  playingRef.current = playing;

  // CSS-pixel size, kept current by a ResizeObserver so we resize off the render path.
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

    let raf = 0;
    let time = 0;
    let path: Pt[] = [];

    const render = () => {
      const { w, h } = sizeRef.current;

      ctx.fillStyle = '#faf9f5';
      ctx.fillRect(0, 0, w, h);

      if (epicycles.length > 0 && w > 0 && h > 0) {
        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) * 0.42 * zoomRef.current;
        const n = Math.min(countRef.current, epicycles.length);

        let x = cx;
        let y = cy;

        ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
          const e = epicycles[i];
          const r = scale * e.amp;
          const px = x;
          const py = y;
          const angle = e.freq * time + e.phase;
          x += r * Math.cos(angle);
          y += r * Math.sin(angle);

          // Skip sub-pixel circles — they cost draw calls without being visible.
          if (r > 0.6) {
            ctx.strokeStyle = 'rgba(45, 42, 38, 0.10)';
            ctx.beginPath();
            ctx.arc(px, py, r, 0, TWO_PI);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(45, 42, 38, 0.18)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }

        if (playingRef.current) {
          path.push({ x, y });
          if (path.length > SAMPLE_COUNT) path.shift();
        }

        if (path.length > 1) {
          ctx.strokeStyle = '#d97757';
          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
          ctx.stroke();
        }

        // Leading tip.
        ctx.fillStyle = '#d97757';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, TWO_PI);
        ctx.fill();

        if (playingRef.current) {
          time += (TWO_PI / SAMPLE_COUNT) * speedRef.current;
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
  }, [epicycles]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-label="Fourier epicycle animation" />;
}

interface Pt {
  x: number;
  y: number;
}
