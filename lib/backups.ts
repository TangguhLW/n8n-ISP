import { backup, DatabaseSync } from 'node:sqlite';
import { cp, mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { db, audit, save, notify } from './db.ts';
import { dataDir, backupDir } from './config.ts';

export async function fileManifest(root: string): Promise<Record<string, string>> {
  const result: Record<string,string> = {};
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Backup tidak menerima symbolic link.');
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name !== 'manifest.json') result[relative(root, path).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(path)).digest('hex');
    }
  }
  await walk(root); return result;
}
export async function applicationBackup(): Promise<Record<string, unknown>> {
  const id = randomUUID(); const root = resolve(backupDir, `app-${id}`);
  await mkdir(root, { recursive: true });
  await backup(db(), resolve(root, 'ath.sqlite'));
  const snapshot = new DatabaseSync(resolve(root, 'ath.sqlite'));
  try { snapshot.exec('PRAGMA journal_mode=DELETE'); } finally { snapshot.close(); }
  for (const dir of ['images', 'videos', 'content', 'captions', 'research', 'carousels', 'publications']) {
    const source = resolve(dataDir, dir);
    if (await stat(/*turbopackIgnore: true*/ source).then(s => s.isDirectory()).catch(() => false)) await cp(source, resolve(root, dir), { recursive: true, errorOnExist: true, force: false });
  }
  const manifest = { version: 1, type: 'APPLICATION_ONLY', id, createdAt: new Date().toISOString(), files: await fileManifest(root), excludes: ['n8n database', '.env encryption key', 'bootstrap password'] };
  await writeFile(resolve(root, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  const verified = await verifyApplicationBackup(root);
  const record = save('backup', { backupId: id, folder: `app-${id}`, type: manifest.type, verified, includesN8n: false });
  audit('backup.created', `app-${id}: SQLite snapshot, verified=${verified}`);
  notify(`backup:${id}`, 'Backup aplikasi dibuat dan hash serta SQLite diperiksa. Backup n8n terpisah melalui scripts/backup.ps1.');
  return record;
}
export async function verifyApplicationBackup(root: string): Promise<boolean> {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
  const files = await fileManifest(root);
  if (JSON.stringify(Object.keys(files).sort()) !== JSON.stringify(Object.keys(manifest.files).sort()) || Object.entries(files).some(([path,hash]) => manifest.files[path] !== hash)) throw new Error('Checksum backup tidak cocok.');
  const restored = new DatabaseSync(resolve(root, 'ath.sqlite'), { readOnly: true });
  try { return restored.prepare('PRAGMA integrity_check').get()?.integrity_check === 'ok'; } finally { restored.close(); }
}
