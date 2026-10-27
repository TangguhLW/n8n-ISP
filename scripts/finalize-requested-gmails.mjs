import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { exportScope } from './whatsapp-data.mjs';

const directory = resolve('data/whatsapp');
const outputDirectory = resolve('outputs/01a11ee5-e863-7550-946a-7fb49efefafd');
const lockPath = resolve(directory, 'collector.lock');
const lock = await fs.open(lockPath, 'wx');
await lock.writeFile(String(process.pid));
try {
  const result = JSON.parse(await fs.readFile(resolve(directory, 'requested-gmails.json'), 'utf8'));
  const report = JSON.parse(await fs.readFile(resolve(directory, 'gmail-excel-report.json'), 'utf8'));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.copyFile(resolve(directory, 'e-somasi-whatsapp.xlsx'), resolve(directory, `e-somasi-whatsapp.before-gmail-${stamp}.xlsx`));
  await fs.mkdir(outputDirectory, { recursive: true });
  const output = resolve(outputDirectory, 'template-import-data-debitur-e-somasi-gmail.xlsx');
  await fs.copyFile(resolve(directory, 'e-somasi-whatsapp.gmail.pending.xlsx'), output);
  await fs.copyFile(output, resolve(directory, 'e-somasi-whatsapp.xlsx'));
  let saved = [];
  try {
    const cache = JSON.parse(await fs.readFile(resolve(directory, 'gmails.json'), 'utf8'));
    if (cache.scope === exportScope) saved = cache.records;
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const merged = new Map(saved.map(record => [record.email, record]));
  for (const record of result.records) {
    const old = merged.get(record.email);
    merged.set(record.email, { ...record, sources: [...new Set([...(old?.sources || []), ...record.sources])] });
  }
  await fs.writeFile(resolve(directory, 'gmails.json'), JSON.stringify({ scope: exportScope, records: [...merged.values()], lastExplicitChatScan: result.coverage }, null, 2));
  const request = JSON.parse(await fs.readFile(resolve(directory, 'gmail-target-request.json'), 'utf8'));
  await fs.writeFile(resolve(directory, 'gmail-target-request.json'), JSON.stringify({ ...request, status: 'exported_with_coverage_warning', output, report }, null, 2));
  console.log(JSON.stringify({ exported: true, addedEmails: report.addedEmails, finalRows: report.finalRows, output, coverageWarnings: result.coverage.warnings }));
} finally { await lock.close(); await fs.unlink(lockPath); }
