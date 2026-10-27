import { contactId, phoneFromId, selectedGroup, mergeRecord } from './whatsapp-data.mjs';

function list(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Object.keys(data).every(k => k.endsWith('@g.us'))) return Object.entries(data).map(([id, value]) => ({ ...value, id: value.id || id }));
  throw new Error('Format daftar grup WAHA tidak dikenali.');
}
export async function collectSelectedGroups(api, progress, saveStatus) {
  const groups = [], seenPages = new Set();
  for (let page = 0; page < 1000; page++) {
    const batch = list(await api(`/api/default/groups?exclude=participants&sortBy=id&sortOrder=asc&limit=100&offset=${page * 100}`));
    if (!batch.length) break;
    const fingerprint = batch.map(g => contactId(g.id)).join('|');
    if (seenPages.has(fingerprint)) throw new Error('Pagination daftar grup mengulang halaman.');
    seenPages.add(fingerprint);
    groups.push(...batch.filter(g => contactId(g.id).endsWith('@g.us') && selectedGroup(g.subject || g.name)));
    if (batch.length < 100) break;
    if (page === 999) throw new Error('Daftar grup melebihi batas pemeriksaan.');
  }
  if (!groups.length) throw new Error('Grup yang Anda sebutkan belum ditemukan pada akun ini.');
  groups.sort((a, b) => String(a.subject || a.name).localeCompare(String(b.subject || b.name), 'id'));
  progress.groups = groups.length;
  const members = new Map(), records = new Map();
  for (const group of groups) {
    const id = contactId(group.id), name = group.subject || group.name;
    const target = { name, participants: 0, state: 'read' };
    try {
      const participants = list(await api(`/api/default/groups/${encodeURIComponent(id)}/participants/v2`)).filter(p => p.role !== 'left');
      target.participants = participants.length;
      for (const p of participants) {
        const memberId = contactId(p.id);
        if (!memberId) continue;
        const entry = members.get(memberId) || { id: memberId, name: p.name || '', groups: new Set() };
        entry.groups.add(name); members.set(memberId, entry);
      }
    } catch (e) { target.state = 'partial'; progress.warnings.push(`Peserta grup ${name}: ${e.message}`); }
    progress.targets.push(target); progress.processedGroups++;
    await saveStatus();
  }
  const selectedMembers = [...members.values()];
  for (let start = 0; start < selectedMembers.length; start += 4) {
    await Promise.all(selectedMembers.slice(start, start + 4).map(async member => {
      let phone = phoneFromId(member.id);
      if (!phone && member.id.endsWith('@lid')) {
        try {
          const mapping = await api(`/api/default/lids/${encodeURIComponent(member.id)}`);
          phone = phoneFromId(mapping?.pn);
        } catch { /* Unavailable mappings remain explicitly unresolved. */ }
      }
      if (!phone) { progress.unresolved++; return; }
      let contact = null;
      try { contact = await api(`/api/contacts?session=default&contactId=${encodeURIComponent(`${phone}@c.us`)}`); }
      catch { /* The participant number is usable even when its name is unavailable. */ }
      for (const groupName of [...member.groups].sort((a, b) => a.localeCompare(b, 'id'))) {
        mergeRecord(records, { phone, name: contact?.name || contact?.pushname || member.name, saved: contact?.isMyContact,
          source: groupName, time: progress.startedAt });
      }
    }));
    progress.contacts = records.size;
    await saveStatus();
  }
  if (progress.unresolved) progress.warnings.push(`${progress.unresolved} identitas peserta belum menyediakan nomor telepon. Nomornya tidak ditebak.`);
  for (const name of ['Open House Pucung', 'PSS Panco Sports Society', 'Grup gabut anak panco']) {
    const normalized = name.toLowerCase();
    if (!groups.some(g => String(g.subject || g.name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized)) progress.warnings.push(`Grup ${name} belum ditemukan.`);
  }
  return { records: [...records.values()].sort((a, b) => a.phone.localeCompare(b.phone)), groups };
}
