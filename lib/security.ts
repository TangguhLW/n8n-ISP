import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.ts';

const COOKIE = 'ath_session';
export function originAllowed(request: Request): boolean {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return false;
  if (origin && origin !== `http://${host}`) return false;
  return !['cross-site', 'none'].includes(request.headers.get('sec-fetch-site') || '') && !!origin;
}
function secret(): string {
  const value = process.env.ATH_SESSION_SECRET;
  if (!value || value.length < 48 || value.startsWith('GENERATE_')) throw new Error('Jalankan npm run setup sebelum login.');
  return value;
}
export function makeSession(): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 3600000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`;
}
export function authenticated(request: Request): boolean {
  const host = request.headers.get('host') || '';
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return false;
  const cookie = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!cookie) return false;
  try {
    const [body, mac] = cookie.split('.');
    const expected = createHmac('sha256', secret()).update(body).digest('base64url');
    if (!mac || mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch { return false; }
}
export function verifyPassword(password: string): boolean {
  const [salt, hash] = (process.env.ATH_ADMIN_PASSWORD_HASH || '').split(':');
  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function allowLogin(): boolean {
  const row = db().prepare('SELECT * FROM login_attempts WHERE ip=?').get('local');
  if (!row || Number(row.reset_at) < Date.now()) {
    db().prepare('INSERT INTO login_attempts VALUES (?,?,?) ON CONFLICT(ip) DO UPDATE SET count=1,reset_at=excluded.reset_at').run('local', 1, Date.now() + 15 * 60000);
    return true;
  }
  db().prepare('UPDATE login_attempts SET count=count+1 WHERE ip=?').run('local');
  return Number(row.count) < 10;
}
export function sessionCookie(value: string): string {
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${value ? 28800 : 0}`;
}
export function resetLoginAttempts(): void {
  db().prepare('DELETE FROM login_attempts WHERE ip=?').run('local');
}
export function redact(message: unknown): string {
  let value = String(message);
  for (const [key, secretValue] of Object.entries(process.env)) {
    if (/(KEY|SECRET|TOKEN|PASSWORD)/i.test(key) && secretValue && secretValue.length >= 8) value = value.split(secretValue).join('[REDACTED]');
  }
  return value.replace(/(Bearer\s+)[\w.\-]+/gi, '$1[REDACTED]').slice(0, 2000);
}
