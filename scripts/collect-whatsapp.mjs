import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { wahaJson } from './whatsapp-api.mjs';
import { contactId, exportScope, toCsv } from './whatsapp-data.mjs';
import { collectSelectedGroups } from './whatsapp-groups.mjs';
import { collectGroupGmails } from './whatsapp-gmails.mjs';

const directory = resolve('data/whatsapp');
await fs.mkdir(directory, { recursive: true });
const lockPath = resolve(directory, 'collector.lock');
let lock;
try { lock = await fs.open(lockPath, 'wx'); }
catch (e) { if (e.code === 'EEXIST') { console.log('Collector already running.'); process.exit(0); } throw e; }
await lock.writeFile(String(process.pid));
const run = promisify(execFile);
const progress = { scope: exportScope, state: 'running', startedAt: new Date().toISOString(), updatedAt: '', contacts: 0,
  unresolved: 0, groups: 0, processedGroups: 0, warnings: [], targets: [] };
async function status() {
  progress.updatedAt = new Date().toISOString();
  await fs.writeFile(resolve(directory, 'status.tmp.json'), JSON.stringify(progress, null, 2));
  await fs.rename(resolve(directory, 'status.tmp.json'), resolve(directory, 'status.json'));
}
try {
  await status();
  const session = await wahaJson('/api/sessions/default');
  if (session.status !== 'WORKING') throw new Error('WhatsApp belum terhubung. Scan QR terlebih dahulu.');
  const { records, groups } = await collectSelectedGroups(wahaJson, progress, status);
  let emailRecords = [];
  try {
    const saved = JSON.parse(await fs.readFile(resolve(directory, 'gmails.json'), 'utf8'));
    if (saved.scope === exportScope && Array.isArray(saved.records)) emailRecords = saved.records;
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (process.argv.includes('--gmail')) {
    const found = await collectGroupGmails(wahaJson, groups, progress, status);
    const merged = new Map(emailRecords.map(row => [row.email, row]));
    for (const row of found) {
      const old = merged.get(row.email);
      merged.set(row.email, { ...row, sources: [...new Set([...(old?.sources || []), ...row.sources])] });
    }
    emailRecords = [...merged.values()];
    await fs.writeFile(resolve(directory, 'gmails.json'), JSON.stringify({ scope: exportScope, records: emailRecords }, null, 2));
  }
  records.push(...emailRecords);
  progress.emails = emailRecords.length;
  if (!records.length) throw new Error('Belum ada nomor peserta grup pilihan yang berhasil diperoleh.');
  await fs.writeFile(resolve(directory, 'pending.json'), JSON.stringify({ scope: exportScope, records, coverage: { ...progress } }, null, 2));
  await fs.copyFile(resolve('scripts/build-whatsapp-excel.mjs'), resolve(directory, 'build-excel.mjs'));
  await run(process.env.ATH_ARTIFACT_NODE, [resolve(directory, 'build-excel.mjs')], { cwd: process.cwd(), windowsHide: true, timeout: 600000, maxBuffer: 1000000 });
  await fs.rename(resolve(directory, 'e-somasi-whatsapp.pending.xlsx'), resolve(directory, 'e-somasi-whatsapp.xlsx'));
  await fs.rename(resolve(directory, 'pending.json'), resolve(directory, 'index.json'));
  await fs.writeFile(resolve(directory, 'whatsapp-contacts.csv'), toCsv([['Nomor WhatsApp', 'Nama', 'Email', 'Sumber'], ...records.map(r => [r.phone, r.name, r.email || '', r.sources.join('; ')])]));
  await fs.writeFile(resolve(directory, 'whatsapp-groups.csv'), toCsv([['ID grup (bukan nomor)', 'Nama grup'], ...groups.map(g => [contactId(g.id), g.subject || g.name])]));
  progress.state = progress.warnings.length ? 'partial' : 'completed';
  progress.finishedAt = new Date().toISOString(); progress.rows = records.length;
  await status();
  console.log(JSON.stringify({ state: progress.state, groups: progress.groups, contacts: progress.contacts, unresolved: progress.unresolved }));
} catch (e) {
  progress.state = 'failed'; progress.error = String(e.message).replaceAll(process.env.WAHA_API_KEY || '__NONE__', '[REDACTED]').slice(0, 600);
  await status(); process.exitCode = 1;
} finally { await lock.close(); await fs.unlink(lockPath); }
