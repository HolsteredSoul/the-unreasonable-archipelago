import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  // CI supplies the repository path; local development and local builds stay at the origin root.
  base: loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_PATH || '/',
  plugins: [react()],
  // Browser support has separate node:test checks, invoked by test:ui.
  test: { include: ['src/**/*.test.{ts,tsx}'] },
  server: { watch: { ignored: ['**/output/**', '**/.playwright-cli/**', '**/.npm-cache/**', '**/assets/source/**'] } },
}));
