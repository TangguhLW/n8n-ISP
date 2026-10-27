'use client';
import { useState } from 'react';
import { AppleLiquidGlassButton } from './ui/AppleLiquidGlassButton';
const examples = ['cek kesehatan n8n', 'daftar workflow', 'tampilkan workflow gagal', 'ambil nomor grup pilihan', 'cari gmail grup pilihan', 'jalankan riset hukum'];
const navigationCommands = ['status semua sistem', 'diagnosis error terakhir', 'tampilkan job berjalan', 'tampilkan riset hukum hari ini', 'tampilkan antrean tiktok', 'tampilkan log terbaru'];
export function N8nCommand({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ executionId?: string; result?: unknown } | null>(null);
  return <section className="n8n-command-section"><h2>Command center</h2><p>Ketik perintah untuk menjalankan workflow n8n. Hasil dan ID execution muncul di sini.</p>
    <form className="command-input" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError(''); setResult(null);
      try {
        const response = await fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: navigationCommands.includes(command.trim().replace(/\s+/g, ' ').toLowerCase()) ? 'command' : 'n8n.command', command }), signal: AbortSignal.timeout(100000) });
        const body = await response.json(); if (!response.ok) throw new Error(body.error);
        if (body.result.navigate) onNavigate(body.result.navigate); else setResult(body.result);
      } catch (e) { setError(e instanceof Error ? e.message : 'Perintah gagal.'); } finally { setBusy(false); }
    }}>
      <label className="field"><span>Perintah</span><input value={command} onChange={e => setCommand(e.target.value)} name="command" placeholder="cek kesehatan n8n" required maxLength={600} disabled={busy}/></label>
      <AppleLiquidGlassButton type="submit" loading={busy} width="auto">Jalankan perintah</AppleLiquidGlassButton>
    </form>
    <details className="command-examples"><summary>Perintah yang tersedia</summary><div>{examples.map(example => <button key={example} disabled={busy} onClick={() => setCommand(example)}>{example}</button>)}</div><p className="muted">Untuk live: buka live akun 1 https://www.tiktok.com/@namaakun/live. Perintah bebas dengan AI belum dikonfigurasi.</p></details>
    {busy && <p role="status">Menunggu hasil n8n… Jangan kirim ulang sebelum status muncul.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className="command-result" role="status"><p>Execution n8n <strong>{result.executionId}</strong></p><pre>{JSON.stringify(result.result, null, 2)}</pre><p className="muted">Untuk pengambilan WhatsApp, status running berarti pengambilan dimulai; hasil akhir tersedia di WhatsApp QR.</p></div>}
  </section>;
}
