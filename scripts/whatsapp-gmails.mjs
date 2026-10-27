import { contactId, gmailsInText, mergeRecord, selectedGroup } from './whatsapp-data.mjs';

export function collectGroupGmails(api, groups, progress, saveStatus) {
  return collectChatGmails(api, groups.filter(group => contactId(group.id).endsWith('@g.us') && selectedGroup(group.subject || group.name)), progress, saveStatus);
}

export async function collectChatGmails(api, groups, progress, saveStatus, { pageSize = 100, maxPages = 100, firstPageOnly = false } = {}) {
  const emails = new Map();
  progress.messagesChecked = 0;
  for (const group of groups) {
    const id = contactId(group.id), name = group.subject || group.name;
    if (!/^\d+@(g\.us|c\.us|s\.whatsapp\.net|lid)$/.test(id)) throw new Error('ID chat target tidak valid.');
    const seen = new Set();
    try {
      for (let page = 0; page < maxPages; page++) {
        const messages = await api(`/api/default/chats/${encodeURIComponent(id)}/messages?limit=${pageSize}&offset=${page * pageSize}&downloadMedia=false`);
        if (!Array.isArray(messages)) throw new Error('Format pesan tidak dikenali.');
        if (!messages.length) break;
        let fresh = 0;
        for (const message of messages) {
          const messageId = contactId(message.id);
          if (!messageId) throw new Error('Pesan tanpa ID; pagination tidak dapat diverifikasi.');
          if (seen.has(messageId)) continue;
          seen.add(messageId); fresh++; progress.messagesChecked++;
          const stamp = Number(message.timestamp) * 1000;
          const time = Number.isFinite(stamp) && !Number.isNaN(new Date(stamp).getTime()) ? new Date(stamp).toISOString() : '';
          const text = [message.body, message.vcard, ...(Array.isArray(message.vcards) ? message.vcards : [])].filter(value => typeof value === 'string').join('\n');
          for (const email of gmailsInText(text)) {
            mergeRecord(emails, { email, source: `${name} | pesan ${messageId}`, time });
          }
        }
        progress.emails = emails.size;
        await saveStatus();
        if (firstPageOnly) break;
        if (!fresh) throw new Error('Halaman pesan berulang; riwayat mungkin belum lengkap.');
        if (page === maxPages - 1) throw new Error(`Batas ${pageSize * maxPages} pesan per chat tercapai; riwayat belum tentu lengkap.`);
      }
    } catch (e) { progress.warnings.push(`Gmail ${name}: ${e.message}`); }
  }
  return [...emails.values()].sort((a, b) => a.email.localeCompare(b.email));
}
