import { authenticated, originAllowed, redact } from '@/lib/security';
import { executeAction } from '@/lib/actions';
import { jsonBody } from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!authenticated(request)) return Response.json({error:'Login diperlukan.'},{status:401});
  if(!originAllowed(request)) return Response.json({error:'Origin ditolak.'},{status:403});
  try {return Response.json({ok:true,result:await executeAction(await jsonBody(request))},{headers:{'Cache-Control':'no-store'}});}
  catch(e) {return Response.json({error:redact(e instanceof Error?e.message:e)},{status:400});}
}
