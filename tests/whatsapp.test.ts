import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneFromId, normalizePhone, phonesInText, cardsInMessage, gmailsInText, mergeRecord, selectedGroup, templateRows, toCsv } from '../scripts/whatsapp-data.mjs';
import { collectSelectedGroups } from '../scripts/whatsapp-groups.mjs';

test('WhatsApp IDs never turn group or unresolved LID into phone numbers', () => {
  assert.equal(phoneFromId('123456789@g.us'), '');
  assert.equal(phoneFromId('123456789@lid'), '');
  assert.equal(phoneFromId('123456789@lid', new Map([['123456789@lid', '6281234567890@c.us']])), '6281234567890');
  assert.equal(phoneFromId({ _serialized: '6281234567890@c.us' }), '6281234567890');
});
test('Phone normalization and shared vCards preserve phone and name association', () => {
  assert.equal(normalizePhone('0812-3456-7890'), '6281234567890');
  assert.equal(normalizePhone('123@lid'), '');
  assert.deepEqual(phonesInText('Hubungi https://wa.me/6281234567890 atau +62 813-4567-8901'), ['6281234567890', '6281345678901']);
  assert.deepEqual(cardsInMessage({ body: 'BEGIN:VCARD\nFN:Kontak fixture\nTEL;TYPE=CELL:0812-3456-7890\nEMAIL:fixture@gmail.com\nEND:VCARD' }), [{ phone: '6281234567890', name: 'Kontak fixture', email: 'fixture@gmail.com' }]);
});
test('Only named groups and ISP groups are matched', () => {
  for (const name of ['Open House Pucung💪', 'PSS (Panco Sports Society)', 'Grup gabut anak panco', 'ISP Developer', 'Konten ISP']) assert.equal(selectedGroup(name), true, name);
  for (const name of ['Keluarga', 'Mas ook', 'pak iza sadzili s.h m.h', 'Open House Pucung lama', 'wispa']) assert.equal(selectedGroup(name), false, name);
});

test('Group collector reads only selected participants, deduplicates and resolves actual LID mappings', async () => {
  const calls: string[] = [];
  const fixtures: Record<string, unknown> = {
    '/api/default/groups/one%40g.us/participants/v2': [{ id: '6280000000001@c.us' }, { id: '123456789@lid' }],
    '/api/default/groups/two%40g.us/participants/v2': [{ id: '6280000000001@c.us' }, { id: 'unavailable@lid' }],
    '/api/default/groups/isp%40g.us/participants/v2': [{ id: '6280000000002@c.us' }, { id: '6280000000099@c.us', role: 'left' }],
    '/api/default/lids/123456789%40lid': { pn: '6280000000003@c.us' },
    '/api/default/lids/unavailable%40lid': { pn: null }
  };
  const api = async (path: string) => {
    calls.push(path);
    if (path.startsWith('/api/default/groups?')) return [
      { id: 'one@g.us', subject: 'Open House Pucung' }, { id: 'two@g.us', subject: 'PSS (Panco Sports Society)' },
      { id: 'isp@g.us', subject: 'ISP Developer' }, { id: 'other@g.us', subject: 'Keluarga' }, { id: '123@c.us', name: 'ISP personal' }
    ];
    if (path.startsWith('/api/contacts?')) return { name: 'Fixture participant', isMyContact: true };
    if (path in fixtures) return fixtures[path];
    throw new Error(`Unexpected path: ${path}`);
  };
  const progress = { startedAt: '2026-10-09T00:00:00Z', groups: 0, processedGroups: 0, contacts: 0, unresolved: 0, targets: [] as unknown[], warnings: [] as string[] };
  const result = await collectSelectedGroups(api, progress, async () => {});
  assert.deepEqual(result.records.map(r => r.phone), ['6280000000001', '6280000000002', '6280000000003']);
  assert.deepEqual(result.records[0].sources, ['Open House Pucung', 'PSS (Panco Sports Society)']);
  assert.equal(progress.unresolved, 1);
  assert.equal(progress.groups, 3);
  assert.ok(calls.every(p => !p.includes('/messages') && !p.includes('/chats') && !p.includes('/contacts/all') && !p.includes('other%40')));
  assert.ok(result.records.every(r => !r.email));
});
test('Dedup keeps saved names and provenance while unassociated Gmail remains separate', () => {
  const map = new Map();
  mergeRecord(map, { phone: '6281234567890', name: 'Pushname', source: 'group A', time: '2026-01-01' });
  mergeRecord(map, { phone: '6281234567890', name: 'Saved name', saved: true, source: 'group B', time: '2026-02-01' });
  mergeRecord(map, { email: 'fixture@gmail.com', source: 'message', time: '2026-02-01' });
  assert.equal(map.size, 2);
  const record = map.get('phone:6281234567890');
  assert.equal(record.name, 'Saved name'); assert.equal(record.firstSeen, '2026-01-01');
  assert.deepEqual(record.sources, ['group A', 'group B']);
  assert.deepEqual(gmailsInText('Fixture@gmail.com fixture@gmail.com other@example.com'), ['fixture@gmail.com']);
});
test('Template mapping leaves legal facts blank and guards spreadsheet formulas', () => {
  const [row] = templateRows([{ phone: '6281234567890', email: 'fixture@gmail.com', name: '=1+1', saved: false, sources: ['Grup fixture'] }]);
  assert.equal(row.length, 19); assert.equal(row[6], '6281234567890'); assert.equal(row[7], 'fixture@gmail.com');
  assert.equal(row[1], "'=1+1"); assert.deepEqual(row.slice(8, 17), Array(9).fill(''));
  assert.equal(row[2], ''); assert.match(row[17], /Testing e-somasi/);
  assert.match(toCsv([['=SUM(A1)', 'a"b']]), /'=?SUM\(A1\)/); assert.match(toCsv([['a"b']]), /a""b/);
});
