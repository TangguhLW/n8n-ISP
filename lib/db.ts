import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { dataDir } from './config.ts';

type Row = Record<string, unknown>;
let instance: DatabaseSync | undefined;
export function db(): DatabaseSync {
  if (instance) return instance;
  mkdirSync(dataDir, { recursive: true });
  instance = new DatabaseSync(resolve(dataDir, 'ath.sqlite'));
  instance.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS records_kind ON records(kind, updated_at);
    CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL, account TEXT, stage TEXT NOT NULL, input TEXT NOT NULL, output TEXT, error TEXT, idempotency_key TEXT UNIQUE NOT NULL, retry_count INTEGER DEFAULT 0, workflow_id TEXT, execution_id TEXT, created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT NOT NULL REFERENCES jobs(id), stage TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL, timestamp TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, detail TEXT NOT NULL, timestamp TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS dedup (key TEXT PRIMARY KEY, timestamp TEXT NOT NULL);
  `);
  const stamp = new Date().toISOString();
  for (const name of ['izasadziliandpartners', 'isolegalofficial']) {
    instance.prepare('INSERT OR IGNORE INTO records VALUES (?, ?, ?, ?, ?)').run(name, 'brand', JSON.stringify({ account: name, audience: '', focus: '', tone: '', colors: '', status: 'NEEDS_CONFIGURATION' }), stamp, stamp);
  }
  return instance;
}
export function transaction<T>(fn: () => T): T {
  db().exec('BEGIN IMMEDIATE');
  try { const result = fn(); db().exec('COMMIT'); return result; }
  catch (e) { db().exec('ROLLBACK'); throw e; }
}
export function list(kind: string): Row[] {
  return db().prepare('SELECT * FROM records WHERE kind=? ORDER BY updated_at DESC').all(kind).map(decode);
}
function decode(row: Row): Row {
  return { ...JSON.parse(String(row.payload)), id: row.id, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function get(id: string, kind: string): Row | undefined {
  const row = db().prepare('SELECT * FROM records WHERE id=? AND kind=?').get(id, kind);
  return row ? decode(row) : undefined;
}
export function save(kind: string, payload: Row, id: string = randomUUID()): Row {
  const stamp = new Date().toISOString();
  db().prepare('INSERT INTO records VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at WHERE records.kind=excluded.kind').run(id, kind, JSON.stringify(payload), stamp, stamp);
  return get(id, kind)!;
}
export function audit(action: string, detail: string): void {
  db().prepare('INSERT INTO audit(action,detail,timestamp) VALUES (?,?,?)').run(action, detail.slice(0, 2000), new Date().toISOString());
}
export function notify(key: string, title: string): void {
  const old = db().prepare('SELECT timestamp FROM dedup WHERE key=?').get(key);
  if (old && Date.now() - Date.parse(String(old.timestamp)) < 60 * 60 * 1000) return;
  transaction(() => {
    db().prepare('INSERT INTO dedup VALUES (?,?) ON CONFLICT(key) DO UPDATE SET timestamp=excluded.timestamp').run(key, new Date().toISOString());
    save('notification', { title, read: false });
  });
}
export function jobs(): Row[] {
  return db().prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 200').all().map(row => ({ ...row, input: JSON.parse(String(row.input)), output: row.output ? JSON.parse(String(row.output)) : null, events: db().prepare('SELECT * FROM events WHERE job_id=? ORDER BY id').all(String(row.id)) }));
}
