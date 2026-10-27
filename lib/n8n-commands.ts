import { timingSafeEqual, randomUUID } from 'node:crypto';
import { n8nBase } from './config.ts';
import { tiktokLiveURL } from './tiktok-live.ts';

export const operations = ['health', 'workflows', 'failures', 'whatsapp', 'gmail', 'research', 'live'] as const;
export type Operation = typeof operations[number];
export function parseN8nCommand(command: string): { operation: Operation; payload?: { url: string; account: number } } {
  const normalized = command.trim().replace(/\s+/g, ' ').toLowerCase();
  const names: Record<string, Operation> = { 'cek kesehatan n8n': 'health', 'daftar workflow': 'workflows', 'tampilkan workflow gagal': 'failures', 'ambil nomor grup pilihan': 'whatsapp', 'jalankan riset hukum': 'research' };
  if (names[normalized]) return { operation: names[normalized] };
  if (['cari gmail grup pilihan', 'cari gmail whatsapp'].includes(normalized)) return { operation: 'gmail' };
  const live = command.trim().match(/^buka live akun ([12])\s+(https:\/\/\S+)$/i);
  if (live) return { operation: 'live', payload: { account: Number(live[1]), url: tiktokLiveURL(live[2]) } };
  throw new Error('Perintah belum didukung. Pilih contoh perintah yang tersedia; tulis link TikTok live lengkap untuk membuka live. Shell bebas tidak didukung.');
}
export function dispatchAuthorized(request: Request): boolean {
  const expected = process.env.ATH_N8N_DISPATCH_TOKEN || '';
  const supplied = request.headers.get('X-ATH-N8N-Dispatch') || '';
  return expected.length >= 48 && Buffer.byteLength(expected) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
export async function runN8nCommand(command: string): Promise<Record<string, unknown>> {
  const input = parseN8nCommand(command);
  const token = process.env.ATH_N8N_WEBHOOK_TOKEN;
  if (!token) throw new Error('Webhook Command Center belum dikonfigurasi.');
  const response = await fetch(`${n8nBase()}/webhook/ath-command-center`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ATH-Command': token },
    body: JSON.stringify({ ...input, requestId: randomUUID() }), signal: AbortSignal.timeout(90000), redirect: 'error', cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Perintah n8n gagal (HTTP ${response.status}). Periksa execution; jangan ulangi aksi pengambilan data sebelum memeriksa statusnya.`);
  const result = await response.json();
  if (!result.executionId || !result.result) throw new Error('n8n tidak mengembalikan ID execution dan hasil. Periksa workflow Command Center.');
  return result;
}
