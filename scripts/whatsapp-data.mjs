export function contactId(value) {
  if (typeof value === 'string') return value;
  return value?._serialized || (value?.user && value?.server ? `${value.user}@${value.server}` : '');
}
export function phoneFromId(value, lids = new Map()) {
  let id = contactId(value);
  if (id.endsWith('@lid')) id = contactId(lids.get(id));
  const match = /^(\d{7,15})@(c\.us|s\.whatsapp\.net)$/.exec(id);
  return match?.[1] || '';
}
export function normalizePhone(value) {
  const text = String(value || '').trim();
  if (!/^(?:\+|00)?\d[\d ()-]*\d$/.test(text)) return '';
  let number = text.replace(/[^\d]/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  else if (number.startsWith('08')) number = `62${number.slice(1)}`;
  else if (number.startsWith('8') && number.length >= 10 && number.length <= 12) number = `62${number}`;
  return /^[1-9]\d{6,14}$/.test(number) ? number : '';
}
export function phonesInText(text) {
  const found = new Set();
  const patterns = [/(?:https?:\/\/)?wa\.me\/(\d{7,15})/gi, /(?:phone=)(\d{7,15})/gi,
    /(?<![\w@])(?:\+\d|0062|62|08)[\d ()-]{7,23}\d(?!\w)/g];
  for (const pattern of patterns) for (const match of String(text || '').matchAll(pattern)) {
    const number = normalizePhone(match[1] || match[0]);
    if (number) found.add(number);
  }
  return [...found];
}
export function gmailsInText(text) {
  return [...new Set((String(text || '').match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com\b/gi) || []).map(x => x.replace(/^['`]+/, '').toLowerCase()))];
}
export function cardsInMessage(message) {
  const cards = [];
  const candidates = [message.body, message.vcard, ...(Array.isArray(message.vcards) ? message.vcards : []), ...(Array.isArray(message._data?.vcardList) ? message._data.vcardList : []).map(x => typeof x === 'string' ? x : x.vcard)];
  for (const text of candidates) if (typeof text === 'string') {
    for (const match of text.matchAll(/BEGIN:VCARD[\s\S]*?END:VCARD/gi)) {
      const card = match[0].replace(/\r?\n[ \t]/g, '');
      const name = /^FN(?:;[^:]*)?:(.*)$/mi.exec(card)?.[1]?.trim() || '';
      const emails = gmailsInText(card);
      for (const tel of card.matchAll(/^TEL(?:;[^:]*)?:(.*)$/gmi)) {
        const phone = normalizePhone(tel[1]);
        if (phone) cards.push({ phone, name, email: emails.length === 1 ? emails[0] : '' });
      }
    }
  }
  return cards;
}
export const exportScope = 'selected-group-participants-v1';
export function selectedGroup(name) {
  const n = String(name || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return ['open house pucung', 'pss panco sports society', 'grup gabut anak panco'].includes(n) || /\bisp\b/.test(n);
}
/** @param {Map<string, any>} map @param {{phone?: string, email?: string, name?: string, saved?: boolean|null, source?: string, time?: string}} input */
export function mergeRecord(map, { phone = '', email = '', name = '', saved = null, source = '', time = '' }) {
  if (!phone && !email) return;
  const key = phone ? `phone:${phone}` : `email:${email.toLowerCase()}`;
  const old = map.get(key) || { phone, email, name: '', saved: null, sources: [], firstSeen: time, lastSeen: time };
  if (name && (!old.name || saved === true)) old.name = name;
  if (email && !old.email) old.email = email;
  if (saved === true || old.saved === null && saved === false) old.saved = saved;
  if (source && !old.sources.includes(source)) old.sources.push(source);
  if (time) { if (!old.firstSeen || time < old.firstSeen) old.firstSeen = time; if (!old.lastSeen || time > old.lastSeen) old.lastSeen = time; }
  map.set(key, old);
}
export function excelText(value) {
  const text = String(value ?? '');
  return /^\s*[=+@-]/.test(text) ? `'${text}` : text;
}
export function toCsv(rows) {
  return '\uFEFF' + rows.map(row => row.map(value => `"${excelText(value).replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
}
export function templateRows(records) {
  return records.map((r, i) => [`TEST-WA-${String(i + 1).padStart(6, '0')}`, r.name || '', '', '', '', '', r.phone, r.email,
    '', '', '', '', '', '', '', '', '', `Testing e-somasi. Grup: ${r.sources.join('; ')}`.slice(0, 32000), ''].map(excelText));
}
