import { authenticated } from '@/lib/security';
import { list, jobs, db } from '@/lib/db';
import { health, n8nList, dockerLogs } from '@/lib/integrations';
import { officialDomains } from '@/lib/research';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let cached: { at: number; value: Record<string,unknown> } | undefined;
let inflight: Promise<Record<string,unknown>> | undefined;
async function systems() {
  if (cached && Date.now()-cached.at < 30000) return cached.value;
  if (inflight) return inflight;
  inflight = (async () => {
    const [status, workflows, executions] = await Promise.all([health(), n8nList('workflows'), n8nList('executions')]);
    const value = { status, workflows, executions };
    cached = {at:Date.now(),value}; return value;
  })();
  try { return await inflight; } finally { inflight = undefined; }
}
export async function GET(request: Request) {
  if (!authenticated(request)) return Response.json({error:'Login diperlukan.'}, {status:401});
  if (new URL(request.url).searchParams.get('logs') === 'container') return Response.json({logs:await dockerLogs()}, {headers:{'Cache-Control':'no-store'}});
  try {
    const jobCounts = Object.fromEntries(db().prepare('SELECT status, count(*) AS count FROM jobs GROUP BY status').all().map(row => [String(row.status), Number(row.count)]));
    return Response.json({ ...(await systems()), jobs: jobs(), jobCounts, topics:list('topic'), drafts:list('draft'), brands:list('brand'), videos:list('video'), publications:list('publication'), sources:list('source'), notifications:list('notification'), backups:list('backup'), audit:db().prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all(), settings:{timeZone:'Asia/Jakarta', officialDomains, model:process.env.OLLAMA_MODEL || null, social:{instagram:'NEEDS_AUTHORIZATION',tiktok:'NEEDS_PLATFORM_APPROVAL'}, imageMode:'MANUAL_IMPORT'}, checkedAt:new Date().toISOString() }, {headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Database atau konfigurasi lokal bermasalah. Periksa scripts/diagnose.ps1.'}, {status:500}); }
}
