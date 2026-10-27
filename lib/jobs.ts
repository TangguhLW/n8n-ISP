import { randomUUID } from 'node:crypto';
import { audit, db, notify, transaction } from './db.ts';
import { redact } from './security.ts';

export function createJob(type: string, input: Record<string, unknown>, key: string, account?: string): { id: string; existing: boolean } {
  return transaction(() => {
    const prior = db().prepare('SELECT id FROM jobs WHERE idempotency_key=?').get(key);
    if (prior) return { id: String(prior.id), existing: true };
    const id = randomUUID();
    db().prepare('INSERT INTO jobs(id,type,status,account,stage,input,idempotency_key,created_at) VALUES (?,?,?,?,?,?,?,?)').run(id, type, 'QUEUED', account || null, 'Antrean', JSON.stringify(input), key, new Date().toISOString());
    event(id, 'Antrean', 'QUEUED', 'Pekerjaan tersimpan.');
    audit('job.created', `${type}: ${id}`);
    return { id, existing: false };
  });
}
export function event(id: string, stage: string, status: string, detail: string): void {
  const now = new Date().toISOString();
  db().prepare('UPDATE jobs SET stage=?,status=?,started_at=CASE WHEN started_at IS NULL AND ? IN (\'RUNNING\',\'VALIDATING\') THEN ? ELSE started_at END WHERE id=?').run(stage, status, status, now, id);
  db().prepare('INSERT INTO events(job_id,stage,status,detail,timestamp) VALUES (?,?,?,?,?)').run(id, stage, status, redact(detail), now);
}
export function finish(id: string, output: Record<string, unknown>, waiting = false): void {
  transaction(() => {
    event(id, waiting ? 'Review manusia' : 'Selesai', waiting ? 'WAITING_FOR_APPROVAL' : 'COMPLETED', waiting ? 'Menunggu pemeriksaan reviewer.' : 'Hasil tersimpan.');
    db().prepare('UPDATE jobs SET output=?,finished_at=? WHERE id=?').run(JSON.stringify(output), waiting ? null : new Date().toISOString(), id);
  });
  notify(`job:${id}`, waiting ? `Job ${id.slice(0, 8)} menunggu review.` : `Job ${id.slice(0, 8)} selesai.`);
}
export function fail(id: string, error: unknown): void {
  transaction(() => {
    event(id, 'Error', 'FAILED', redact(error));
    db().prepare('UPDATE jobs SET error=?,finished_at=? WHERE id=?').run(redact(error), new Date().toISOString(), id);
  });
  notify(`job:${id}:failed`, `Job ${id.slice(0, 8)} gagal: ${redact(error)}`);
}
export function reconcile(): number {
  const interrupted = db().prepare("SELECT id FROM jobs WHERE status IN ('RUNNING','VALIDATING','RETRYING')").all();
  for (const row of interrupted) {
    event(String(row.id), 'Perlu pemeriksaan setelah restart', 'UNKNOWN', 'Status belum dipastikan. Tidak diulang otomatis.');
    audit('job.reconcile', String(row.id));
  }
  return interrupted.length;
}
