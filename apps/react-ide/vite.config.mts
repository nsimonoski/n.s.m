/// <reference types='vitest' />
import { resolve } from 'path';
import { cpSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

const envDir = resolve(import.meta.dirname, '../../libs/shared/utils/src/lib/environment');

export default defineConfig(() => {
  const alias: Record<string, string> = {};
  if (process.env.VITE_ENV === 'uat') {
    alias[resolve(envDir, 'environment.ts')] = resolve(envDir, 'environment.uat.ts');
  }

  return {
    root: import.meta.dirname,
    base: process.env.VITE_BASE || '/react/',
    cacheDir: '../../node_modules/.vite/apps/react-ide',
    server: {
      port: 4201,
      host: 'localhost',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: 4201,
      host: 'localhost',
    },
    resolve: { alias },
    plugins: [
      nxViteTsPaths(),
      react(),
      {
        name: 'copy-monaco',
        closeBundle() {
          cpSync(
            resolve(import.meta.dirname, '../../node_modules/monaco-editor/min'),
            resolve(import.meta.dirname, 'dist/monaco-editor/min'),
            { recursive: true },
          );
        },
      },
    ],
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [resolve(import.meta.dirname, '../../libs/shared/styles/src')],
        },
      },
    },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
