'use client';
import { useCallback, useEffect, useState, useRef } from 'react';
import { AppleLiquidGlassButton } from './ui/AppleLiquidGlassButton';
import { AppleLiquidGlassPanel } from './ui/AppleLiquidGlassPanel';

type Job = { state: string; rows?: number; contacts: number; groups: number; processedGroups: number; unresolved: number; updatedAt: string; warnings: string[]; targets: { name: string; state: string; participants: number }[]; error?: string };
type Status = { session: string; connectorError: string; fileReady: boolean; job: Job | null };
export function WhatsAppExport({ embedded = false }: { embedded?: boolean }) {
  const [dark, setDark] = useState(true);
  useEffect(() => { setDark(localStorage.getItem('ath-theme') !== 'light'); }, []);
  const Container = embedded ? 'div' : 'main';
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [qrTick, setQrTick] = useState(0);
  const [qrError, setQrError] = useState(false);
  const automaticStarted = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data); setError(''); setQrTick(Date.now()); setQrError(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat status.'); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 15000); return () => clearInterval(timer); }, [refresh]);
  const action = useCallback(async (name: 'qr' | 'collect') => {
    setBusy(name); setError('');
    try {
      const response = await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Aksi gagal.'); }
    finally { setBusy(''); }
  }, [refresh]);
  const working = status?.session === 'WORKING';
  const scanning = status?.session === 'SCAN_QR_CODE';
  const collecting = status?.job?.state === 'running';
  const hasJob = !!status?.job;
  useEffect(() => {
    if (working && !hasJob && !automaticStarted.current) { automaticStarted.current = true; void action('collect'); }
  }, [working, hasJob, action]);
  const labels: Record<string, string> = { NOT_CREATED: 'Belum dipasangkan', STOPPED: 'Sesi berhenti', STARTING: 'Menyiapkan WhatsApp Web', SCAN_QR_CODE: 'Scan QR dari ponsel', WORKING: 'WhatsApp terhubung', FAILED: 'Sesi gagal', PASSKEY_REQUIRED: 'WhatsApp meminta passkey', PASSKEY_CONFIRMATION_REQUIRED: 'Konfirmasi kode di ponsel' };
  return <Container className={embedded ? 'whatsapp-workspace whatsapp-embedded' : `${dark ? 'dark ' : ''}whatsapp-workspace`}>
    {!embedded && <header className="whatsapp-heading"><a href="/">Kembali ke ATH</a><h1>WhatsApp QR</h1><p>Nomor peserta grup pilihan untuk testing e-somasi.</p></header>}
    {error && <p role="alert" className="whatsapp-error">{error}</p>}
    <div className="whatsapp-columns">
      <AppleLiquidGlassPanel className="whatsapp-pairing">
        <p className="whatsapp-section-label">Perangkat tertaut</p>
        <h2>{status ? labels[status.session] || status.session : 'Memuat konektor…'}</h2>
        {status?.connectorError && <p role="alert">{status.connectorError}</p>}
        <p>WAHA menjadi perangkat tertaut WhatsApp. Akses perangkat mencakup baca dan kirim pesan. Alur ATH ini hanya mengambil data untuk file lokal.</p>
        {scanning && <div className="whatsapp-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/whatsapp?mode=qr&t=${qrTick}`} width={272} height={272} alt="QR untuk memasangkan WhatsApp lokal" onError={() => setQrError(true)} />
          {qrError && <p role="alert">QR belum tersedia. Status akan diperbarui dalam 15 detik.</p>}
          <p>WhatsApp di ponsel → Perangkat tertaut → Tautkan perangkat.</p>
        </div>}
        {!working && <AppleLiquidGlassButton width="auto" loading={busy === 'qr'} disabled={!status || !!status.connectorError || scanning || status.session === 'STARTING'} onClick={() => void action('qr')}>Tampilkan QR</AppleLiquidGlassButton>}
        {working && <p className="whatsapp-connected">Akun sudah siap dibaca. Hasil akan tersimpan di laptop.</p>}
        <p className="whatsapp-note">Konektor WhatsApp Web ini berasal dari WAHA, bukan API resmi Meta. Hanya riwayat yang tersedia pada perangkat tertaut yang dapat diambil.</p>
      </AppleLiquidGlassPanel>
      <section className="whatsapp-export-panel">
        <p className="whatsapp-section-label">Excel e-somasi</p>
        <h2>Pengambilan data</h2>
        <p>Hanya peserta Open House Pucung, PSS Panco Sports Society, Grup gabut anak panco, dan grup ISP yang masuk ke hasil.</p>
        <p>Satu nomor per baris tanpa duplikat. Nama tersedia masuk kolom B, nomor WhatsApp kolom G, dan sumber grup kolom R. Kolom lainnya tetap kosong.</p>
        <div className="whatsapp-actions">
          <AppleLiquidGlassButton width="auto" loading={busy === 'collect' || collecting} disabled={!working || collecting} onClick={() => void action('collect')}>{collecting ? 'Sedang mengambil data' : 'Ambil data ke Excel'}</AppleLiquidGlassButton>
          <AppleLiquidGlassButton material="clear" arrow={false} width="auto" onClick={() => void refresh()} disabled={!!busy}>Perbarui status</AppleLiquidGlassButton>
          {status?.fileReady && <a className="whatsapp-download" href="/api/whatsapp?mode=download">Unduh Excel</a>}
        </div>
        {!status?.job && <p>Pengambilan pertama dimulai otomatis setelah akun terhubung melalui QR.</p>}
        {status?.job && <div aria-live="polite">
          <p>Status: {({ running: 'berjalan', completed: 'selesai', partial: 'selesai sebagian', failed: 'gagal' } as Record<string, string>)[status.job.state] || status.job.state}</p>
          {status.job.error && <p role="alert" className="whatsapp-error">{status.job.error}</p>}
          <dl className="whatsapp-counts"><div><dt>Nomor unik</dt><dd>{status.job.contacts}</dd></div><div><dt>Grup pilihan</dt><dd>{status.job.groups}</dd></div></dl>
          <p>Grup diperiksa: {status.job.processedGroups} / {status.job.groups}. Identitas dengan nomor tersembunyi: {status.job.unresolved}.</p>
          {!!status.job.targets.length && <ul className="whatsapp-group-list" aria-label="Hasil grup pilihan">{status.job.targets.map((target, i) => <li key={`${target.name}-${i}`}><span>{target.name}</span><span>{target.participants} peserta · {({ read: 'Diperiksa', completed: 'Selesai', failed: 'Gagal', pending: 'Menunggu' } as Record<string, string>)[target.state] || target.state}</span></li>)}</ul>}
          {!!status.job.warnings.length && <details><summary>Sumber yang belum tuntas ({status.job.warnings.length})</summary><ul>{status.job.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details>}
        </div>}
      </section>
    </div>
  </Container>;
}
