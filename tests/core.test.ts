import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const testRoot=mkdtempSync(resolve(tmpdir(),'ath-core-'));
process.env.ATH_DATA_DIR=testRoot;
process.env.ATH_BACKUP_DIR=resolve(testRoot,'backups');
process.env.ATH_SESSION_SECRET=randomBytes(32).toString('hex');
const salt=randomBytes(16).toString('hex');
process.env.ATH_ADMIN_PASSWORD_HASH=`${salt}:${scryptSync('test-only-password',salt,64).toString('hex')}`;
const { db, get, save, jobs }=await import('../lib/db.ts');
const { createJob, event, reconcile }=await import('../lib/jobs.ts');
const { officialURL, scoreTopic }=await import('../lib/research.ts');
const { authenticated, originAllowed, makeSession, verifyPassword, sessionCookie, redact }=await import('../lib/security.ts');
const { executeAction }=await import('../lib/actions.ts');
const { approveDraft }=await import('../lib/content.ts');
const { limitedBody }=await import('../lib/http.ts');
const { localBase }=await import('../lib/config.ts');
const { applicationBackup, verifyApplicationBackup }=await import('../lib/backups.ts');
test('successful login resets attempts while repeated failures remain limited', async () => {
  const security = await import('../lib/security.ts');
  db().prepare('DELETE FROM login_attempts').run();
  for (let i = 0; i < 9; i++) assert.equal(security.allowLogin(), true);
  security.resetLoginAttempts();
  for (let i = 0; i < 10; i++) assert.equal(security.allowLogin(), true);
  assert.equal(security.allowLogin(), false);
});
test('legacy navigation commands accept capitalization and surrounding spaces', async () => {
  assert.deepEqual(await executeAction({ action: 'command', command: '  TAMPILKAN ANTREAN TIKTOK  ' }), { navigate: 'tiktok' });
});
after(()=>{db().close();rmSync(testRoot,{recursive:true,force:true});});

test('URL sumber menolak host palsu, private IP, kredensial, protokol dan port alternatif',()=>{
  assert.equal(officialURL('https://www.mkri.id/berita'),'https://www.mkri.id/berita');
  for(const url of ['http://mkri.id','https://mkri.id.evil.test/','https://127.0.0.1/','https://u:p@mkri.id/','https://mkri.id:8443/'])assert.throws(()=>officialURL(url));
  assert.throws(()=>localBase('http://169.254.169.254','http://localhost:1'));
});
test('idempotency mengembalikan job yang sama dan tidak menambah job',()=>{
  const a=createJob('LEGAL_RESEARCH',{},'same-input');const b=createJob('LEGAL_RESEARCH',{},'same-input');assert.equal(a.id,b.id);assert.equal(b.existing,true);assert.equal(jobs().length,1);
});
test('restart menandai job terputus UNKNOWN tanpa menjalankan ulang',()=>{
  const job=createJob('CONTENT_DRAFT',{},'interrupt');event(job.id,'Pembuatan','RUNNING','Mulai');assert.equal(reconcile(),1);assert.equal(jobs().find(j=>j.id===job.id)?.status,'UNKNOWN');assert.equal(reconcile(),0);
});
test('penilaian transparan, mengurangi risiko dan dibatasi 0..100',()=>{
  const high=scoreTopic({novelty:5,credibility:5,publicInterest:5,audience:5,education:5,clarity:5,practiceFit:5});const risk=scoreTopic({novelty:5,misinterpretation:5,reputation:5});assert.equal(high.score,100);assert.equal(risk.score,0);assert.match(high.reasons.at(-1)! ,/bukan prediksi viralitas/);
});
test('session hanya menerima cookie sah dan Host lokal',()=>{
  const cookie=sessionCookie(makeSession());assert.equal(authenticated(new Request('http://localhost:3000',{headers:{host:'localhost:3000',cookie}})),true);assert.equal(authenticated(new Request('http://localhost:3000',{headers:{host:'evil.test',cookie}})),false);assert.equal(authenticated(new Request('http://localhost:3000',{headers:{host:'localhost:3000',cookie:cookie.replace('ath_session=','ath_session=x')}})),false);assert.equal(verifyPassword('test-only-password'),true);assert.equal(verifyPassword('wrong'),false);
});
test('CSRF mengharuskan same-origin pada mutasi',()=>{
  assert.equal(originAllowed(new Request('http://localhost:3000',{headers:{host:'localhost:3000',origin:'http://evil.test'}})),false);assert.equal(originAllowed(new Request('http://localhost:3000',{headers:{host:'localhost:3000'}})),false);assert.equal(originAllowed(new Request('http://localhost:3000',{headers:{host:'localhost:3000',origin:'http://localhost:3000'}})),true);
});
test('input streaming melebihi ukuran ditolak meskipun Content-Length tidak diisi',async()=>{await assert.rejects(()=>limitedBody(new Request('http://localhost',{method:'POST',body:'x'.repeat(100)}),50),/ukuran/);});
test('perintah shell dan tindakan publish tidak ada pada allowlist',async()=>{
  await assert.rejects(()=>executeAction({action:'command',command:'powershell Remove-Item C:\\'}),/belum tersedia/);await assert.rejects(()=>executeAction({action:'publish',account:'izasadziliandpartners'}));
});
test('brand kedua akun tersimpan terpisah',async()=>{
  await executeAction({action:'brand.save',account:'izasadziliandpartners',audience:'Test audience',focus:'Test focus',tone:'Formal',colors:''});assert.equal(get('izasadziliandpartners','brand')?.status,'CONFIGURED');assert.equal(get('isolegalofficial','brand')?.status,'NEEDS_CONFIGURATION');
});
test('draft tidak bisa disetujui tanpa review primer, gambar aktual, atau revisi yang tepat',()=>{
  const topic=save('topic',{title:'Test-only',verification:'UNVERIFIED'});const draft=save('draft',{topicId:topic.id,revision:1,status:'READY_FOR_REVIEW',slides:[{}],assets:[],history:[]});
  assert.throws(()=>approveDraft(String(draft.id),0,'test'),/berubah/);assert.throws(()=>approveDraft(String(draft.id),1,'test'),/sumber primer/);
  save('topic',{...topic,verification:'REVIEWED'},String(topic.id));assert.throws(()=>approveDraft(String(draft.id),1,'test'),/setiap slide/);
  const asset=save('asset',{folder:'images',file:'test.png'});save('draft',{...draft,assets:[{slide:0,assetId:asset.id}]},String(draft.id));assert.throws(()=>approveDraft(String(draft.id),1,'test'),/belum tersedia/);
  mkdirSync(resolve(testRoot,'images'),{recursive:true});writeFileSync(resolve(testRoot,'images','test.png'),'test fixture');assert.equal(approveDraft(String(draft.id),1,'review').status,'APPROVED');
});
test('riset tanpa konfigurasi gagal dengan alasan nyata, bukan kandidat demo',async()=>{
  const result=await executeAction({action:'research.run',key:'no-source'});const job=jobs().find(j=>j.id===result.id);assert.equal(job?.status,'FAILED');assert.match(String(job?.error),/NEEDS_CONFIGURATION/);
});
test('redaksi mengganti nilai rahasia aktual',()=>{assert.ok(!redact(`secret ${process.env.ATH_SESSION_SECRET}`).includes(process.env.ATH_SESSION_SECRET!));});
test('snapshot aplikasi dapat direstore terpisah dan mendeteksi aset yang diubah',async()=>{
  const record=await applicationBackup();assert.equal(record.verified,true);
  const source=resolve(testRoot,'backups',String(record.folder));const target=resolve(testRoot,'isolated-restore');cpSync(source,target,{recursive:true,errorOnExist:true,force:false});
  assert.equal(await verifyApplicationBackup(target),true);
  const { DatabaseSync }=await import('node:sqlite');const restored=new DatabaseSync(resolve(target,'ath.sqlite'),{readOnly:true});
  try{assert.equal(restored.prepare('SELECT count(*) AS n FROM jobs').get()?.n,db().prepare('SELECT count(*) AS n FROM jobs').get()?.n);}finally{restored.close();}
  writeFileSync(resolve(target,'images','test.png'),'changed');await assert.rejects(()=>verifyApplicationBackup(target),/Checksum/);
});
