import fs from 'node:fs/promises';
import { wahaJson } from './whatsapp-api.mjs';
import { contactId } from './whatsapp-data.mjs';
import { collectChatGmails } from './whatsapp-gmails.mjs';

const directory = 'data/whatsapp';
const session = await wahaJson('/api/sessions/default');
if (session.status !== 'WORKING') throw new Error('WhatsApp belum terhubung.');
const selection = JSON.parse(await fs.readFile(`${directory}/gmail-target-resolution.json`, 'utf8'));
const request = JSON.parse(await fs.readFile(`${directory}/gmail-target-request.json`, 'utf8'));
const norm = value => String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
const chats = [];
for (const name of request.chatNames) {
  const resolvedName = request.resolvedAliases?.[name] || name;
  const found = [...selection.exact, ...selection.near].filter(chat => norm(chat.name) === norm(resolvedName));
  if (found.length !== 1) throw new Error(`Nama chat harus cocok tepat satu: ${name} (${found.length} kecocokan).`);
  chats.push(found[0]);
}
if (!session.me?.id) throw new Error('Identitas nomor sendiri belum tersedia.');
chats.push({ id: contactId(session.me.id), name: 'Nomor sendiri' });
const progress = { state: 'running', startedAt: new Date().toISOString(), warnings: [], emails: 0, messagesChecked: 0, targets: chats.map(chat => chat.name) };
const saveStatus = async () => fs.writeFile(`${directory}/gmail-request-status.json`, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }, null, 2));
await saveStatus();
const records = await collectChatGmails(wahaJson, chats, progress, saveStatus);
progress.state = progress.warnings.length ? 'partial' : 'completed';
await fs.writeFile(`${directory}/requested-gmails.json`, JSON.stringify({ records, coverage: progress }, null, 2));
await saveStatus();
console.log(JSON.stringify({ state: progress.state, emails: records.length, messagesChecked: progress.messagesChecked, warnings: progress.warnings, targets: progress.targets }));
