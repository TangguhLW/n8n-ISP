import fs from 'node:fs/promises';
import { wahaJson } from './whatsapp-api.mjs';
import { contactId } from './whatsapp-data.mjs';
const session = await wahaJson('/api/sessions/default');
if (session.status !== 'WORKING') throw new Error('WhatsApp belum terhubung.');
const request = JSON.parse(await fs.readFile('data/whatsapp/gmail-target-request.json', 'utf8'));
const norm = value => String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
const exact = new Map(), near = new Map(), seen = new Set();
let count = 0;
for (let page = 0; page < 100; page++) {
  const rows = await wahaJson(`/api/default/chats?limit=100&offset=${page * 100}&sortBy=id&sortOrder=asc`);
  if (!Array.isArray(rows)) throw new Error('Format metadata chat tidak dikenali.');
  const fingerprint = rows.map(row => contactId(row.id)).join('|');
  if (!rows.length || seen.has(fingerprint)) break;
  seen.add(fingerprint); count += rows.length;
  for (const row of rows) {
    const chat = { id: contactId(row.id), name: row.name || row.subject || '' };
    if (request.chatNames.some(name => norm(name) === norm(chat.name))) exact.set(chat.id, chat);
    else if (/sayang|iza.*partner|isp.*develop/i.test(chat.name)) near.set(chat.id, chat);
  }
  await fs.writeFile('data/whatsapp/gmail-target-resolution.json', JSON.stringify({ self: session.me?.id, exact: [...exact.values()], near: [...near.values()], metadataCount: count }, null, 2));
  console.log(JSON.stringify({ page, metadataCount: count, exact: [...exact.values()].map(chat => chat.name), near: [...near.values()].map(chat => chat.name) }));
  if (rows.length < 100 || request.chatNames.every(name => [...exact.values()].some(chat => norm(chat.name) === norm(name)))) break;
}
