import { resolve } from 'node:path';

export const dataDir = resolve(/*turbopackIgnore: true*/ process.env.ATH_DATA_DIR || './data');
export const backupDir = resolve(/*turbopackIgnore: true*/ process.env.ATH_BACKUP_DIR || './backups');
export const appPort = Number(process.env.ATH_PORT || 3000);
export function localBase(value: string | undefined, fallback: string): string {
  const url = new URL(value || fallback);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Endpoint lokal harus http://127.0.0.1:PORT tanpa path atau kredensial.');
  }
  return url.origin;
}
export const n8nBase = () => localBase(process.env.N8N_BASE_URL, 'http://127.0.0.1:5678');
export const ollamaBase = () => localBase(process.env.OLLAMA_BASE_URL, 'http://127.0.0.1:11434');
export const comfyBase = () => localBase(process.env.COMFYUI_BASE_URL, 'http://127.0.0.1:8188');
