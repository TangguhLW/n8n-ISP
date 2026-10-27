import fs from 'node:fs/promises';
import { wahaJson } from './whatsapp-api.mjs';
import { mergeRecord } from './whatsapp-data.mjs';
import { collectChatGmails } from './whatsapp-gmails.mjs';

const directory = 'data/whatsapp';
const session = await wahaJson('/api/sessions/default');
if (session.status !== 'WORKING') throw new Error('WhatsApp belum terhubung.');
const index = JSON.parse(await fs.readFile(`${directory}/all-chat-index.json`, 'utf8'));
if (index.received >= 1000) throw new Error('Daftar chat mencapai batas; pagination metadata perlu dilanjutkan.');
const previous = JSON.parse(await fs.readFile(`${directory}/requested-gmails.json`, 'utf8'));
const baseline = new Set(previous.records.map(row => row.email));
const emails = new Map();
let previousCoverage = null;
try {
  const saved = JSON.parse(await fs.readFile(`${directory}/all-gmails.json`, 'utf8'));
  if (saved.coverage.historyWindow === 'up to 100 latest messages per chat; not entire history') previousCoverage = saved.coverage;
  for (const row of saved.records) for (const source of row.sources) mergeRecord(emails, { email: row.email, source, time: row.lastSeen });
} catch (e) { if (e.code !== 'ENOENT') throw e; }
for (const row of [...previous.records, ...index.seedEmails]) {
  for (const source of row.sources) mergeRecord(emails, { email: row.email, source, time: row.lastSeen });
}
const progress = { scope: 'all-available-chats', historyWindow: 'up to 100 latest messages per chat; not entire history', state: 'running', startedAt: new Date().toISOString(), chats: index.chats.length, processed: 0, messagesChecked: 0, emails: emails.size, newEmails: 0, warnings: [], results: [] };
if (previousCoverage) {
  progress.results = previousCoverage.results;
  progress.processed = progress.results.length;
  progress.messagesChecked = previousCoverage.messagesChecked;
  progress.warnings = previousCoverage.warnings;
}
const completed = new Set(progress.results.map(row => row.id));
const pending = index.chats.filter(chat => !completed.has(chat.id));
let next = 0, queue = Promise.resolve();
function save() {
  progress.updatedAt = new Date().toISOString();
  progress.emails = emails.size;
  progress.newEmails = [...emails.keys()].filter(key => !baseline.has(key.replace(/^email:/, ''))).length;
  const text = JSON.stringify({ coverage: progress, records: [...emails.values()].sort((a, b) => a.email.localeCompare(b.email)) }, null, 2);
  queue = queue.then(async () => {
    await fs.writeFile(`${directory}/all-gmails.tmp.json`, text);
    await fs.rename(`${directory}/all-gmails.tmp.json`, `${directory}/all-gmails.json`);
  });
  return queue;
}
await save();
async function worker() {
  while (next < pending.length) {
    const chat = pending[next++];
    const local = { warnings: [], emails: 0, messagesChecked: 0 };
    const found = await collectChatGmails(wahaJson, [chat], local, async () => {}, { pageSize: 100, maxPages: 1, firstPageOnly: true });
    for (const row of found) for (const source of row.sources) mergeRecord(emails, { email: row.email, source, time: row.lastSeen });
    progress.processed++;
    progress.messagesChecked += local.messagesChecked;
    progress.warnings.push(...local.warnings);
    progress.results.push({ id: chat.id, name: chat.name, messagesChecked: local.messagesChecked, emails: found.length, warnings: local.warnings });
    await save();
    if (progress.processed % 10 === 0 || progress.processed === progress.chats) console.log(JSON.stringify({ processed: progress.processed, chats: progress.chats, messages: progress.messagesChecked, emails: progress.emails, newEmails: progress.newEmails, warnings: progress.warnings.length }));
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
progress.state = progress.warnings.length ? 'partial' : 'completed';
await save();
const records = [...emails.values()].sort((a, b) => a.email.localeCompare(b.email));
await fs.writeFile(`${directory}/all-gmails.txt`, records.map(row => row.email).join('\n') + '\n');
await fs.writeFile(`${directory}/new-gmails.txt`, records.filter(row => !baseline.has(row.email)).map(row => row.email).join('\n') + '\n');
console.log(JSON.stringify({ state: progress.state, processed: progress.processed, chats: progress.chats, messages: progress.messagesChecked, emails: progress.emails, newEmails: progress.newEmails, warnings: progress.warnings.length }));
