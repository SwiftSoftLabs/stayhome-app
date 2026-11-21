#!/usr/bin/env node
/**
 * "Secrets have one door": only src/lib/env.ts may read process.env.
 * Scans git-tracked source files and prints `file:line: reason` for each violation.
 * Exit 1 on any violation. No dependencies. Run: npm run check:env
 *
 * ponytail: regex scan, not an AST. It catches the ways env values get read or
 * leaked by accident; a determined author can still dodge it, which is why the
 * env module, this script and CI are CODEOWNED. Move to an AST (TypeScript is
 * already installed) if false negatives show up.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Files that may read process.env with static access (process.env.NAME).
// Keep this list short; every entry needs a reason.
export const ALLOWLIST = [
  /^src\/lib\/env\.ts$/, // the one door
  /^next\.config\.[cm]?[jt]s$/, // build-time config; runs in Node before the app exists
  /^scripts\//, // local CLI tools (migrations, env sync); never bundled into the app
  /^(tests|e2e)\//, // test harnesses (none yet; kept so they need no guard change)
  /\.test\.[cm]?[jt]sx?$/, // test files
];

// Not scanned at all: these files hold the forbidden patterns as data.
const SKIP = [/^scripts\/check-env-access(\.test)?\.mjs$/];

const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const EXCLUDED_DIRS = /(^|\/)(node_modules|\.next|dist)\//;

// Rules that apply everywhere, allowlisted files included.
const ANYWHERE = [
  [/(?<![\w$.])eval\s*\(/g, 'eval( is not allowed'],
  [/\bnew\s+Function\s*\(/g, 'new Function( is not allowed'],
  [/\bprocess\s*(\?\.)?\[/g, 'dynamic access to process (process["env"]) is not allowed'],
  [/\{[^{}]*\benv\b[^{}]*\}\s*=\s*(globalThis\s*\.\s*)?process\b/g, 'destructuring env from process is not allowed'],
  [/\bimport\s*\{[^}]*\benv\b[^}]*\}\s*from\s*['"](node:)?process['"]/g, 'importing env from "process" is not allowed'],
];

const ENV = /\b(process|import\s*\.\s*meta)\s*\.\s*env\b/g;

function wholeObjectReason(before) {
  if (/\.\.\.\s*$/.test(before)) return 'spreading process.env is not allowed';
  if (/JSON\s*\.\s*stringify\s*\(\s*$/.test(before)) return 'JSON.stringify(process.env) is not allowed';
  if (/Object\s*\.\s*\w+\s*\(\s*$/.test(before)) return 'Object.*(process.env) is not allowed';
  if (/(?<![=!<>])=\s*$/.test(before)) return 'assigning process.env to a variable is not allowed';
  return 'using process.env as a whole object (argument, alias, iteration) is not allowed';
}

/** Returns [{ line, reason }] for one file's text. */
export function check(file, text) {
  const out = [];
  const lineOf = (i) => text.slice(0, i).split('\n').length;
  const allowed = ALLOWLIST.some((re) => re.test(file));

  for (const [re, reason] of ANYWHERE) {
    for (const m of text.matchAll(re)) out.push({ line: lineOf(m.index), reason });
  }
  for (const m of text.matchAll(ENV)) {
    const after = text.slice(m.index + m[0].length);
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    let reason;
    if (/^\s*(\?\.\s*)?\[/.test(after)) reason = 'dynamic env access (env[...]) is not allowed';
    else if (!/^\s*(\?\.|\.)\s*[A-Za-z_$]/.test(after)) reason = wholeObjectReason(before);
    else if (!allowed) reason = 'reads env outside src/lib/env.ts; import serverEnv/publicEnv from @/lib/env';
    if (reason) out.push({ line: lineOf(m.index), reason });
  }
  return out.sort((a, b) => a.line - b.line);
}

function main() {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter((f) => SOURCE.test(f) && !EXCLUDED_DIRS.test(f) && !SKIP.some((re) => re.test(f)));
  let count = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue; // tracked but deleted in the working tree
    }
    for (const { line, reason } of check(file, text)) {
      console.error(`${file}:${line}: ${reason}`);
      count++;
    }
  }
  if (count) {
    console.error(`\ncheck-env-access: ${count} violation(s). Env values may only be read in src/lib/env.ts.`);
    process.exit(1);
  }
  console.log(`check-env-access: ok (${files.length} files scanned)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
