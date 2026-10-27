import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectGroupGmails } from '../scripts/whatsapp-gmails.mjs';
import { gmailsInText } from '../scripts/whatsapp-data.mjs';
test('Gmail copied with chat quote or code formatting has no leading wrapper', () => {
  assert.deepEqual(gmailsInText("`fixture@gmail.com` 'fixture@gmail.com'"), ['fixture@gmail.com']);
});
test('Gmail scan is restricted to selected groups and never assigns email ownership to sender', async () => {
  const calls: string[] = [];
  const progress = { warnings: [] as string[], messagesChecked: 0, emails: 0 };
  const rows = await collectGroupGmails(async (path: string) => {
    calls.push(path);
    return path.includes('offset=0&') ? [{ id: 'msg-1', body: 'Fixture@gmail.com', from: '62811111111@c.us', timestamp: 1700000000 }] : [];
  }, [{ id: '123@g.us', subject: 'Open House Pucung' }, { id: '456@g.us', subject: 'Other' }], progress, async () => {});
  assert.equal(rows.length, 1); assert.equal(rows[0].email, 'fixture@gmail.com'); assert.equal(rows[0].phone, '');
  assert.ok(rows[0].sources[0].includes('msg-1'));
  assert.ok(calls.every(path => path.includes('123%40g.us') && path.includes('downloadMedia=false')));
  assert.equal(progress.messagesChecked, 1);
});
test('repeated message pages warn about incomplete coverage', async () => {
  const progress = { warnings: [] as string[] };
  await collectGroupGmails(async () => [{ id: 'same', body: 'fixture@gmail.com' }], [{ id: '123@g.us', subject: 'Open House Pucung' }], progress, async () => {});
  assert.ok(progress.warnings.some(value => value.includes('berulang')));
});
