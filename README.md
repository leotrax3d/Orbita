# Orbita

**Fourier epicycle visualizer.** Upload an image, Orbita extracts its dominant
contour, decomposes it into a Fourier series with an FFT, and animates the
rotating vectors — *epicycles* — that retrace the outline. 100% static, computed
in the browser, no backend.

A closed contour is a periodic complex signal `z(t) = x(t) + i·y(t)`. Its
discrete Fourier transform gives one rotating vector per frequency:

```
z(t) = Σ  c_k · e^{ i (2π f_k t + φ_k) }
        k
```

Each term is a circle of radius `|c_k|` spinning at frequency `f_k` from phase
`φ_k`. Summed tip-to-tail and animated, their endpoint draws the contour.

**Live demo → https://leotrax3d.github.io/Orbita/**

## Features

- **Two trace modes.**
  - *Outline* — Otsu threshold → largest connected component → Moore-neighbor
    boundary trace. Best for logos and bold silhouettes.
  - *Photo / detail* — **Sobel edge detection** → dilation → many edge contours
    **stitched into one continuous path** (nearest-endpoint ordering). This is
    what lets Orbita trace **portraits and photos**: the features are separate
    parts, joined so a single epicycle chain draws the whole image. A *Detail*
    slider controls how fine the edges are.
- **Draw on the canvas.** Sketch a closed stroke directly on the main canvas and
  decompose it live.
- **Preset shapes.** Heart, star, flower, infinity — switch with one click.
- **Style controls.** Stroke width, trail length (comet → full), light/dark
  canvas, trace color, glow, epicycle circles, and a target overlay.
- **Animation controls.** Epicycle count (20–500), speed, zoom — 60 FPS on a single canvas.
- **Export.** PNG frame, SVG path, and a **recorded video** of the animation
  (`captureStream` + `MediaRecorder`; MP4 where supported, otherwise WebM).
- **Explain panel.** Built-in walkthrough of the Fourier/epicycle math and the
  image pipeline.
- **No-scroll desktop layout.** Full-height shell: the canvas stays in view while
  a tabbed control rail (Source · Motion · Style · Export · Explain) keeps every
  setting reachable without scrolling the page.
- **FFT core.** Arc-length resample → normalize → FFT (`mathjs`) → epicycles
  `{freq, amp, phase}`, sorted by amplitude.
- **Static & portable.** Vite build, deployable to GitHub Pages with one command or on push.

## Tech stack

| Layer        | Choice                          |
| ------------ | ------------------------------- |
| Build / dev  | Vite                            |
| UI           | React + TypeScript              |
| Styling      | Tailwind CSS                    |
| Math         | mathjs (FFT) + HTML5 Canvas     |
| Deploy       | GitHub Actions / `gh-pages`     |

## Getting started

Requires Node 18+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
```

## Project structure

```
src/
├── main.tsx                 # React entry (wraps App in an ErrorBoundary)
├── App.tsx                  # full-height tabbed shell + all state
├── index.css                # Tailwind + slider styles
├── components/
│   ├── EpicycleCanvas.tsx   # animated canvas (RAF); exposes toPNG + getCanvas
│   ├── LiveDraw.tsx         # draw directly on the main canvas
│   ├── Controls.tsx         # count / speed / zoom + play/pause + restart
│   ├── StyleOptions.tsx     # stroke, trail, theme, color, glow, toggles
│   ├── ExportPanel.tsx      # PNG / SVG / video recording
│   ├── ExplainPanel.tsx     # how-it-works walkthrough
│   ├── PresetPicker.tsx     # preset shapes + "draw on canvas"
│   ├── Uploader.tsx         # image input + trace mode (outline / photo) + detail
│   ├── ui.tsx               # shared Slider / Toggle / Segmented / Tabs
│   ├── ErrorBoundary.tsx    # visible fallback instead of a blank screen
│   └── Header.tsx           # slim title bar
└── lib/
    ├── contour.ts           # image → contour(s): outline + Sobel/edge/stitch; resample/normalize
    ├── fourier.ts           # FFT → epicycles + target points (mathjs)
    └── presets.ts           # parametric preset contours
```

## Deploying to GitHub Pages

The repo ships with **two** paths — pick one.

### A. Automatic (GitHub Actions, recommended)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.

1. Push to `main`.
2. In the repository: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. The workflow builds `dist/` and deploys it. The URL appears in the Actions run
   and under Settings → Pages.

### B. Manual (`gh-pages` branch)

```bash
npm run deploy   # builds, then publishes dist/ to the gh-pages branch
```

Then set **Settings → Pages → Source → Deploy from a branch → `gh-pages` / `root`**.

### Base path

`vite.config.ts` uses `base: '/Orbita/'` — an absolute path matching the GitHub
Pages project URL `https://leotrax3d.github.io/Orbita/`. Absolute asset URLs
resolve correctly whether or not the page URL carries a trailing slash (a relative
base can break in the no-slash case). **If you fork or rename the repo, change
this to `/<your-repo-name>/`** (case-sensitive), or `/` for a user/org page or a
custom domain.

## Tips for good results

- **Logos / silhouettes / line art** → *Outline* mode traces the single largest shape.
- **Portraits / photos** → *Photo / detail* mode. Raise **Detail** for more edges
  (more parts stitched together); lower it for a cleaner, sparser sketch.
- More epicycles = finer detail, but the broad form is already captured by the
  first few dozen — try the **count** slider to feel the convergence.
- For a clean look on photos, lower the **Trail** so the tip leaves a comet rather
  than the full overlapping path, and try **Dark** canvas with **Glow**.

## License

MIT © leotrax3d 
