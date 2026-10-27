import { authenticated } from '@/lib/security';
import { get, audit } from '@/lib/db';
import { dataDir } from '@/lib/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!authenticated(request)) return new Response('Login diperlukan.',{status:401});
  const {id}=await params;const draft=get(id,'draft');const video=get(id,'video');
  if(!draft&&!video) return new Response('Paket tidak ditemukan.',{status:404});
  try {
    const record=draft||video!;const files:Record<string,Uint8Array>={'metadata.json':strToU8(JSON.stringify(record,null,2)),'caption.txt':strToU8(`${record.caption}\n\n${record.hashtags||''}`),'STATUS.txt':strToU8(`Status lokal: ${record.status}.\nPaket ini belum dipublikasikan. Persetujuan lokal bukan konfirmasi platform.\n`)};
    if(draft) {
      files['image-prompts.txt']=strToU8((draft.slides as {prompt:string}[]).map((s,i)=>`Slide ${i+1}: ${s.prompt}\nUkuran: ${draft.size}; profil: ${JSON.stringify(draft.brandSnapshot)}`).join('\n\n'));
      for(const entry of draft.assets as {slide:number;assetId:string}[]) {const asset=get(entry.assetId,'asset');if(!asset||asset.folder!=='images'||!/^[-\w]+\.png$/.test(String(asset.file))) throw new Error('Aset tidak valid.');files[`slide-${entry.slide+1}.png`]=await readFile(resolve(dataDir,'images',String(asset.file)));}
    } else if(video?.assetId) {
      const asset=get(String(video.assetId),'asset');if(!asset||asset.folder!=='videos'||!/^[-\w]+\.mp4$/.test(String(asset.file))) throw new Error('Aset tidak valid.');files['video.mp4']=await readFile(resolve(dataDir,'videos',String(asset.file)));
    }
    audit('package.exported',`${id}: ${record.status}`);
    const zip=zipSync(files,{level:0});return new Response(Buffer.from(zip),{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="ath-${id}.zip"`,'Cache-Control':'private, no-store'}});
  } catch {return new Response('Aset paket belum lengkap atau tidak dapat dibaca.',{status:400});}
}
