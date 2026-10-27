import { authenticated, originAllowed, redact } from '@/lib/security';
import { limitedBody } from '@/lib/http';
import { get, save, audit, transaction, db } from '@/lib/db';
import { event } from '@/lib/jobs';
import { dataDir } from '@/lib/config';
import { probeVideo } from '@/lib/integrations';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!authenticated(request)) return Response.json({error:'Login diperlukan.'},{status:401});
  if(!originAllowed(request)) return Response.json({error:'Origin ditolak.'},{status:403});
  try {
    const bytes=await limitedBody(request,70*1024*1024);
    const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:Buffer.from(bytes)}).formData();
    const file=form.get('file'); const recordId=String(form.get('id')||'');const kind=String(form.get('kind')||'');
    if(!(file instanceof File)||!file.size||file.size>64*1024*1024||!/^[-\w]+$/.test(recordId)) throw new Error('File atau ID tidak valid. Batas video 64 MB.');
    const buffer=Buffer.from(await file.arrayBuffer());const assetId=randomUUID();
    if(kind==='image') {
      const draft=get(recordId,'draft');const slide=Number(form.get('slide'));const expectedRevision=Number(form.get('revision'));
      if(!draft||!Number.isInteger(slide)||slide<0||slide>=(draft.slides as unknown[]).length||draft.revision!==expectedRevision) throw new Error('Draft/slide berubah. Muat ulang.');
      if(file.size>10*1024*1024) throw new Error('Gambar maksimal 10 MB.');
      const metadata=await sharp(buffer,{limitInputPixels:25_000_000}).metadata();
      if(!['png','jpeg','webp'].includes(metadata.format||'')) throw new Error('Gunakan PNG, JPEG, atau WebP.');
      const [width,height]=String(draft.size).split('x').map(Number);
      if(metadata.width!==width||metadata.height!==height) throw new Error(`Ukuran slide harus ${width}x${height}.`);
      const output=await sharp(buffer,{limitInputPixels:25_000_000}).rotate().png().toBuffer();
      await mkdir(resolve(dataDir,'images'),{recursive:true});await writeFile(resolve(dataDir,'images',`${assetId}.png`),output,{flag:'wx'});
      try {
        transaction(()=> {
          const latest=get(recordId,'draft');if(!latest||latest.revision!==expectedRevision) throw new Error('Draft berubah selama impor.');
          if(latest.jobId&&db().prepare('SELECT status FROM jobs WHERE id=?').get(String(latest.jobId))?.status==='CANCELLED') throw new Error('Job draft telah dibatalkan.');
          save('asset',{folder:'images',file:`${assetId}.png`,mime:'image/png',width,height,bytes:output.length},assetId);
          const assets=(latest.assets as {slide:number;assetId:string}[]).filter(a=>a.slide!==slide);assets.push({slide,assetId});assets.sort((a,b)=>a.slide-b.slide);
          save('draft',{...latest,assets,revision:expectedRevision+1,status:'READY_FOR_REVIEW',approval:null,history:[...(latest.history as unknown[]),{action:'IMAGE_IMPORTED',slide,timestamp:new Date().toISOString(),revision:expectedRevision+1}]},recordId);
          if(latest.jobId){event(String(latest.jobId),'Review gambar','WAITING_FOR_APPROVAL','Gambar baru membutuhkan review revisi.');db().prepare('UPDATE jobs SET finished_at=NULL WHERE id=?').run(String(latest.jobId));}
          audit('asset.imported',`${assetId}: draft ${recordId}, slide ${slide+1}`);
        });
      } catch(e) {await unlink(resolve(dataDir,'images',`${assetId}.png`));throw e;}
      return Response.json({ok:true,assetId});
    }
    if(kind==='video') {
      const video=get(recordId,'video');if(!video) throw new Error('Video tidak ditemukan.');
      if(buffer.subarray(4,8).toString()!=='ftyp') throw new Error('Unggah file MP4 dengan header yang valid.');
      await mkdir(resolve(dataDir,'videos'),{recursive:true});const path=resolve(dataDir,'videos',`${assetId}.mp4`);await writeFile(path,buffer,{flag:'wx'});
      const metadata=await probeVideo(path);
      save('asset',{folder:'videos',file:`${assetId}.mp4`,mime:'video/mp4',bytes:buffer.length},assetId);
      const current=get(recordId,'video')!;
      save('video',{...current,assetId,metadata,status:current.rights==='UNKNOWN'?'NEEDS_PERMISSION':metadata.status==='VALIDATED'?'READY_FOR_REVIEW':metadata.status,approval:null},recordId);
      audit('video.imported',`${assetId}: video ${recordId}`);return Response.json({ok:true,assetId,metadata});
    }
    throw new Error('Jenis impor tidak tersedia.');
  } catch(e) {return Response.json({error:redact(e instanceof Error?e.message:e)},{status:400});}
}
