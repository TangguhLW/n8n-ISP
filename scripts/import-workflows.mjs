import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base=process.env.N8N_BASE_URL||'http://127.0.0.1:5678';
const url=new URL(base);
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.protocol!=='http:'||url.username||url.password)throw new Error('Hanya instance lokal diizinkan.');
if(!process.env.N8N_API_KEY)throw new Error('Isi N8N_API_KEY dalam .env. Jalankan node --env-file=.env scripts/import-workflows.mjs.');
const headers={'X-N8N-API-KEY':process.env.N8N_API_KEY,'Content-Type':'application/json'};
const existing=[];let cursor='';
do{const res=await fetch(`${url.origin}/api/v1/workflows?limit=100${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`,{headers,signal:AbortSignal.timeout(10000),redirect:'error'});if(!res.ok)throw new Error(`n8n HTTP ${res.status}`);const data=await res.json();existing.push(...data.data);cursor=data.nextCursor||'';}while(cursor);
const imported=[];
for(const name of (await readdir(resolve('workflows'))).filter(n=>n.endsWith('.json'))){
  const template=JSON.parse(await readFile(resolve('workflows',name),'utf8'));
  if(existing.some(w=>w.name===template.name)){console.log(`SKIP: ${template.name} sudah ada.`);continue;}
  const {name:workflowName,nodes,connections,settings}=template;
  const res=await fetch(`${url.origin}/api/v1/workflows`,{method:'POST',headers,body:JSON.stringify({name:workflowName,nodes,connections,settings}),signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!res.ok)throw new Error(`Import gagal HTTP ${res.status}: ${workflowName}`);
  const result=await res.json();imported.push({id:result.id,name:result.name,active:result.active});console.log(`IMPORTED nonaktif: ${result.name}, ID ${result.id}`);
}
await writeFile(resolve('data','workflow-imports.json'),JSON.stringify(imported,null,2));
