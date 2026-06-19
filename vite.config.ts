import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` emits relative asset URLs so the production build runs unchanged
// on a GitHub Pages *project* site (served from https://<user>.github.io/<repo>/)
// without hard-coding the repository name. It also works on a user/org page or a
// custom domain. If you prefer absolute paths for a root deployment, set `base: '/'`.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});
