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

- **Upload → trace.** Any high-contrast image (PNG · JPG · SVG). Drag-and-drop or click.
- **Draw your own.** Sketch a closed stroke on a pad and decompose it instantly.
- **Preset shapes.** Heart, star, flower, infinity — switch with one click.
- **FFT decomposition.** Otsu threshold → largest connected component →
  Moore-neighbor boundary trace → arc-length resample → FFT (`mathjs`).
- **Live controls.** Epicycle count (20–500), speed, zoom — all at 60 FPS on a single canvas.
- **View options.** Toggle the epicycle circles, overlay the target contour
  (ghost) to compare the approximation, restart the trace, or export the frame as PNG.
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
├── App.tsx                  # layout + state (shape / count / speed / zoom / view)
├── index.css                # Tailwind + slider styles
├── components/
│   ├── EpicycleCanvas.tsx   # the animated signature canvas (requestAnimationFrame)
│   ├── Controls.tsx         # sliders + play/pause
│   ├── PresetPicker.tsx     # preset shapes + "draw your own"
│   ├── DrawModal.tsx        # sketch-pad for a custom contour
│   ├── ViewOptions.tsx      # circle/ghost toggles, restart, export PNG
│   ├── Uploader.tsx         # drag-and-drop image input
│   ├── ErrorBoundary.tsx    # visible fallback instead of a blank screen
│   └── Header.tsx           # title + intro
└── lib/
    ├── contour.ts           # image → ordered boundary; resample + normalize (pure)
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

## Tips for good contours

- High-contrast **silhouettes**, **logos**, and **line art** trace best.
- Orbita traces the **single largest shape**; busy photos give noisy results.
- More epicycles = finer detail, but the broad form is already captured by the
  first few dozen — try the slider to feel the convergence.

## License

MIT © leotrax3d
