import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
const [mode,folder]=process.argv.slice(2);
if(!['create','verify'].includes(mode)||!folder)throw new Error('Gunakan create|verify BACKUP_DIRECTORY.');
const root=resolve(folder);const files={};
async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.isSymbolicLink())throw new Error('Symlink tidak diterima.');
    const file=resolve(dir,entry.name);
    if(entry.isDirectory())await walk(file);
    else if(entry.name!=='manifest.json')files[relative(root,file).replaceAll('\\','/')]=createHash('sha256').update(await readFile(file)).digest('hex');
  }
}
await walk(root);
if(mode==='create')await writeFile(resolve(root,'manifest.json'),JSON.stringify({version:1,type:'FULL_COLD',createdAt:new Date().toISOString(),files},null,2),{flag:'wx'});
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
if(JSON.stringify(Object.keys(files).sort())!==JSON.stringify(Object.keys(manifest.files).sort())||Object.entries(files).some(([key,value])=>manifest.files[key]!==value))throw new Error('Manifest checksum tidak cocok.');
let checked=0;
for(const name of Object.keys(files).filter(n=>/\.(sqlite|sqlite3)$/.test(n))){
  const sqlite=new DatabaseSync(resolve(root,name),{readOnly:true});
  try{if(sqlite.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error(`SQLite integrity gagal: ${name}`);checked++;}finally{sqlite.close();}
}
if(!checked)throw new Error('Tidak ada SQLite database pada backup.');
console.log(`PASS: ${Object.keys(files).length} checksum; ${checked} database SQLite. Type: ${manifest.type}.`);
