import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

test('migration adds legal_accepted_at on app_stayhome.users', () => {
  const sql = read('migrations/20261120100000_app-stayhome-legal-accepted-at.sql');
  assert.match(sql, /app_stayhome\.users/);
  assert.match(sql, /legal_accepted_at/);
});

test('DELETE /api/account removes users and never touches auth_users', () => {
  const source = read('src/app/api/account/route.ts');
  assert.match(source, /DELETE FROM users WHERE id/);
  assert.doesNotMatch(source, /DELETE FROM auth_users/);
  assert.match(source, /cancelKelviqSubscription/);
  assert.match(source, /confirm/);
});

test('DELETE /api/account does not delete family-owned rows by assignee id', () => {
  const source = read('src/app/api/account/route.ts');
  assert.doesNotMatch(source, /DELETE FROM jobs WHERE family_id = \$1 OR contractor_id/);
  assert.doesNotMatch(source, /DELETE FROM leads WHERE family_id = \$1 OR contractor_id/);
  assert.doesNotMatch(source, /DELETE FROM audits WHERE family_id = \$1 OR assessor_id/);
  assert.match(source, /UPDATE jobs SET contractor_id = NULL/);
  assert.match(source, /UPDATE audits SET assessor_id = NULL/);
  assert.match(source, /DELETE FROM jobs WHERE family_id = \$1/);
  assert.match(source, /DELETE FROM audits WHERE family_id = \$1/);
});

test('signup requires acceptedLegal and stores legal_accepted_at', () => {
  const route = read('src/app/api/auth/signup/route.ts');
  const service = read('src/lib/auth/service.ts');
  assert.match(route, /acceptedLegal/);
  assert.match(service, /legal_accepted_at/);
  assert.match(service, /Accept the Privacy Policy and Terms of Service/);
});

test('Google OAuth gates new accounts on legal consent cookie', () => {
  const start = read('src/app/api/auth/oauth/[provider]/start/route.ts');
  const callback = read('src/app/api/auth/oauth/[provider]/callback/route.ts');
  const client = read('src/lib/auth/client.ts');
  assert.match(start, /setLegalConsentCookie/);
  assert.match(callback, /consumeLegalConsentCookie/);
  assert.match(client, /consent=1/);
});

test('settings delete account calls DELETE /api/account', () => {
  const settings = read('src/app/settings/page.tsx');
  assert.match(settings, /deleteAccount/);
  assert.doesNotMatch(settings, /within 30 days/);
});

test('homepage removes unsourced senior fall / hospitalization claim strip', () => {
  const home = read('src/app/page.tsx');
  assert.doesNotMatch(home, /seniors will fall/i);
  assert.doesNotMatch(home, /hospitalization/i);
  assert.doesNotMatch(home, /3 in 4/);
});
