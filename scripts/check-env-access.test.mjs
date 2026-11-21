// Self-test for check-env-access.mjs. Run: node --test scripts/check-env-access.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check } from './check-env-access.mjs';

const APP = 'src/app/api/billing/route.ts';
const ENV_MODULE = 'src/lib/env.ts';

const reasons = (file, src) => check(file, src).map((v) => v.reason);
const fires = (file, src, pattern) => {
  const got = reasons(file, src);
  assert.ok(got.some((r) => pattern.test(r)), `expected ${pattern} for ${JSON.stringify(src)} in ${file}, got ${JSON.stringify(got)}`);
};

test('good code passes', () => {
  assert.deepEqual(reasons(ENV_MODULE, 'export const a = { get X() { return process.env.KELVIQ_API_KEY; } };'), []);
  assert.deepEqual(reasons(ENV_MODULE, 'const n = process.env?.NODE_ENV;'), []);
  assert.deepEqual(reasons('next.config.ts', "const org = process.env.SENTRY_ORG || 'x';"), []);
  assert.deepEqual(reasons('scripts/migrate.mjs', "if (process.env.DATABASE_SSL === 'true') {}"), []);
  assert.deepEqual(reasons('tests/legal.test.mjs', 'process.env.SYNLEX_PUBLIC_BASE = base;'), []);
  assert.deepEqual(reasons(APP, "import { serverEnv } from '@/lib/env';\nconst k = serverEnv.KELVIQ_API_KEY;"), []);
  assert.deepEqual(reasons(APP, 'const u = new URL(import.meta.url); redis.eval("x"); process.exit(1);'), []);
});

test('reads outside the env module fail with file line', () => {
  const [v] = check(APP, '\n\nconsole.log(process.env.KELVIQ_WEBHOOK_SECRET);');
  assert.equal(v.line, 3);
  assert.match(v.reason, /outside src\/lib\/env\.ts/);
  fires('src/lib/billing.ts', 'const x = process . env . X;', /outside src\/lib\/env\.ts/);
  fires('src/components/A.tsx', 'const x = import.meta.env.VITE_KEY;', /outside src\/lib\/env\.ts/);
  fires('src/instrumentation.ts', 'const d = process.env.SENTRY_DSN;', /outside src\/lib\/env\.ts/);
});

test('forbidden everywhere, even in allowlisted files', () => {
  for (const file of [ENV_MODULE, 'next.config.ts', 'scripts/x.mjs', 'tests/x.test.mjs']) {
    fires(file, 'process.env[name]', /dynamic env access/);
    fires(file, 'process.env?.[name]', /dynamic env access/);
    fires(file, 'import.meta.env[name]', /dynamic env access/);
    fires(file, 'JSON.stringify(process.env)', /JSON\.stringify/);
    fires(file, 'JSON.stringify(\n  process.env,\n)', /JSON\.stringify/);
    fires(file, 'Object.keys(process.env)', /Object\.\*/);
    fires(file, 'Object.values(process.env)', /Object\.\*/);
    fires(file, 'Object.entries(process.env)', /Object\.\*/);
    fires(file, 'const env = { ...process.env, A: 1 };', /spreading/);
    fires(file, 'const env = process.env;', /assigning/);
    fires(file, 'spawn(cmd, args, { env: process.env });', /whole object/);
    fires(file, 'send(process.env)', /whole object/);
    fires(file, "process['env'].X", /dynamic access to process/);
    fires(file, 'const { env } = process;', /destructuring/);
    fires(file, "import { env } from 'node:process';", /importing env/);
    fires(file, 'eval("1")', /eval/);
    fires(file, 'new Function("return 1")', /new Function/);
  }
});
