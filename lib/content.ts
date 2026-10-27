import { get, save, audit, db, transaction } from './db.ts';
import { event, finish, fail } from './jobs.ts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { dataDir } from './config.ts';

export function makeContent(topic: Record<string, unknown>, brand: Record<string, unknown>, format: string): Record<string, unknown> {
  const title = String(topic.title); const facts = String(topic.facts);
  const disclaimer = 'Informasi edukasi umum. Penerapan pada perkara tertentu memerlukan pemeriksaan dokumen dan penilaian advokat.';
  const slides = format === 'carousel' ? [
    { title, body: 'Apa yang perlu diperhatikan?', prompt: `Desain pembuka edukasi hukum tentang ${title}. Tanpa simbol pengadilan atau nomor peraturan rekaan.` },
    { title: 'Fakta dari sumber', body: facts, prompt: 'Layout teks untuk fakta yang telah diperiksa reviewer. Jangan menambah fakta.' },
    { title: 'Periksa konteks', body: String(topic.relevance || 'Baca sumber lengkap dan periksa relevansinya terhadap kondisi Anda.'), prompt: 'Layout checklist konteks dan ruang catatan reviewer.' },
    { title: 'Sumber dan catatan', body: `${topic.url}\n${disclaimer}`, prompt: 'Layout sumber dan disclaimer dengan teks terbaca.' }
  ] : [{ title, body: facts, prompt: `Feed edukasi hukum: ${title}. Gunakan hanya fakta yang disediakan; sisakan ruang sumber dan disclaimer.` }];
  const caption = `${title}\n\n${facts}\n\n${topic.relevance || ''}\n\nSumber: ${topic.url}\n\n${disclaimer}`;
  return { topicId: topic.id, account: brand.account, format, size: format === 'square' ? '1080x1080' : '1080x1350', status: 'READY_FOR_REVIEW', caption, shortCaption: `${title}\nSumber: ${topic.url}`, hashtags: '#EdukasiHukum #HukumIndonesia', slides, assets: [], approval: null, revision: 1, history: [], risk: topic.risk, provider: 'Template editorial berbasis fakta input; belum memakai LLM', brandSnapshot: { audience: brand.audience, focus: brand.focus, tone: brand.tone, colors: brand.colors } };
}
export function runContent(jobId: string, topicId: string, account: string, format: string): void {
  try {
    event(jobId, 'Validasi brief', 'VALIDATING', 'Memeriksa topik dan profil akun tujuan.');
    const topic = get(topicId, 'topic'); const brand = get(account, 'brand');
    if (!topic || !brand) throw new Error('Topik atau akun tidak ditemukan.');
    if (brand.status !== 'CONFIGURED') throw new Error('Lengkapi profil brand akun tujuan terlebih dahulu.');
    event(jobId, 'Perencanaan konten', 'RUNNING', 'Menyusun brief, caption, dan prompt gambar dari input sumber.');
    const draft = save('draft', { ...makeContent(topic, brand, format), jobId });
    finish(jobId, { draftId: draft.id }, true);
    audit('content.created', `${draft.id}: ${account}`);
  } catch(e) { fail(jobId, e); }
}
export function approveDraft(id: string, expectedRevision: number, notes: string): Record<string, unknown> {
  return transaction(() => {
    const draft = get(id, 'draft');
    if (!draft || draft.revision !== expectedRevision) throw new Error('Draft berubah. Muat ulang sebelum menyetujui.');
    if (!['READY_FOR_REVIEW', 'NEEDS_REVISION'].includes(String(draft.status))) throw new Error('Status draft tidak bisa disetujui.');
    const topic = get(String(draft.topicId), 'topic');
    if (topic?.verification !== 'REVIEWED') throw new Error('Reviewer harus memeriksa fakta dan sumber primer terlebih dahulu.');
    if (draft.jobId && db().prepare('SELECT status FROM jobs WHERE id=?').get(String(draft.jobId))?.status === 'CANCELLED') throw new Error('Job draft telah dibatalkan. Buat draft baru.');
    const assets = draft.assets as {slide: number; assetId: string}[];
    if (assets.length !== (draft.slides as unknown[]).length) throw new Error('Impor gambar untuk setiap slide sebelum persetujuan.');
    if (new Set(assets.map(a => a.slide)).size !== assets.length) throw new Error('Slide aset tidak konsisten.');
    for (const entry of assets) {
      const asset = get(entry.assetId, 'asset');
      if (!asset || asset.folder !== 'images' || !/^[-\w]+\.png$/.test(String(asset.file)) || !existsSync(resolve(dataDir, 'images', String(asset.file)))) throw new Error('File gambar slide belum tersedia.');
    }
    const updated = save('draft', { ...draft, status: 'APPROVED', approval: { reviewer: 'local-owner', timestamp: new Date().toISOString(), revision: expectedRevision, notes }, history: [...(draft.history as unknown[]), { action: 'APPROVED', timestamp: new Date().toISOString(), revision: expectedRevision }] }, id);
    if (draft.jobId) {
      event(String(draft.jobId), 'Disetujui reviewer', 'COMPLETED', 'Persetujuan lokal tersimpan. Belum dipublikasikan.');
      db().prepare('UPDATE jobs SET finished_at=? WHERE id=?').run(new Date().toISOString(), String(draft.jobId));
    }
    audit('content.approved', `${id}: revision ${expectedRevision}`);
    return updated;
  });
}
