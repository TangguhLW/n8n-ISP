import { z } from 'zod';
import { allowLogin, makeSession, originAllowed, sessionCookie, verifyPassword, resetLoginAttempts } from '@/lib/security';
import { audit } from '@/lib/db';
import { jsonBody } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!originAllowed(request)) return Response.json({error: 'Origin tidak diizinkan.'}, {status:403});
  try {
    if (!allowLogin()) return Response.json({error:'Terlalu banyak percobaan. Tunggu 15 menit.'}, {status:429});
    const { password } = z.object({password:z.string().min(1).max(200)}).parse(await jsonBody(request));
    if (!verifyPassword(password)) return Response.json({error:'Password tidak cocok. Lihat data/bootstrap-password.txt di laptop.'}, {status:401});
    resetLoginAttempts();
    audit('session.login', 'Owner lokal masuk.');
    return Response.json({ok:true}, {headers: {'Set-Cookie':sessionCookie(makeSession()), 'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Login belum dikonfigurasi atau input tidak valid. Jalankan npm run setup.'}, {status:400}); }
}
export async function DELETE(request: Request) {
  if (!originAllowed(request)) return Response.json({error:'Origin ditolak.'}, {status:403});
  return Response.json({ok:true}, {headers:{'Set-Cookie':sessionCookie('')}});
}
