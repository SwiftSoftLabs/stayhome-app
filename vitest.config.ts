import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The other *.test.ts files run with node --test (see package.json); vitest only runs the
// legal page tests, which render TSX and import through the @/ alias.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/lib/legal-center.test.ts'] },
});
