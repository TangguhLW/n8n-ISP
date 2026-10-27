import fs from 'node:fs/promises';
import { collectChatGmails } from './whatsapp-gmails.mjs';
import { mergeRecord } from './whatsapp-data.mjs';
import { wahaJson } from './whatsapp-api.mjs';

const directory = 'data/whatsapp';
const data = JSON.parse(await fs.readFile(`${directory}/all-gmails.json`, 'utf8'));
const previous = JSON.parse(await fs.readFile(`${directory}/requested-gmails.json`, 'utf8'));
const baseline = new Set(previous.records.map(row => row.email));
const targets = data.coverage.results.filter(row => row.messagesChecked >= 100);
const records = new Map();
for (const row of data.records) for (const source of row.sources) mergeRecord(records, { email: row.email, source, time: row.lastSeen });
const review = { state: 'running', pageSize: 300, total: targets.length, processed: 0, messagesReadIncludingOverlap: 0, results: [], warnings: [] };
let next = 0, queue = Promise.resolve();
function save() {
  data.coverage.deeperReview = review;
  data.coverage.emails = records.size;
  data.coverage.newEmails = [...records.values()].filter(row => !baseline.has(row.email)).length;
  data.records = [...records.values()].sort((a, b) => a.email.localeCompare(b.email));
  const snapshot = JSON.stringify(data, null, 2);
  queue = queue.then(async () => {
    await fs.writeFile(`${directory}/all-gmails.deep.tmp.json`, snapshot);
    await fs.rename(`${directory}/all-gmails.deep.tmp.json`, `${directory}/all-gmails.json`);
  });
  return queue;
}
async function worker() {
  while (next < targets.length) {
    const chat = targets[next++], local = { warnings: [], messagesChecked: 0, emails: 0 };
    const found = await collectChatGmails(wahaJson, [chat], local, async () => {}, { pageSize: 300, maxPages: 1, firstPageOnly: true });
    for (const row of found) for (const source of row.sources) mergeRecord(records, { email: row.email, source, time: row.lastSeen });
    review.processed++;
    review.messagesReadIncludingOverlap += local.messagesChecked;
    review.warnings.push(...local.warnings);
    review.results.push({ id: chat.id, messagesRead: local.messagesChecked, emails: found.length, warnings: local.warnings });
    await save();
    if (review.processed % 5 === 0 || review.processed === review.total) console.log(JSON.stringify({ deeperProcessed: review.processed, deeperTotal: review.total, emails: data.coverage.emails, newEmails: data.coverage.newEmails, warnings: review.warnings.length }));
  }
}
await save();
await Promise.all(Array.from({ length: 8 }, () => worker()));
review.state = review.warnings.length ? 'partial' : 'completed';
await save();
await fs.writeFile(`${directory}/all-gmails.txt`, data.records.map(row => row.email).join('\n') + '\n');
await fs.writeFile(`${directory}/new-gmails.txt`, data.records.filter(row => !baseline.has(row.email)).map(row => row.email).join('\n') + '\n');
console.log(JSON.stringify({ emails: data.coverage.emails, newEmails: data.coverage.newEmails, deeperProcessed: review.processed, warnings: review.warnings.length }));
