/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run build:preview` builds a copy that keeps its data in the browser
// (no database), for testing. The normal build is the live site.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Security rules tests need the Firestore emulator: run them with `npm run test:rules`.
  test: { exclude: ['tests/**', 'node_modules/**'] },
  build:
    mode === 'preview'
      ? { outDir: 'preview-dist' }
      : { outDir: 'dist' },
}));
