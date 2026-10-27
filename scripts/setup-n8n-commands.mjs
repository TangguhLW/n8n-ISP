import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const base = new URL(process.env.N8N_BASE_URL || 'http://127.0.0.1:5678');
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('n8n harus lokal.');
const headers = { 'X-N8N-API-KEY': process.env.N8N_API_KEY, 'Content-Type': 'application/json' };
async function api(path, method = 'GET', body) {
  const response = await fetch(`${base.origin}/api/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`n8n API HTTP ${response.status}: ${path.split('?')[0]}`);
  return response.json();
}
let env = await readFile('.env', 'utf8');
function ensure(name) {
  const existing = env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
  if (existing) return existing;
  const token = randomBytes(32).toString('hex'); env += `\n${name}=${token}\n`; return token;
}
const webhookToken = ensure('ATH_N8N_WEBHOOK_TOKEN');
const dispatchToken = ensure('ATH_N8N_DISPATCH_TOKEN');
await writeFile('.env', env);
const credentials = [
  { id: 'athCommandWebhook', name: 'ATH command webhook', type: 'httpHeaderAuth', data: { name: 'X-ATH-Command', value: webhookToken } },
  { id: 'athCommandDispatch', name: 'ATH command dispatch', type: 'httpHeaderAuth', data: { name: 'X-ATH-N8N-Dispatch', value: dispatchToken } }
];
await mkdir('data/n8n', { recursive: true });
const credentialPath = resolve('data/n8n/command-credentials.json');
await writeFile(credentialPath, JSON.stringify(credentials));
const docker = process.platform === 'win32' ? 'C:/Program Files/Docker/Docker/resources/bin/docker.exe' : 'docker';
execFileSync(docker, ['cp', credentialPath, 'ath-n8n:/tmp/ath-command-credentials.json'], { windowsHide: true, stdio: 'pipe' });
execFileSync(docker, ['exec', 'ath-n8n', 'n8n', 'import:credentials', '--input=/tmp/ath-command-credentials.json'], { windowsHide: true, stdio: 'pipe' });
execFileSync(docker, ['exec', '--user', 'root', 'ath-n8n', 'rm', '/tmp/ath-command-credentials.json'], { windowsHide: true, stdio: 'pipe' });
await writeFile(credentialPath, '[]');
const credential = { httpHeaderAuth: { id: 'athCommandDispatch', name: 'ATH command dispatch' } };
const dispatch = (operation) => ({ id: 'dispatch', name: 'Jalankan operasi ATH', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [300, 0], parameters: {
  method: 'POST', url: `http://host.docker.internal:${process.env.ATH_PORT || 3000}/api/n8n/dispatch`, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: operation ? `={{ { operation: '${operation}', requestId: $execution.id.padStart(8,'0') + '-0000-4000-8000-000000000000' } }}` : '={{ { operation: $json.body.operation, payload: $json.body.payload, requestId: $json.body.requestId } }}', options: { timeout: 80000 }
}, credentials: credential });
const command = { name: 'ATH - Command Center', nodes: [
  { id: 'webhook', webhookId: 'ath-command-center', name: 'Perintah ATH', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0], parameters: { httpMethod: 'POST', path: 'ath-command-center', authentication: 'headerAuth', responseMode: 'responseNode', options: {} }, credentials: { httpHeaderAuth: { id: 'athCommandWebhook', name: 'ATH command webhook' } } },
  dispatch(),
  { id: 'response', name: 'Hasil execution', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.4, position: [600, 0], parameters: { respondWith: 'json', responseBody: '={{ { executionId: $execution.id, result: $json.result } }}', options: {} } }
], connections: { 'Perintah ATH': { main: [[{ node: 'Jalankan operasi ATH', type: 'main', index: 0 }]] }, 'Jalankan operasi ATH': { main: [[{ node: 'Hasil execution', type: 'main', index: 0 }]] } }, settings: { timezone: 'Asia/Bangkok', executionOrder: 'v1', saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all' } };
const daily = { name: 'ATH - Daily Legal Research - Configure Feed First', nodes: [
  { id: 'schedule', name: 'Setiap hari 08.00', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 0], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * *' }] } } }, dispatch('research')
], connections: { 'Setiap hari 08.00': { main: [[{ node: 'Jalankan operasi ATH', type: 'main', index: 0 }]] } }, settings: { timezone: 'Asia/Bangkok', executionOrder: 'v1', saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all' } };
const existing = []; let cursor = '';
do { const page = await api(`workflows?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`); existing.push(...page.data); cursor = page.nextCursor || ''; } while (cursor);
const report = [];
for (const workflow of [command, daily]) {
  const matches = existing.filter(row => row.name === workflow.name);
  if (matches.length > 1) throw new Error(`Workflow duplikat perlu review: ${workflow.name}`);
  const old = matches[0];
  if (old) { const detail = await api(`workflows/${old.id}`); await writeFile(`data/n8n/previous-${old.id}.json`, JSON.stringify(detail)); }
  if (old?.active) await api(`workflows/${old.id}/deactivate`, 'POST', {});
  const saved = await api(old ? `workflows/${old.id}` : 'workflows', old ? 'PUT' : 'POST', workflow);
  const active = await api(`workflows/${saved.id}/activate`, 'POST', {});
  report.push({ id: saved.id, name: saved.name, active: active.active });
}
await writeFile('data/n8n/command-setup.json', JSON.stringify({ checkedAt: new Date().toISOString(), workflows: report }, null, 2));
console.log(JSON.stringify({ configured: true, workflows: report }));
