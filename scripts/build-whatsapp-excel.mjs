import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { templateRows } from '../../scripts/whatsapp-data.mjs';

const directory = resolve('data/whatsapp');
const appendRequested = process.argv.includes('--append-requested');
const inputPath = resolve(directory, appendRequested ? 'e-somasi-whatsapp.xlsx' : 'template.xlsx');
const input = await FileBlob.load(inputPath);
let source = input;
if (!process.argv.includes('--inspect')) {
  // The spreadsheet API does not expose unlinking the example's native email hyperlink.
  const parts = unzipSync(await fs.readFile(inputPath));
  parts['xl/worksheets/sheet1.xml'] = strToU8(strFromU8(parts['xl/worksheets/sheet1.xml']).replace(/<hyperlink\b[^>]*\bref="H2"[^>]*\/>/g, ''));
  const bytes = zipSync(parts);
  source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
const workbook = await SpreadsheetFile.importXlsx(source);
if (process.argv.includes('--help-table')) {
  console.log(workbook.help('table.getDataRows', { include: 'index,examples,notes', maxChars: 3500 }).ndjson);
  process.exit(0);
}
if (appendRequested) {
  const payload = JSON.parse(await fs.readFile(resolve(directory, 'requested-gmails.json'), 'utf8'));
  const sheet = workbook.worksheets.getItem('Data Debitur');
  if (sheet.getRange('H1').values[0][0] !== 'Email') throw new Error('Kolom Email berubah.');
  const table = sheet.tables.items.find(item => item.name === 'DataDebiturTable');
  if (!table) throw new Error('Tabel data tidak ditemukan.');
  const dataRows = table.getDataRows();
  const tableValues = Array.isArray(dataRows) ? dataRows : dataRows.values;
  if (!Array.isArray(tableValues)) throw new Error('Format baris tabel tidak dikenali.');
  const original = sheet.getRange(`A2:S${tableValues.length + 1}`).values;
  const existing = new Map(original.map((row, index) => [String(row[7] || '').trim().toLowerCase(), index]));
  const added = [];
  for (const record of payload.records) {
    if (existing.has(record.email.toLowerCase())) continue;
    const display = { ...record, sources: record.sources.slice(0, 5) };
    const row = templateRows([display])[0];
    row[0] = `TEST-GMAIL-${Date.now()}-${added.length + 1}`;
    row[17] = `Gmail ditemukan dalam chat; pemilik belum diverifikasi. Sumber: ${display.sources.join('; ')}${record.sources.length > 5 ? `; dan ${record.sources.length - 5} kemunculan lain (rincian di catatan lokal).` : ''}`.slice(0, 32000);
    added.push(row); existing.set(record.email.toLowerCase(), original.length + added.length - 1);
  }
  if (added.length) {
    table.rows.add(null, added);
    sheet.getRange(`A2:S${original.length + 1}`).values = original;
    const start = original.length + 2, end = start + added.length - 1;
    sheet.getRange(`G${start}:H${end}`).setNumberFormat('@');
    sheet.getRange(`A${start}:S${end}`).format.font = { name: 'Arial', size: 11, color: '#182230' };
    sheet.getRange('H:H').format.columnWidth = 42;
    sheet.getRange(`R${start}:R${end}`).format.wrapText = true;
    sheet.getRange(`A${start}:S${end}`).format.autofitRows();
    const preview = await workbook.render({ sheetName: 'Data Debitur', range: `G${start}:I${Math.min(end, start + 5)}`, scale: 1.2, format: 'png' });
    await fs.writeFile(resolve(directory, 'gmail-result-preview.png'), new Uint8Array(await preview.arrayBuffer()));
  }
  const after = sheet.getRange(`A2:S${original.length + 1}`).values;
  if (JSON.stringify(after) !== JSON.stringify(original)) throw new Error('Data lama berubah; ekspor dibatalkan.');
  workbook.recalculate();
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(resolve(directory, 'e-somasi-whatsapp.gmail.pending.xlsx'));
  await fs.writeFile(resolve(directory, 'gmail-excel-report.json'), JSON.stringify({ existingRows: original.length, addedEmails: added.length, foundEmails: payload.records.length, finalRows: original.length + added.length, coverage: payload.coverage }, null, 2));
  console.log(JSON.stringify({ existingRows: original.length, addedEmails: added.length, foundEmails: payload.records.length, finalRows: original.length + added.length, existingDataPreserved: true }));
  process.exit(0);
}
if (process.argv.includes('--inspect')) {
  console.log((await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 2000 })).ndjson);
  const preview = await workbook.render({ sheetName: 'Data Debitur', range: 'A1:I4', scale: 1.3, format: 'png' });
  await fs.writeFile(resolve(directory, 'template-preview.png'), new Uint8Array(await preview.arrayBuffer()));
  process.exit(0);
}
const verify = process.argv.includes('--verify');
const payload = verify ? { records: [
  { phone: '6280000000001', name: 'Kontak fixture pengujian', email: 'fixture@gmail.com', saved: true, sources: ['Fixture, bukan kontak WhatsApp'] },
  { phone: '', name: '', email: 'fixture2@gmail.com', saved: null, sources: ['Fixture email tanpa nomor'] }
] } : JSON.parse(await fs.readFile(resolve(directory, 'pending.json'), 'utf8'));
if (!payload.records.length) throw new Error('Tidak ada kontak nyata untuk dimasukkan ke Excel.');
const sheet = workbook.worksheets.getItem('Data Debitur');
const headers = sheet.getRange('A1:S1').values[0];
if (headers[6] !== 'No. WhatsApp' || headers[7] !== 'Email' || headers[17] !== 'Catatan Internal') throw new Error('Struktur template berubah.');
sheet.getRange('A2:S2').clear({ applyTo: 'contents' });
const rows = templateRows(payload.records);
const range = sheet.getRange(`A2:S${rows.length + 1}`);
const table = sheet.tables.items.find(t => t.name === 'DataDebiturTable');
if (!table) throw new Error('Tabel DataDebiturTable tidak ditemukan.');
table.getDataRows().values = [rows[0]];
if (rows.length > 1) table.rows.add(null, rows.slice(1));
range.values = rows;
range.format.fill = '#FFFFFF';
range.format.font = { name: 'Arial', size: 11, color: '#182230' };
range.format.rowHeight = 34;
sheet.getRange(`A2:A${rows.length + 1}`).setNumberFormat('@');
sheet.getRange(`G2:G${rows.length + 1}`).setNumberFormat('0');
sheet.getRange(`H2:H${rows.length + 1}`).setNumberFormat('@');
sheet.getRange('A:A').format.columnWidth = 23;
sheet.getRange('B:B').format.columnWidth = 32;
sheet.getRange('G:G').format.columnWidth = 23;
sheet.getRange('R:R').format.columnWidth = 65;
sheet.getRange(`B2:B${rows.length + 1}`).format.wrapText = true;
sheet.getRange(`R2:R${rows.length + 1}`).format.wrapText = true;
range.format.autofitRows();
if (rows.length > 998) sheet.getRange(`Q1000:Q${rows.length + 1}`).dataValidation = { rule: { type: 'list', values: ['Aktif', 'Dalam Penagihan', 'Restrukturisasi'] } };
workbook.recalculate();
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?', options: { useRegex: true, maxResults: 10 }, maxChars: 1500 });
const preview = await workbook.render({ sheetName: 'Data Debitur', range: `A1:I${Math.min(rows.length + 1, 7)}`, scale: 1.3, format: 'png' });
await fs.writeFile(resolve(directory, verify ? 'fixture-preview.png' : 'result-preview.png'), new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(resolve(directory, verify ? 'fixture.xlsx' : 'e-somasi-whatsapp.pending.xlsx'));
console.log(JSON.stringify({ rows: rows.length, columns: headers.length, sheetNamesPreserved: true, errors: errors.ndjson }));
