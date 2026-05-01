import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@mediapipe/tasks-vision/wasm/*',
          dest: 'assets',
        },
      ],
    }),
  ],
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5174 },
  },
});
