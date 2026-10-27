import { z } from 'zod';
import { dispatchAuthorized, operations } from '@/lib/n8n-commands';
import { health, n8nList } from '@/lib/integrations';
import { audit, list, jobs } from '@/lib/db';
import { jsonBody } from '@/lib/http';
import { redact } from '@/lib/security';
import { tiktokLiveURL } from '@/lib/tiktok-live';
export const runtime = 'nodejs';
const schema = z.object({ operation: z.enum(operations), requestId: z.string().uuid(), payload: z.object({ url: z.string().max(500), account: z.number().int().min(1).max(2) }).optional() });
export async function POST(request: Request) {
  if (!dispatchAuthorized(request)) return Response.json({ error: 'Token ditolak.' }, { status: 401 });
  try {
    const input = schema.parse(await jsonBody(request));
    let result: unknown;
    switch (input.operation) {
      case 'health': result = await health(); break;
      case 'workflows': result = await n8nList('workflows'); break;
      case 'failures': {
        const executions = await n8nList('executions');
        result = { ...executions, data: (executions.data as Record<string, unknown>[]).filter(row => ['error', 'crashed'].includes(String(row.status))) }; break;
      }
      case 'whatsapp': result = await (await import('@/lib/whatsapp')).startCollection(); break;
      case 'gmail': result = await (await import('@/lib/whatsapp')).startCollection(true); break;
      case 'research': {
        if (!list('source').some(source => source.enabled)) { result = { state: 'needs_configuration', message: 'Tambahkan dan aktifkan feed resmi di Legal Intelligence terlebih dahulu.' }; break; }
        const { executeAction } = await import('@/lib/actions');
        const created = await executeAction({ action: 'research.run', key: `n8n-${input.requestId}` });
        const job = jobs().find(row => row.id === created.id);
        if (job?.status === 'FAILED') throw new Error(String(job.error || 'Riset gagal. Periksa sumber feed.'));
        result = job || created; break;
      }
      case 'live': {
        if (!input.payload) throw new Error('Link live dan pilihan akun diperlukan.');
        result = { state: 'ready_to_open', url: tiktokLiveURL(input.payload.url), account: input.payload.account, message: 'Link siap. Buka di browser dengan profil akun yang dipilih. ATH tidak memverifikasi sesi login TikTok.' }; break;
      }
    }
    if (result && typeof result === 'object' && 'status' in result && (result as { status: string }).status === 'ERROR') throw new Error(String((result as Record<string, unknown>).message));
    audit('n8n.command', `${input.operation}: ${input.requestId}`);
    return Response.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return Response.json({ error: redact(e instanceof Error ? e.message : e) }, { status: 400 }); }
}
