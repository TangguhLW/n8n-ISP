import { syncAuthorized, startCollection } from '@/lib/whatsapp';
import { redact } from '@/lib/security';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!syncAuthorized(request)) return Response.json({ error: 'Token ditolak.' }, { status: 401 });
  try { return Response.json(await startCollection(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (e) { return Response.json({ error: redact(e instanceof Error ? e.message : e) }, { status: 503 }); }
}
