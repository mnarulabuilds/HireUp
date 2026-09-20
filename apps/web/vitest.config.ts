import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/components/ScoreBars.tsx',
        'src/components/SponsoredTip.tsx',
        'src/components/ResumePreview.tsx',
        'src/components/ResumeSectionControls.tsx',
        'src/components/ResumeSuggestionsPanel.tsx',
        'src/lib/download.ts',
      ],
      exclude: ['src/**/*.test.{ts,tsx}'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hireup/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
