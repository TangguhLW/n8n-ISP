import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const base = new URL(process.env.N8N_BASE_URL || 'http://127.0.0.1:5678');
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname) || base.username || base.password) throw new Error('Hanya n8n lokal diizinkan.');
const key = process.env.N8N_API_KEY;
if (!key) throw new Error('N8N_API_KEY belum dikonfigurasi.');
const headers = { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json' };
async function request(path, method = 'GET') {
  const response = await fetch(`${base.origin}/api/v1/${path}`, { method, headers, ...(method === 'POST' ? { body: '{}' } : {}), signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new Error(`n8n API HTTP ${response.status}.`);
  return response.json();
}
async function workflows() {
  const rows = []; let cursor = '';
  for (let page = 0; page < 10; page++) {
    const result = await request(`workflows?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    rows.push(...result.data); cursor = result.nextCursor || '';
    if (!cursor) return rows;
  }
  throw new Error('Daftar workflow melebihi batas pemeriksaan.');
}
const rows = await workflows();
const dailyWorkflows = rows.filter(row => row.name === 'ATH - Daily Legal Research - Configure Feed First');
let dailyResearch = dailyWorkflows.length ? 'NEEDS_REVIEW' : 'NOT_IMPORTED';
if (dailyWorkflows.length === 1) {
  let daily = await request(`workflows/${encodeURIComponent(dailyWorkflows[0].id)}`);
  const feed = daily.nodes.find(node => node.id === 'config')?.parameters?.assignments?.assignments?.find(item => item.name === 'feedUrl')?.value;
  const configured = typeof feed === 'string' && feed.trim().length > 0;
  if (!configured && daily.active) {
    daily = await request(`workflows/${encodeURIComponent(daily.id)}/deactivate`, 'POST');
    console.log('Template riset dijeda karena feed masih kosong.');
  }
  if (!configured && daily.active) throw new Error('Template riset tanpa feed belum berhasil dijeda.');
  dailyResearch = configured ? (daily.active ? 'ACTIVE_NEEDS_SOURCE_REVIEW' : 'INACTIVE_FEED_CONFIGURED') : 'INACTIVE_NEEDS_FEED_CONFIGURATION';
}
const monitors = rows.filter(row => row.name === 'ATH - System Health Monitor');
if (monitors.length !== 1) throw new Error('Diperlukan tepat satu workflow monitor ATH; jalankan import dahulu.');
let monitor = monitors[0];
const previous = await request(`executions?workflowId=${encodeURIComponent(monitor.id)}&limit=10`);
const previousIds = new Set(previous.data.map(row => row.id));
if (!monitor.active) monitor = await request(`workflows/${encodeURIComponent(monitor.id)}/activate`, 'POST');
if (!monitor.active) throw new Error('Monitor belum dinyatakan aktif oleh API.');
console.log('API terhubung. Monitor health aktif; menunggu execution terjadwal berikutnya.');
let execution;
for (let attempt = 0; attempt < 24; attempt++) {
  await delay(5000);
  const result = await request(`executions?workflowId=${encodeURIComponent(monitor.id)}&limit=10`);
  execution = result.data.find(row => !previousIds.has(row.id) && row.status === 'success');
  if (execution) break;
  if (result.data.some(row => !previousIds.has(row.id) && row.status === 'error')) throw new Error('Execution monitor gagal; periksa log dan execution n8n.');
}
if (!execution) throw new Error('Monitor aktif, tetapi execution sukses baru belum terlihat dalam batas dua menit.');
const current = await workflows();
const report = { checkedAt: new Date().toISOString(), api: 'CONNECTED', monitor: { id: monitor.id, name: monitor.name, active: true, executionId: execution.id, executionStatus: execution.status, startedAt: execution.startedAt, stoppedAt: execution.stoppedAt }, workflows: current.map(row => ({ id: row.id, name: row.name, active: row.active })), dailyResearch };
await writeFile('data/n8n-connection-status.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
