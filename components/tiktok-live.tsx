'use client';
import { useEffect, useState } from 'react';
import { tiktokLiveURL } from '../lib/tiktok-live';
import { AppleLiquidGlassButton } from './ui/AppleLiquidGlassButton';
import { AppleLiquidGlassPanel } from './ui/AppleLiquidGlassPanel';

export function TikTokLive() {
  const [accounts, setAccounts] = useState(['Akun TikTok 1', 'Akun TikTok 2']);
  const [account, setAccount] = useState('1');
  const [url, setUrl] = useState('');
  const [live, setLive] = useState<{ url: string; executionId: string; account: number } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [comment, setComment] = useState(''), [minutes, setMinutes] = useState(5);
  const [deadline, setDeadline] = useState<number | null>(null), [reminder, setReminder] = useState(false);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('ath-tiktok-accounts') || 'null'); if (Array.isArray(saved) && saved.length === 2 && saved.every(value => typeof value === 'string')) setAccounts(saved); } catch { /* Keep editable defaults. */ } }, []);
  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => { if (Date.now() >= deadline) { setReminder(true); setDeadline(null); } }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const validInterval = Number.isInteger(minutes) && minutes >= 1 && minutes <= 120;
  return <div className="live-workspace">
    <AppleLiquidGlassPanel className="live-link-panel"><p className="muted">TikTok Live</p><h2>Buka live pilihan Anda</h2><p>Tempel link live lengkap dan pilih akun. n8n menyiapkan link; Anda membukanya pada profil browser yang sesuai.</p>
      <form onSubmit={async e => {
        e.preventDefault(); setError(''); setLive(null);
        try {
          const canonical = tiktokLiveURL(url); setBusy(true);
          const response = await fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'n8n.command', command: `buka live akun ${account} ${canonical}` }), signal: AbortSignal.timeout(100000) });
          const body = await response.json(); if (!response.ok) throw new Error(body.error);
          setLive({ url: body.result.result.url, executionId: body.result.executionId, account: body.result.result.account });
        } catch (e) { setError(e instanceof Error ? e.message : 'Link live gagal disiapkan.'); } finally { setBusy(false); }
      }}>
        <label className="field"><span>Link TikTok live</span><input type="url" required maxLength={500} placeholder="https://www.tiktok.com/@namaakun/live" value={url} onChange={e => setUrl(e.target.value)}/></label>
        <label className="field"><span>Akun untuk live</span><select value={account} onChange={e => setAccount(e.target.value)}>{accounts.map((name, i) => <option key={i} value={String(i + 1)}>{name || `Akun ${i + 1}`}</option>)}</select></label>
        <AppleLiquidGlassButton type="submit" width="auto" loading={busy}>Siapkan live lewat n8n</AppleLiquidGlassButton>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {live && <div className="live-ready" role="status"><p>Execution <strong>{live.executionId}</strong> · {accounts[live.account - 1]}</p><a className="live-open" href={live.url} target="_blank" rel="noreferrer">Buka TikTok live</a><p className="muted">Tautan memakai browser yang membuka ATH. Untuk akun lain, salin link ini ke profil browser akun tersebut.</p></div>}
      <details><summary>Nama dua akun</summary>{accounts.map((name, i) => <label className="field" key={i}><span>Nama akun {i + 1}</span><input maxLength={60} value={name} onChange={e => { const next = accounts.map((value, index) => index === i ? e.target.value : value); setAccounts(next); localStorage.setItem('ath-tiktok-accounts', JSON.stringify(next)); }}/></label>)}</details>
      <p className="muted">Akses otomatis ke profil browser belum tersambung. ATH tidak membaca cookie atau memverifikasi login kedua akun.</p>
    </AppleLiquidGlassPanel>
    <section className="live-comment-panel"><p className="muted">Komentar dengan review</p><h2>Atur pengingat komentar</h2><p>Tulis komentar yang sesuai pembicaraan live. Tinjau dan kirim sendiri di TikTok saat pengingat muncul.</p>
      <label className="field"><span>Draft komentar</span><textarea maxLength={500} value={comment} onChange={e => setComment(e.target.value)} placeholder="Tulis komentar Anda…"/></label>
      <label className="field"><span>Interval pengingat (menit)</span><input type="number" min={1} max={120} step={1} value={Number.isNaN(minutes) ? '' : minutes} disabled={!!deadline} onChange={e => setMinutes(e.target.valueAsNumber)}/></label>
      <div className="live-reminder-actions"><AppleLiquidGlassButton width="auto" disabled={!validInterval || !!deadline} onClick={() => { setReminder(false); setDeadline(Date.now() + minutes * 60000); }}>Mulai pengingat</AppleLiquidGlassButton><button disabled={!deadline && !reminder} onClick={() => { setDeadline(null); setReminder(false); }}>Hentikan</button><button disabled={!comment.trim()} onClick={async () => { try { await navigator.clipboard.writeText(comment); setError(''); } catch { setError('Clipboard tidak tersedia. Salin draft komentar secara manual.'); } }}>Salin komentar</button></div>
      <div role="status" aria-live="polite">{deadline && <p>Pengingat berikutnya: {new Date(deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}. Halaman ini harus tetap terbuka.</p>}{reminder && <div className="comment-reminder"><p>Saatnya meninjau komentar sebelum Anda kirim.</p><button onClick={() => { setReminder(false); setDeadline(Date.now() + minutes * 60000); }}>Ingatkan lagi dalam {minutes} menit</button></div>}</div>
      <p className="muted">Pengiriman tetap manual. Draft otomatis dari konteks live belum tersedia karena model AI dan sumber konteks belum dikonfigurasi.</p>
    </section>
  </div>;
}
