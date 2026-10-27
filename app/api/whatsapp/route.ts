import { authenticated, originAllowed, redact } from '@/lib/security';
import { jsonBody } from '@/lib/http';
import { whatsappStatus, prepareQr, qrImage, startCollection, exportFile } from '@/lib/whatsapp';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!authenticated(request)) return Response.json({ error: 'Login ATH diperlukan.' }, { status: 401 });
  try {
    const mode = new URL(request.url).searchParams.get('mode');
    if (mode === 'qr') return await qrImage();
    if (mode === 'download') return await exportFile();
    return Response.json(await whatsappStatus(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return Response.json({ error: redact(e instanceof Error ? e.message : e) }, { status: 400 }); }
}
export async function POST(request: Request) {
  if (!authenticated(request)) return Response.json({ error: 'Login ATH diperlukan.' }, { status: 401 });
  if (!originAllowed(request)) return Response.json({ error: 'Origin ditolak.' }, { status: 403 });
  try {
    const body = await jsonBody(request) as { action?: string };
    const result = body.action === 'qr' ? await prepareQr() : body.action === 'collect' ? await startCollection() : null;
    if (!result) throw new Error('Aksi tidak dikenal.');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return Response.json({ error: redact(e instanceof Error ? e.message : e) }, { status: 400 }); }
}
