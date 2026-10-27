import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db, get, list, save, audit, transaction } from './db.ts';
import { createJob, event, finish } from './jobs.ts';
import { officialURL, runResearch, scoreTopic } from './research.ts';
import { approveDraft, runContent } from './content.ts';
import { applicationBackup, verifyApplicationBackup } from './backups.ts';
import { resolve } from 'node:path';
import { n8nBase, backupDir } from './config.ts';
import { runN8nCommand } from './n8n-commands.ts';

const id = z.string().min(1).max(100).regex(/^[\w-]+$/);
const account = z.enum(['izasadziliandpartners','isolegalofficial']);
const text = z.string().trim().min(1).max(5000);
const scores = z.object({novelty:z.number().int().min(0).max(5),credibility:z.number().int().min(0).max(5),publicInterest:z.number().int().min(0).max(5),audience:z.number().int().min(0).max(5),education:z.number().int().min(0).max(5),clarity:z.number().int().min(0).max(5),practiceFit:z.number().int().min(0).max(5),misinterpretation:z.number().int().min(0).max(5),reputation:z.number().int().min(0).max(5)});
export const actionSchema = z.discriminatedUnion('action', [
  z.object({action:z.literal('brand.save'),account,audience:text,focus:text,tone:text,colors:z.string().max(200)}),
  z.object({action:z.literal('source.save'),name:text,url:z.string().url(),accessConfirmed:z.literal(true)}),
  z.object({action:z.literal('source.toggle'),id,enabled:z.boolean()}),
  z.object({action:z.literal('topic.create'),title:text,facts:text,url:z.string().url(),publisher:text,publicationDate:z.string().max(40).optional(),eventDate:z.string().max(40).optional()}),
  z.object({action:z.literal('topic.review'),id,notes:text,relevance:text,regulationNumber:z.string().max(200),legalValidity:z.enum(['UNKNOWN','VERIFIED_CURRENT','NOT_CURRENT']),scores,confirmed:z.literal(true)}),
  z.object({action:z.literal('research.run'),key:id}),
  z.object({action:z.literal('content.create'),topicId:id,account,format:z.enum(['portrait','square','carousel']),key:id}),
  z.object({action:z.literal('content.edit'),id,revision:z.number().int(),caption:text,hashtags:z.string().max(1000)}),
  z.object({action:z.literal('content.approve'),id,revision:z.number().int(),notes:text,confirmed:z.literal(true)}),
  z.object({action:z.literal('content.revise'),id,revision:z.number().int(),notes:text}),
  z.object({action:z.literal('video.intake'),url:z.string().url().optional(),rights:z.enum(['UNKNOWN','OWNED','LICENSED']),rightsEvidence:z.string().max(2000),caption:text,key:id}),
  z.object({action:z.literal('video.rights'),id,rights:z.enum(['OWNED','LICENSED']),rightsEvidence:text,confirmed:z.literal(true)}),
  z.object({action:z.literal('video.approve'),id,confirmed:z.literal(true)}),
  z.object({action:z.literal('job.retry'),id,confirmed:z.literal(true)}),
  z.object({action:z.literal('job.cancel'),id,confirmed:z.literal(true)}),
  z.object({action:z.literal('notification.read'),id}),
  z.object({action:z.literal('backup.create'),confirmed:z.literal(true)}),
  z.object({action:z.literal('backup.verify'),id}),
  z.object({action:z.literal('workflow.toggle'),id,active:z.boolean(),confirmed:z.literal(true)}),
  z.object({action:z.literal('command'),command:z.string().trim().min(1).max(200)})
  ,z.object({action:z.literal('n8n.command'),command:z.string().trim().min(1).max(600)})
]);
function date(value: string | undefined): string | null {
  if (!value) return null;
  if (!Number.isFinite(Date.parse(value)) || Date.parse(value)>Date.now()) throw new Error('Tanggal sumber tidak valid atau berada di masa depan.');
  return new Date(value).toISOString();
}
export async function executeAction(raw: unknown): Promise<Record<string,unknown>> {
  const a = actionSchema.parse(raw);
  switch (a.action) {
    case 'brand.save': {
      const old = get(a.account,'brand');
      const result = save('brand',{account:a.account,audience:a.audience,focus:a.focus,tone:a.tone,colors:a.colors,status:'CONFIGURED'},a.account);
      audit(a.action,`${a.account}: ${old ? 'updated' : 'created'}`); return result;
    }
    case 'source.save': {
      const url = officialURL(a.url);
      if (list('source').some(s=>s.url===url)) throw new Error('Sumber sudah terdaftar.');
      const result=save('source',{name:a.name,url,enabled:true,accessConfirmed:true,lastChecked:null,lastError:null});
      audit(a.action,String(result.id)); return result;
    }
    case 'source.toggle': {const source=get(a.id,'source'); if(!source) throw new Error('Sumber tidak ditemukan.'); audit(a.action,a.id); return save('source',{...source,enabled:a.enabled},a.id);}
    case 'topic.create': {
      const url=officialURL(a.url);
      if(list('topic').some(t=>t.url===url)) throw new Error('URL topik sudah tersimpan.');
      const result=save('topic',{title:a.title,facts:a.facts,url,publisher:a.publisher,publicationDate:date(a.publicationDate),eventDate:date(a.eventDate),enactmentDate:null,effectiveDate:null,verification:'UNVERIFIED',legalValidity:'UNKNOWN',regulationNumber:'',relevance:'',primarySources:[url],supportingSources:[],discoveredAt:new Date().toISOString(),checkedAt:null,confidence:'NEEDS_REVIEW',score:null,scoreReasons:[],risk:'Fakta input pengguna belum diperiksa reviewer.',reviewNotes:''}); audit(a.action,String(result.id));return result;
    }
    case 'topic.review': {
      const topic=get(a.id,'topic'); if(!topic) throw new Error('Topik tidak ditemukan.');
      const scoring=scoreTopic(a.scores);
      audit(a.action,a.id);
      return save('topic',{...topic,verification:'REVIEWED',verifiedAt:new Date().toISOString(),checkedAt:new Date().toISOString(),reviewer:'local-owner',reviewNotes:a.notes,relevance:a.relevance,regulationNumber:a.regulationNumber,legalValidity:a.legalValidity,score:scoring.score,scoreReasons:scoring.reasons,scoreInputs:a.scores,confidence:'HUMAN_REVIEWED',risk:`Risiko salah tafsir ${a.scores.misinterpretation}/5; reputasi ${a.scores.reputation}/5`},a.id);
    }
    case 'research.run': { const job=createJob('LEGAL_RESEARCH',{},a.key); if(!job.existing) await runResearch(job.id); return job; }
    case 'content.create': { const job=createJob('CONTENT_DRAFT',{topicId:a.topicId,account:a.account,format:a.format},a.key,a.account);if(!job.existing) runContent(job.id,a.topicId,a.account,a.format);return job; }
    case 'content.edit': {
      const draft=get(a.id,'draft');if(!draft||draft.revision!==a.revision) throw new Error('Draft berubah. Muat ulang.');
      if(draft.status==='PUBLISHED') throw new Error('Konten terpublikasi tidak dapat diedit melalui alur ini.');
      return transaction(() => {
        if (draft.jobId && db().prepare('SELECT status FROM jobs WHERE id=?').get(String(draft.jobId))?.status === 'CANCELLED') throw new Error('Job telah dibatalkan. Buat draft baru.');
        const result = save('draft',{...draft,caption:a.caption,hashtags:a.hashtags,revision:a.revision+1,approval:null,status:'READY_FOR_REVIEW',history:[...(draft.history as unknown[]),{action:'EDIT',timestamp:new Date().toISOString(),revision:a.revision+1}]},a.id);
        if (draft.jobId) { event(String(draft.jobId),'Review revisi','WAITING_FOR_APPROVAL','Revisi caption membatalkan persetujuan sebelumnya.'); db().prepare('UPDATE jobs SET finished_at=NULL WHERE id=?').run(String(draft.jobId)); }
        audit(a.action,a.id); return result;
      });
    }
    case 'content.approve': return approveDraft(a.id,a.revision,a.notes);
    case 'content.revise': {
      const draft=get(a.id,'draft');if(!draft||draft.revision!==a.revision) throw new Error('Draft berubah.');
      return transaction(() => {
        if (draft.jobId && db().prepare('SELECT status FROM jobs WHERE id=?').get(String(draft.jobId))?.status === 'CANCELLED') throw new Error('Job telah dibatalkan.');
        const result=save('draft',{...draft,status:'NEEDS_REVISION',approval:null,revision:a.revision+1,history:[...(draft.history as unknown[]),{action:'NEEDS_REVISION',notes:a.notes,timestamp:new Date().toISOString()}]},a.id);
        if (draft.jobId) {event(String(draft.jobId),'Revisi diminta','WAITING_FOR_APPROVAL',a.notes);db().prepare('UPDATE jobs SET finished_at=NULL WHERE id=?').run(String(draft.jobId));}
        audit(a.action,a.id);return result;
      });
    }
    case 'video.intake': {
      if(a.url){const url=new URL(a.url);if(!['youtube.com','www.youtube.com','youtu.be'].includes(url.hostname)||url.protocol!=='https:'||url.username||url.password) throw new Error('Masukkan URL YouTube HTTPS yang valid.');}
      if(a.rights!=='UNKNOWN'&&!a.rightsEvidence.trim()) throw new Error('Catat bukti hak penggunaan.');
      const job=createJob('VIDEO_INTAKE',{url:a.url||null,rights:a.rights},a.key);
      if(job.existing) return job;
      const video=save('video',{url:a.url||null,rights:a.rights,rightsEvidence:a.rightsEvidence,caption:a.caption,status:a.rights==='UNKNOWN'?'NEEDS_PERMISSION':'NEEDS_FILE',assetId:null,metadata:{status:'NEEDS_FILE'},approval:null,jobId:job.id});
      event(job.id,'Hak penggunaan','VALIDATING',a.url?'URL tersimpan. Tidak mengunduh video dari YouTube.':'Intake file lokal dibuat. Menunggu file yang diperoleh secara sah.');
      finish(job.id,{videoId:video.id,next:'Unggah file yang diperoleh secara sah; metadata dan hak akan diperiksa.'},true); audit(a.action,String(video.id));return video;
    }
    case 'video.rights': {
      const video=get(a.id,'video');if(!video)throw new Error('Video tidak ditemukan.');
      return transaction(()=>{
        if(video.jobId&&db().prepare('SELECT status FROM jobs WHERE id=?').get(String(video.jobId))?.status==='CANCELLED')throw new Error('Job video telah dibatalkan. Buat intake baru.');
        const metadata=video.metadata as Record<string,unknown>;
        const result=save('video',{...video,rights:a.rights,rightsEvidence:a.rightsEvidence,approval:null,status:video.assetId?(metadata.status==='VALIDATED'?'READY_FOR_REVIEW':metadata.status):'NEEDS_FILE',rightsHistory:[...((video.rightsHistory as unknown[])||[]),{rights:a.rights,evidence:a.rightsEvidence,reviewer:'local-owner',timestamp:new Date().toISOString()}]},a.id);
        if(video.jobId){event(String(video.jobId),'Review izin penggunaan','WAITING_FOR_APPROVAL','Deklarasi izin dan bukti diperbarui oleh reviewer.');db().prepare('UPDATE jobs SET finished_at=NULL WHERE id=?').run(String(video.jobId));}
        audit(a.action,a.id);return result;
      });
    }
    case 'video.approve': {
      const video=get(a.id,'video');if(!video||video.rights==='UNKNOWN'||!video.rightsEvidence||!video.assetId||(video.metadata as Record<string,unknown>)?.status!=='VALIDATED') throw new Error('Hak, bukti izin, file, dan metadata video harus lengkap.');
      if(video.jobId&&db().prepare('SELECT status FROM jobs WHERE id=?').get(String(video.jobId))?.status==='CANCELLED')throw new Error('Job video telah dibatalkan.');
      audit(a.action,a.id); const result=save('video',{...video,status:'APPROVED',approval:{reviewer:'local-owner',timestamp:new Date().toISOString()}},a.id);if(video.jobId) finish(String(video.jobId),{videoId:a.id,approved:true,published:false});return result;
    }
    case 'job.cancel': {const job=db().prepare('SELECT * FROM jobs WHERE id=?').get(a.id);if(!job||!['QUEUED','UNKNOWN','WAITING_FOR_APPROVAL'].includes(String(job.status))) throw new Error('Job tidak dapat dibatalkan pada status ini.');event(a.id,'Dibatalkan reviewer','CANCELLED','Pembatalan lokal.');db().prepare('UPDATE jobs SET finished_at=? WHERE id=?').run(new Date().toISOString(),a.id);audit(a.action,a.id);return {ok:true};}
    case 'job.retry': {
      const job=db().prepare('SELECT * FROM jobs WHERE id=?').get(a.id); if(!job||!['FAILED','UNKNOWN'].includes(String(job.status))||!['LEGAL_RESEARCH','CONTENT_DRAFT'].includes(String(job.type))) throw new Error('Retry hanya untuk riset/draft yang gagal atau terputus.');
      db().prepare('UPDATE jobs SET retry_count=retry_count+1,error=NULL,finished_at=NULL WHERE id=?').run(a.id);event(a.id,'Retry manual','RETRYING','Diulang atas tindakan reviewer; tidak ada publikasi.');
      const input=JSON.parse(String(job.input)); if(job.type==='LEGAL_RESEARCH') await runResearch(a.id);else runContent(a.id,input.topicId,input.account,input.format);audit(a.action,a.id);return {ok:true};
    }
    case 'notification.read': {const notification=get(a.id,'notification');if(!notification) throw new Error('Notifikasi tidak ditemukan.');return save('notification',{...notification,read:true},a.id);}
    case 'backup.create': return applicationBackup();
    case 'backup.verify': {const record=get(a.id,'backup');if(!record||!/^app-[\w-]+$/.test(String(record.folder))) throw new Error('Backup tidak ditemukan.');const verified=await verifyApplicationBackup(resolve(backupDir,String(record.folder)));audit(a.action,a.id);return save('backup',{...record,verified,verifiedAt:new Date().toISOString()},a.id);}
    case 'workflow.toggle': {
      if(!process.env.N8N_API_KEY) throw new Error('N8N_API_KEY belum dikonfigurasi.');
      const res=await fetch(`${n8nBase()}/api/v1/workflows/${encodeURIComponent(a.id)}/${a.active?'activate':'deactivate'}`,{method:'POST',headers:{'X-N8N-API-KEY':process.env.N8N_API_KEY},signal:AbortSignal.timeout(10000),redirect:'error'});
      if(!res.ok) throw new Error(`n8n API HTTP ${res.status}.`);audit(a.action,`${a.id}: ${a.active}`);return {ok:true,message:'Status diperbarui melalui API. Poll berikutnya akan membaca hasil aktual.'};
    }
    case 'command': {
      const commands:Record<string,string>={'status semua sistem':'overview','cek kesehatan n8n':'diagnostics','diagnosis error terakhir':'logs','tampilkan workflow gagal':'executions','tampilkan job berjalan':'queue','tampilkan riset hukum hari ini':'legal','tampilkan antrean TikTok':'tiktok','tampilkan log terbaru':'logs'};
      const normalized=a.command.trim().replace(/\s+/g,' ').toLowerCase();
      const destination=Object.entries(commands).find(([command])=>command.toLowerCase()===normalized)?.[1];if(!destination) throw new Error('Perintah belum tersedia atau memerlukan pilihan topik/konfirmasi. Gunakan form pada halaman terkait. Shell bebas tidak didukung.');audit(a.action,a.command);return {navigate:destination};
    }
    case 'n8n.command': return runN8nCommand(a.command);
  }
}
