import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The other *.test.ts files run with node --test (see package.json); vitest runs the
// legal page and billing tests, which import through the @/ alias.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/lib/legal-center.test.ts', 'src/lib/billing-definer.test.ts'] },
});
