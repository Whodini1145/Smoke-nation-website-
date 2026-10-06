/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:preview` produces one self-contained HTML file (images inlined)
// that can be opened directly on a phone. The normal build is for real hosting.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'preview' ? [react(), viteSingleFile()] : [react()],
  // Security rules tests need the Firestore emulator: run them with `npm run test:rules`.
  test: { exclude: ['tests/**', 'node_modules/**'] },
  build:
    mode === 'preview'
      ? { outDir: 'preview-dist', assetsInlineLimit: 100_000_000 }
      : { outDir: 'dist' },
}));
