import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
mkdirSync(resolve(root, 'data'), { recursive: true });
if (existsSync(envPath)) {
  console.log('.env sudah tersedia; kunci dan password tidak diubah.');
} else {
  const password = randomBytes(18).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  const template = readFileSync(resolve(root, '.env.example'), 'utf8')
    .replace('N8N_ENCRYPTION_KEY=GENERATE_WITH_NPM_RUN_SETUP', `N8N_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}`)
    .replace('ATH_SESSION_SECRET=GENERATE_WITH_NPM_RUN_SETUP', `ATH_SESSION_SECRET=${randomBytes(32).toString('hex')}`)
    .replace('ATH_WORKFLOW_SECRET=GENERATE_WITH_NPM_RUN_SETUP', `ATH_WORKFLOW_SECRET=${randomBytes(32).toString('hex')}`)
    .replace('ATH_ADMIN_PASSWORD_HASH=GENERATE_WITH_NPM_RUN_SETUP', `ATH_ADMIN_PASSWORD_HASH=${hash}`);
  writeFileSync(envPath, template, { flag: 'wx', mode: 0o600 });
  writeFileSync(resolve(root, 'data/bootstrap-password.txt'), password, { flag: 'wx', mode: 0o600 });
  console.log('.env dibuat. Password awal ada di data/bootstrap-password.txt; jangan kirim password melalui chat.');
}
for (const dir of ['research', 'content', 'images', 'carousels', 'videos', 'captions', 'publications', 'jobs']) {
  mkdirSync(resolve(root, 'data', dir), { recursive: true });
}
for (const dir of ['logs', 'backups']) mkdirSync(resolve(root, dir), { recursive: true });
