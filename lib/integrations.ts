import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { n8nBase, ollamaBase, comfyBase } from './config.ts';
import { save, list, notify } from './db.ts';
import { redact } from './security.ts';
import { existsSync } from 'node:fs';

const exec = promisify(execFile);
const dockerBinary = () => process.platform === 'win32' && existsSync(/*turbopackIgnore: true*/ 'C:/Program Files/Docker/Docker/resources/bin/docker.exe') ? 'C:/Program Files/Docker/Docker/resources/bin/docker.exe' : 'docker';
export async function dockerStatus(): Promise<Record<string, unknown>> {
  try {
    const { stdout } = await exec(dockerBinary(), ['inspect', '--format', '{{json .State}}', 'ath-n8n'], { timeout: 6000, maxBuffer: 100_000, windowsHide: true });
    const state = JSON.parse(stdout);
    return { status: state.Running ? 'RUNNING' : 'STOPPED', container: 'ath-n8n', health: state.Health?.Status || 'UNKNOWN', checkedAt: new Date().toISOString() };
  } catch(e) {
    return { status: (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'NOT_INSTALLED' : 'UNAVAILABLE', message: 'Docker CLI/Engine/container ATH belum tersedia. Jalankan scripts/status.ps1 untuk diagnosis.', checkedAt: new Date().toISOString() };
  }
}
async function probe(base: string, path: string): Promise<Record<string, unknown>> {
  const start = Date.now();
  try { const r = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000), redirect: 'error', cache: 'no-store' }); return { status: r.ok ? 'UP' : 'DOWN', httpStatus: r.status, durationMs: Date.now() - start, checkedAt: new Date().toISOString() }; }
  catch { return { status: 'DOWN', message: 'Endpoint tidak merespons dalam batas waktu atau koneksi ditolak.', checkedAt: new Date().toISOString() }; }
}
export async function health(): Promise<Record<string, unknown>> {
  const [liveness, readiness, docker, ollama, comfy] = await Promise.all([probe(n8nBase(), '/healthz'), probe(n8nBase(), '/healthz/readiness'), dockerStatus(), probe(ollamaBase(), '/api/tags'), probe(comfyBase(), '/system_stats')]);
  const previous = list('health')[0];
  const failures = readiness.status === 'UP' ? 0 : Number(previous?.failures || 0) + 1;
  if (failures === 3) notify('n8n.down', 'n8n tidak siap pada tiga pemeriksaan berturut-turut. Periksa Docker dan diagnostik.');
  if (readiness.status === 'UP' && Number(previous?.failures) >= 3) notify('n8n.recovered', 'n8n kembali siap.');
  const value = { n8n: liveness, readiness, docker, ollama, comfy, database: { status: 'UP', engine: 'SQLite', checkedAt: new Date().toISOString() }, controlCenter: { status: 'UP' }, apiKeyConfigured: !!process.env.N8N_API_KEY, failures, checkedAt: new Date().toISOString() };
  save('health', value, 'system-health');
  return value;
}
export async function n8nList(resource: 'workflows' | 'executions'): Promise<Record<string, unknown>> {
  const key = process.env.N8N_API_KEY;
  if (!key) return { status: 'NEEDS_API_KEY', data: [], message: 'Tambahkan N8N_API_KEY pada .env setelah membuat akun owner n8n.', checkedAt: new Date().toISOString() };
  try {
    const all: Record<string, unknown>[] = []; let cursor = ''; let pages = 0;
    do {
      const url = `${n8nBase()}/api/v1/${resource}?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await fetch(url, { headers: { 'X-N8N-API-KEY': key }, signal: AbortSignal.timeout(7000), redirect: 'error', cache: 'no-store' });
      if (!res.ok) return { status: 'ERROR', data: [], message: `n8n API HTTP ${res.status}`, checkedAt: new Date().toISOString() };
      const body = await res.json();
      all.push(...body.data.map((row: Record<string, unknown>) => resource === 'workflows' ? { id: row.id, name: row.name, active: row.active, updatedAt: row.updatedAt } : { id: row.id, workflowId: row.workflowId, status: row.status, startedAt: row.startedAt, stoppedAt: row.stoppedAt, finished: row.finished }));
      cursor = body.nextCursor || ''; pages++;
    } while (cursor && pages < 10);
    return { status: 'CONNECTED', data: all, truncated: !!cursor, checkedAt: new Date().toISOString() };
  } catch(e) { return { status: 'ERROR', data: [], message: redact(e), checkedAt: new Date().toISOString() }; }
}
export async function dockerLogs(): Promise<string> {
  try { const { stdout, stderr } = await exec(dockerBinary(), ['logs', '--tail', '100', 'ath-n8n'], { timeout: 6000, maxBuffer: 200_000, windowsHide: true }); return redact(`${stdout}\n${stderr}`); }
  catch { return 'Log container belum tersedia. Docker/n8n harus berjalan dahulu.'; }
}
export async function probeVideo(path: string): Promise<Record<string, unknown>> {
  try {
    const {stdout} = await exec('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], { timeout: 15000, maxBuffer: 200_000, windowsHide: true });
    const parsed = JSON.parse(stdout); const stream = parsed.streams?.find((s: Record<string, unknown>) => s.codec_type === 'video');
    if (!stream) throw new Error('File tidak mempunyai stream video.');
    return { status: 'VALIDATED', duration: Number(parsed.format?.duration), width: stream.width, height: stream.height, codec: stream.codec_name, hasAudio: parsed.streams.some((s: Record<string, unknown>) => s.codec_type === 'audio') };
  } catch(e) { return { status: (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'NEEDS_FFMPEG' : 'VALIDATION_FAILED', message: 'Metadata video belum tervalidasi. Periksa FFprobe dan file input.' }; }
}
