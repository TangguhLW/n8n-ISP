import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';

const path = resolve('.env');
let env = await readFile(path, 'utf8');
const get = key => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^"|"$/g, '');
const add = (key, value) => { if (!get(key)) env += `\n${key}=${value}`; };
add('WAHA_API_KEY', randomBytes(32).toString('hex'));
add('WAHA_API_KEY_HASH', createHash('sha512').update(get('WAHA_API_KEY')).digest('hex'));
add('WAHA_DASHBOARD_PASSWORD', randomBytes(32).toString('hex'));
add('WAHA_BASE_URL', 'http://127.0.0.1:3002');
add('ATH_WHATSAPP_SYNC_TOKEN', randomBytes(32).toString('hex'));
add('ATH_ARTIFACT_NODE', 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe');
add('ATH_ARTIFACT_MODULES', 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
await writeFile(path, env.endsWith('\n') ? env : `${env}\n`);
await mkdir(resolve('data/whatsapp'), { recursive: true });
const template = resolve('data/whatsapp/template.xlsx');
try { await readFile(template); }
catch (error) { if (error.code !== 'ENOENT') throw error; await copyFile('C:/Users/user/Downloads/template-import-data-debitur-e-somasi.xlsx', template); }
await writeFile(resolve('data/whatsapp/n8n-credential.json'), JSON.stringify([{
  id: 'athWhatsAppLocalCsv', name: 'ATH WhatsApp local export', type: 'httpHeaderAuth',
  data: { name: 'X-ATH-WhatsApp-Sync', value: get('ATH_WHATSAPP_SYNC_TOKEN') }
}]));
console.log('WhatsApp configuration saved; original Excel template preserved. No secrets printed.');
