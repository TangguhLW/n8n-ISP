export async function waha(path, options = {}) {
  const base = new URL(process.env.WAHA_BASE_URL || 'http://127.0.0.1:3002');
  if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:' || base.username || base.password || base.pathname !== '/') throw new Error('WAHA harus lokal.');
  if (!process.env.WAHA_API_KEY) throw new Error('Konfigurasi WhatsApp belum tersedia.');
  const response = await fetch(`${base.origin}${path}`, {
    ...options, headers: { 'X-Api-Key': process.env.WAHA_API_KEY, Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(90000), redirect: 'error', cache: 'no-store'
  });
  if (!response.ok) throw new Error(`WAHA HTTP ${response.status}`);
  return response;
}
export async function wahaJson(path, options) {
  const response = await waha(path, options);
  const reader = response.body.getReader();
  const parts = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 20_000_000) { await reader.cancel(); throw new Error('Respons WAHA terlalu besar.'); }
    parts.push(value);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
