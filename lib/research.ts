import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
import { list, save, get } from './db.ts';
import { event, fail, finish } from './jobs.ts';

export const officialDomains = ['mkri.id', 'mahkamahagung.go.id', 'jdihn.go.id', 'peraturan.bpk.go.id', 'ojk.go.id', 'jdih.kemenkum.go.id'];
export function officialURL(input: string): string {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !officialDomains.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))) throw new Error('Gunakan HTTPS pada domain resmi yang tercantum di Settings.');
  return url.href;
}
export function clean(value: unknown): string {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
}
export function scoreTopic(values: Record<string, number>): { score: number; reasons: string[] } {
  const positive = ['novelty', 'credibility', 'publicInterest', 'audience', 'education', 'clarity', 'practiceFit'];
  const negative = ['misinterpretation', 'reputation'];
  const score = Math.round((positive.reduce((n,k) => n + (values[k] || 0), 0) - negative.reduce((n,k) => n + (values[k] || 0), 0)) / 35 * 100);
  return { score: Math.max(0, Math.min(100, score)), reasons: [...positive.map(k => `${k}: +${values[k] || 0}/5`), ...negative.map(k => `${k}: -${values[k] || 0}/5`), 'Penilaian editorial, bukan prediksi viralitas.'] };
}
export async function fetchFeed(url: string): Promise<Record<string, any>[]> {
  const response = await fetch(officialURL(url), { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'ATH-Research/0.1 (local editorial research)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
  if (!response.ok) throw new Error(`Sumber mengembalikan HTTP ${response.status}.`);
  if (Number(response.headers.get('content-length') || 0) > 2_000_000) throw new Error('Feed terlalu besar.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Feed kosong.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 2_000_000) { await reader.cancel(); throw new Error('Feed melebihi 2 MB.'); } chunks.push(value); }
  const xml = Buffer.concat(chunks).toString('utf8');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Deklarasi entity tidak diterima.');
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(xml);
  const entries = parsed.rss?.channel?.item || parsed.feed?.entry;
  if (!parsed.rss && !parsed.feed) throw new Error('Endpoint bukan RSS/Atom.');
  return entries ? (Array.isArray(entries) ? entries : [entries]).slice(0, 40) : [];
}
export async function runResearch(jobId: string): Promise<void> {
  try {
    event(jobId, 'Validasi sumber', 'VALIDATING', 'Memeriksa konfigurasi feed yang disetujui.');
    const sources = list('source').filter(s => s.enabled && s.accessConfirmed);
    if (!sources.length) throw new Error('NEEDS_CONFIGURATION: tambahkan RSS/Atom resmi dan konfirmasi hak akses di Legal Intelligence.');
    const errors: string[] = []; const created: string[] = [];
    event(jobId, 'Pengumpulan sumber', 'RUNNING', `${sources.length} feed terkonfigurasi.`);
    for (const source of sources) {
      try {
        const entries = await fetchFeed(String(source.url));
        for (const item of entries) {
          let link = item.link;
          if (Array.isArray(link)) link = link.find(l => l['@_rel'] === 'alternate') || link[0];
          if (typeof link === 'object' && link) link = (link as Record<string, unknown>)['@_href'];
          if (typeof link !== 'string') continue;
          const url = officialURL(link); const id = createHash('sha256').update(url).digest('hex');
          if (get(id, 'topic')) continue;
          const rawDate = item.pubDate || item.published || item.updated;
          const parsedDate = rawDate ? Date.parse(String(rawDate)) : NaN;
          const publicationDate = Number.isFinite(parsedDate) && parsedDate <= Date.now() ? new Date(parsedDate).toISOString() : null;
          const topic = save('topic', { title: clean(item.title?.['#text'] || item.title), facts: clean(item.description || item.summary?.['#text'] || item.summary || ''), url, publisher: source.name, publicationDate, eventDate: null, enactmentDate: null, effectiveDate: null, discoveredAt: new Date().toISOString(), checkedAt: new Date().toISOString(), verification: 'UNVERIFIED', legalValidity: 'UNKNOWN', regulationNumber: '', relevance: '', confidence: 'NEEDS_REVIEW', score: null, scoreReasons: [], primarySources: [url], supportingSources: [], risk: 'Ringkasan feed belum diperiksa terhadap dokumen lengkap.', reviewNotes: '' }, id);
          created.push(String(topic.id));
        }
        save('source', { ...source, lastChecked: new Date().toISOString(), lastError: null }, String(source.id));
      } catch(e) { errors.push(`${source.name}: ${String(e)}`); save('source', { ...source, lastChecked: new Date().toISOString(), lastError: String(e).slice(0, 1000) }, String(source.id)); }
    }
    event(jobId, 'Penyimpanan kandidat', 'RUNNING', `${created.length} kandidat baru; fakta hukum belum diverifikasi.`);
    if (errors.length === sources.length) throw new Error(errors.join('; '));
    finish(jobId, { candidateIds: created, sourceErrors: errors, message: created.length ? 'Kandidat tersimpan untuk review sumber primer.' : 'Tidak ada kandidat baru. Kelayakan editorial belum dinilai.' });
  } catch(e) { fail(jobId, e); }
}
