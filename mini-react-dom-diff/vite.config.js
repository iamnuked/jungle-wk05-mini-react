import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => ({
  build: mode === 'demo'
    ? undefined
    : {
        lib: {
          entry: {
            index: resolve(rootDir, 'src/index.js'),
            vdom: resolve(rootDir, 'src/lib/vdom.js'),
            fiber: resolve(rootDir, 'src/lib/fiber.js'),
          },
          formats: ['es'],
        },
        rollupOptions: {
          output: {
            entryFileNames: '[name].js',
          },
        },
      },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
