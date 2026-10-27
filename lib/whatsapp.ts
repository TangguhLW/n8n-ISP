import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { waha, wahaJson } from '../scripts/whatsapp-api.mjs';
import { exportScope } from '../scripts/whatsapp-data.mjs';

const directory = resolve(/*turbopackIgnore: true*/ 'data/whatsapp');
let starting = false;
export async function whatsappStatus() {
  let job = null;
  try { job = JSON.parse(await readFile(resolve(directory, 'status.json'), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  if (job?.scope !== exportScope) job = null;
  let session = 'NOT_CREATED', connectorError = '';
  try {
    const sessions = await wahaJson('/api/sessions?all=true');
    session = sessions.find((s: { name: string }) => s.name === 'default')?.status || 'NOT_CREATED';
  } catch (e) { connectorError = e instanceof Error ? e.message : 'Konektor belum tersedia.'; }
  let fileReady = false;
  try { await access(resolve(directory, 'e-somasi-whatsapp.xlsx')); fileReady = ['completed', 'partial'].includes(job?.state); } catch { /* No export yet. */ }
  return { session, connectorError, job, fileReady };
}
export async function prepareQr() {
  const sessions = await wahaJson('/api/sessions?all=true');
  const session = sessions.find((s: { name: string }) => s.name === 'default');
  if (!session) await wahaJson('/api/sessions', { method: 'POST', body: JSON.stringify({ name: 'default', start: true, config: { webhooks: [], debug: false } }) });
  else if (session.status === 'STOPPED') await wahaJson('/api/sessions/default/start', { method: 'POST', body: '{}' });
  else if (session.status === 'FAILED') await wahaJson('/api/sessions/default/restart', { method: 'POST', body: '{}' });
  return whatsappStatus();
}
export async function qrImage() {
  const response = await waha('/api/default/auth/qr?format=image', { headers: { Accept: 'image/png' } });
  return new Response(await response.arrayBuffer(), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
}
export function syncAuthorized(request: Request) {
  const supplied = request.headers.get('X-ATH-WhatsApp-Sync') || '';
  const token = process.env.ATH_WHATSAPP_SYNC_TOKEN || '';
  return token.length >= 48 && Buffer.byteLength(supplied) === Buffer.byteLength(token) && timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
}
export async function startCollection(includeGmail = false) {
  if (starting && includeGmail) throw new Error('Pengambilan lain masih berjalan. Pencarian Gmail belum dimulai; tunggu selesai lalu kirim perintah lagi.');
  if (starting) return { started: false, state: 'running' };
  starting = true;
  try {
    const session = await wahaJson('/api/sessions/default');
    if (session.status !== 'WORKING') return { started: false, state: 'waiting_for_qr' };
    let locked = false;
    try { await access(resolve(directory, 'collector.lock')); locked = true; } catch { /* No active lock. */ }
    if (locked && includeGmail) throw new Error('Pengambilan lain masih berjalan. Pencarian Gmail belum dimulai; tunggu selesai lalu kirim perintah lagi.');
    if (locked) return { started: false, state: 'running' };
    const child = spawn(process.execPath, ['--env-file=.env', 'scripts/collect-whatsapp.mjs', ...(includeGmail ? ['--gmail'] : [])], {
      cwd: process.cwd(), windowsHide: true, stdio: 'ignore', detached: true,
      env: { ...process.env, NODE_OPTIONS: '' }
    });
    await new Promise<void>((resolveSpawn, reject) => { child.once('spawn', resolveSpawn); child.once('error', reject); });
    child.unref();
    return { started: true, state: 'running' };
  } finally { starting = false; }
}
export async function exportFile() {
  const job = JSON.parse(await readFile(resolve(directory, 'status.json'), 'utf8'));
  if (job.scope !== exportScope || !['completed', 'partial'].includes(job.state)) throw new Error('Ekspor grup pilihan belum siap.');
  return new Response(await readFile(resolve(directory, 'e-somasi-whatsapp.xlsx')), {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="e-somasi-whatsapp.xlsx"', 'Cache-Control': 'no-store' }
  });
}
