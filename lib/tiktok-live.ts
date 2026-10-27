export function tiktokLiveURL(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || !['tiktok.com', 'www.tiktok.com'].includes(url.hostname) || url.port || url.username || url.password || !/^\/@[\w.]{1,24}\/live\/?$/.test(url.pathname)) {
    throw new Error('Gunakan link live lengkap: https://www.tiktok.com/@namaakun/live.');
  }
  return `https://www.tiktok.com${url.pathname.replace(/\/$/, '')}`;
}
