import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Absolute base for the GitHub Pages project site. The deploy publishes to
// https://leotrax3d.github.io/Orbita/, so assets must resolve under `/Orbita/`
// regardless of whether the page URL carries a trailing slash. If you fork or
// rename the repo, change this to `/<your-repo-name>/` (or `/` for a user page
// or custom domain).
export default defineConfig({
  base: '/Orbita/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});
