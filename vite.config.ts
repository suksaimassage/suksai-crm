import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@app': path.resolve(__dirname, './src/application'),
      '@infra': path.resolve(__dirname, './src/infrastructure'),
    },
    dedupe: ['styled-components'],
  },
  publicDir: 'public',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    // Page-level renders + accessible-name queries are CPU-heavy; under full
    // parallel load they intermittently exceed vitest's 5s default even though
    // the tests are synchronous. 15s still catches genuine hangs.
    testTimeout: 15_000,
    // Only pick up tests inside src/ — prevents vitest from collecting
    // test files in .claude/skills/ which always fail (wrong environment).
    include: ['src/**/*.test.{ts,tsx}'],
    // Pin the TZ so date-dependent suites (schedule override / overlap resolution,
    // especifico local-day matching) are deterministic in CI. The stored fecha is
    // a UTC-midnight Date and the resolution assumes a non-negative UTC offset, so
    // a positive-offset zone makes that assumption explicit and reproducible.
    //
    // Dummy Supabase env: supabase.client.ts constructs the client at module
    // scope, so any test that transitively imports an adapter crashes on a
    // runner without a local dotenv ("supabaseUrl is required"). Unit tests are
    // hermetic — network is always mocked — so placeholder values are correct
    // everywhere; the localhost URL points at nothing.
    env: {
      TZ: 'Europe/Madrid',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    },
  },
  build: {
    // Si estás usando la API nativa de Rolldown en Vite 8,
    // puedes usar rolldownOptions. De lo contrario, rollupOptions funciona igual.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Verificamos si el archivo viene de la carpeta node_modules
          if (id.includes('node_modules')) {
            // Agrupamos React y React DOM
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-vendor';
            }
            // Agrupamos Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Agrupamos el ecosistema de TanStack (Router y Query)
            if (id.includes('@tanstack')) {
              return 'router-vendor';
            }
            // Agrupamos utilidades pesadas
            if (id.includes('zod') || id.includes('i18next')) {
              return 'utils-vendor';
            }

            // Opcional: Todo lo demás que esté en node_modules va a un chunk genérico
            return 'vendor';
          }
        },
      },
    },
  },
});
