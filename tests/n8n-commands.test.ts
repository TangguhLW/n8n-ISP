import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseN8nCommand, dispatchAuthorized } from '../lib/n8n-commands.ts';
import { tiktokLiveURL } from '../lib/tiktok-live.ts';

test('commands normalize supported input and reject arbitrary instructions', () => {
  assert.equal(parseN8nCommand('  CEK KESEHATAN N8N ').operation, 'health');
  assert.equal(parseN8nCommand('ambil nomor grup pilihan').operation, 'whatsapp');
  assert.throws(() => parseN8nCommand('hapus seluruh data'));
});
test('dispatch token is required and must match exactly', () => {
  process.env.ATH_N8N_DISPATCH_TOKEN = 'a'.repeat(64);
  assert.equal(dispatchAuthorized(new Request('http://localhost')), false);
  assert.equal(dispatchAuthorized(new Request('http://localhost', { headers: { 'X-ATH-N8N-Dispatch': 'a'.repeat(64) } })), true);
  assert.equal(dispatchAuthorized(new Request('http://localhost', { headers: { 'X-ATH-N8N-Dispatch': 'b'.repeat(64) } })), false);
});
test('live links accept canonical TikTok live only', () => {
  assert.equal(tiktokLiveURL('https://www.tiktok.com/@example/live?share=1'), 'https://www.tiktok.com/@example/live');
  for (const value of ['javascript:alert(1)', 'https://tiktok.com.evil.test/@a/live', 'https://user:pass@www.tiktok.com/@a/live', 'https://www.tiktok.com/@a/video/1', 'https://www.tiktok.com:444/@a/live']) assert.throws(() => tiktokLiveURL(value));
});
