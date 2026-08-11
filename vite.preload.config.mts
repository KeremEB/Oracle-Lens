import { defineConfig } from 'vite';
import path from 'node:path';

// Sandboxed preload scripts (Electron's default since v20) can't `require()`
// sibling project files — only the entry file itself. So unlike main, the
// preload entry has to be bundled into one self-contained file rather than
// just transpiled by tsc.
export default defineConfig({
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/preload'),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/preload/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});
