import { authenticated } from '@/lib/security';
import { get } from '@/lib/db';
import { dataDir } from '@/lib/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!authenticated(request)) return new Response('Login diperlukan.',{status:401});
  const {id}=await params;const asset=get(id,'asset');
  if(!asset||!['images','videos'].includes(String(asset.folder))||!/^[-\w]+\.(png|mp4)$/.test(String(asset.file))) return new Response('File tidak ditemukan.',{status:404});
  try {const file=await readFile(resolve(dataDir,String(asset.folder),String(asset.file)));return new Response(file,{headers:{'Content-Type':String(asset.mime),'Cache-Control':'private, no-store','Content-Disposition':`inline; filename="${asset.file}"`}});}
  catch {return new Response('File belum tersedia.',{status:404});}
}
