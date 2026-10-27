import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
const origin='http://127.0.0.1:3001';
async function login(page:Page){await page.goto('/');await page.getByLabel('Password lokal').fill('browser-test-password');await page.getByRole('button',{name:'Masuk',exact:true}).click();await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();}
async function nav(page:Page,name:string){await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();await expect(page.getByRole('heading',{name,exact:true,level:1})).toBeVisible();}
async function action(page:Page,payload:Record<string,unknown>){const r=await page.request.post('/api/action',{headers:{origin},data:payload});expect(r.status(),await r.text()).toBe(200);return (await r.json()).result;}

test('login, seluruh navigasi, tema, keyboard, mobile, perintah dan status nyata',async({page})=>{
  expect((await page.request.get('/favicon.ico')).status()).toBe(204);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByLabel('Password lokal').fill('wrong');await page.getByRole('button',{name:'Masuk',exact:true}).click();await expect(page.locator('.error[role=alert]')).toContainText('Password tidak cocok');
  await login(page);
  await expect(page.getByText('Tidak merespons',{exact:true}).first()).toBeVisible();
  for(const name of ['Live AI Operations','Agent Manager','Workflow Manager','Execution Monitor','Legal Intelligence','Content Studio','TikTok Automation','Instagram Publishing','Job Queue','Logs','Diagnostics','Backups','Notifications','Settings','Documentation','Overview'])await nav(page,name);
  await expect(page.locator('.shell')).toHaveClass(/dark/);await page.screenshot({path:'test-results/overview-dark.png',fullPage:true});
  await page.getByRole('button',{name:'Mode terang',exact:true}).click();
  await page.getByLabel('Perintah',{exact:true}).fill('tampilkan antrean TikTok');await page.getByRole('button',{name:'Jalankan perintah'}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('TikTok Automation');
  await nav(page,'Overview');await page.getByLabel('Perintah',{exact:true}).fill('Remove-Item data');await page.getByRole('button',{name:'Jalankan perintah'}).click();await expect(page.locator('.error[role=alert]')).toContainText('Shell bebas tidak didukung');
  await page.getByRole('button',{name:'Perbarui',exact:true}).click();await expect(page.getByRole('button',{name:'Perbarui',exact:true})).toBeEnabled();
  await page.screenshot({path:'test-results/overview-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/overview-mobile.png',fullPage:true});
  await page.setViewportSize({width:800,height:900});await page.addStyleTag({content:'html{font-size:200%}'});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('.liquid-button').evaluateAll(buttons=>buttons.every(button=>{const outer=button.getBoundingClientRect();return [...button.querySelectorAll('.liquid-label,.liquid-arrow')].every(child=>{const box=child.getBoundingClientRect();return box.right<=outer.right&&box.bottom<=outer.bottom;});}))).toBe(true);await page.screenshot({path:'test-results/overview-200-percent.png',fullPage:true});
  await page.keyboard.press('Tab');await expect.poll(()=>page.evaluate(()=>document.activeElement?.tagName)).not.toBe('BODY');
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Keluar',exact:true}).click();await expect(page.getByRole('heading',{name:'Masuk ke pusat operasi'})).toBeVisible();expect(errors).toEqual([]);
});

test('pemulihan koneksi, shortcut agent/akun, rincian health, dan tautan editor',async({page})=>{
  await page.route('**/api/state',route=>route.abort());await page.goto('/');await expect(page.getByRole('button',{name:'Coba lagi',exact:true})).toBeEnabled();await page.unroute('**/api/state');await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await expect(page.getByRole('heading',{name:'Masuk ke pusat operasi'})).toBeVisible();await login(page);
  await page.getByRole('link',{name:'Lewati navigasi'}).focus();await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>location.hash)).toBe('#main');
  for(let i=0;i<3;i++){await nav(page,'Agent Manager');await page.getByRole('button',{name:'Buka aktivitas',exact:true}).nth(i).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Live AI Operations');await nav(page,'Agent Manager');await page.getByRole('button',{name:'Periksa kesiapan',exact:true}).nth(i).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Diagnostics');}
  await page.getByText('Hasil health aktual',{exact:true}).click();await expect(page.locator('details[open] pre')).toBeVisible();
  for(let i=0;i<2;i++){await nav(page,'Instagram Publishing');await page.getByRole('button',{name:'Buka draft dan ekspor',exact:true}).nth(i).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Content Studio');}
  await nav(page,'Workflow Manager');const editor=page.getByRole('link',{name:'Buka editor n8n',exact:true});await expect(editor).toHaveAttribute('href','http://localhost:5678');const popupPromise=page.waitForEvent('popup');await editor.click();const popup=await popupPromise;expect(popup.isClosed()).toBe(false);await popup.close();
  await nav(page,'TikTok Automation');await expect(page.getByRole('link',{name:'Dokumentasi resmi TikTok'})).toHaveAttribute('href','https://developers.tiktok.com/doc/content-posting-api-get-started/');await nav(page,'Instagram Publishing');await expect(page.getByRole('link',{name:'Dokumentasi Meta Instagram Platform'})).toHaveAttribute('href','https://developers.facebook.com/docs/instagram-platform/');
});

test('profil terpisah → topik → draft → gambar → approval → ekspor → revisi → backup',async({page})=>{
  await login(page);await nav(page,'Settings');
  const brand=page.locator('section').filter({has:page.getByRole('heading',{name:'Profil @izasadziliandpartners',exact:true})});
  await brand.getByLabel('Audiens akun ini').fill('TEST ONLY: audiens sintetis');await brand.getByLabel('Fokus praktik dan topik').fill('TEST ONLY: pengujian sistem');await brand.getByLabel('Gaya komunikasi').fill('Formal');await brand.getByLabel('Warna / arahan desain akun ini').fill('Biru gelap');await brand.getByRole('button',{name:'Simpan profil akun'}).click();await expect(brand.getByText('Profil lengkap',{exact:true})).toBeVisible();
  const other=page.locator('section').filter({has:page.getByRole('heading',{name:'Profil @isolegalofficial',exact:true})});await expect(other.getByText('Perlu konfigurasi',{exact:true})).toBeVisible();
  await nav(page,'Legal Intelligence');
  const create=page.locator('section').filter({has:page.getByRole('heading',{name:'Catat topik dari sumber primer'})});
  await create.getByLabel('Judul topik').fill('TEST ONLY: alur editorial');await create.getByLabel('Fakta yang bersumber').fill('Ini data sintetis untuk menguji alur review, bukan fakta atau nasihat hukum.');await create.getByLabel('URL resmi HTTPS').fill(`https://www.mkri.id/?ath-test=${randomUUID()}`);await create.getByLabel('Penerbit',{exact:true}).fill('TEST ONLY');await create.getByRole('button',{name:'Simpan kandidat belum diverifikasi'}).click();
  await page.getByRole('button',{name:'TEST ONLY: alur editorial',exact:true}).click();
  const review=page.locator('form').filter({has:page.getByRole('heading',{name:'Review oleh advokat / reviewer lokal'})});
  await review.getByLabel('Catatan pemeriksaan').fill('TEST ONLY: pemeriksaan fixture sintetis.');await review.getByLabel('Relevansi untuk audiens').fill('Uji fungsi aplikasi, tidak untuk publikasi.');await review.getByLabel('Saya telah membaca').check();await review.getByRole('button',{name:'Simpan pemeriksaan'}).click();await expect(page.getByText('Diperiksa reviewer',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Buat brief dari topik'}).click();await page.getByRole('combobox',{name:'Format',exact:true}).selectOption('portrait');
  const contentForm=page.locator('form').filter({has:page.getByRole('button',{name:'Buat brief dan caption',exact:true})});
  expect(await contentForm.evaluate((f:HTMLFormElement)=>({valid:f.checkValidity(),values:[...new FormData(f)],invalid:[...f.querySelectorAll(':invalid')].map(e=>e.outerHTML)}))).toMatchObject({valid:true});
  await page.getByRole('button',{name:'Buat brief dan caption'}).click();
  await page.getByRole('button',{name:'TEST ONLY: alur editorial',exact:true}).click();
  await page.getByLabel('Catatan reviewer',{exact:true}).fill('TEST ONLY approval');await page.getByLabel('Saya telah memeriksa sumber, akun').check();await page.getByRole('button',{name:'Setujui konten lokal'}).click();await expect(page.locator('.error[role=alert]')).toContainText('setiap slide');
  const image=await sharp({create:{width:1080,height:1350,channels:3,background:'#172c40'}}).png().toBuffer();
  await page.getByLabel('Impor gambar slide 1').setInputFiles({name:'test-only.png',mimeType:'image/png',buffer:image});await page.getByRole('button',{name:'Impor slide 1',exact:true}).click();await expect(page.getByRole('img')).toBeVisible();
  await page.getByRole('button',{name:'Salin prompt',exact:true}).count().then(async n=>{if(!n)await page.getByText('Prompt gambar slide 1',{exact:true}).click();});await page.getByRole('button',{name:'Salin prompt',exact:true}).click();
  await page.getByLabel('Catatan reviewer',{exact:true}).fill('TEST ONLY complete review');await page.getByLabel('Saya telah memeriksa sumber, akun').check();await page.getByRole('button',{name:'Setujui konten lokal'}).click();await expect(page.locator('section').filter({has:page.getByRole('heading',{name:'Review draft / izasadziliandpartners'})}).getByText('Disetujui lokal',{exact:true})).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Ekspor paket ZIP'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^ath-.*\.zip$/);await download.saveAs('test-results/export-test-only.zip');
  await page.screenshot({path:'test-results/content-studio.png',fullPage:true});
  await page.getByRole('textbox',{name:'Caption',exact:true}).fill('TEST ONLY revised caption');await page.getByRole('button',{name:'Simpan revisi caption'}).click();await expect(page.getByText('revisi 3',{exact:false}).first()).toBeVisible();
  const state=await(await page.request.get('/api/state')).json();const draft=state.drafts[0];expect(draft.approval).toBeNull();expect(draft.status).toBe('READY_FOR_REVIEW');
  page.once('dialog',d=>d.accept('TEST ONLY requested revision'));await page.getByRole('button',{name:'Minta revisi',exact:true}).click();await expect(page.getByText('NEEDS_REVISION',{exact:true}).first()).toBeVisible();
  await nav(page,'Job Queue');await page.getByLabel('Filter status job').selectOption('WAITING_FOR_APPROVAL');await page.getByRole('button',{name:state.jobs.find((j:any)=>j.type==='CONTENT_DRAFT').id.slice(0,8),exact:true}).click();await page.getByRole('button',{name:'Visual Story View',exact:true}).click();await page.locator('.map-step button').first().click();await page.getByText('Input dan output',{exact:true}).click();await page.screenshot({path:'test-results/workflow-map.png',fullPage:true});
  await page.getByRole('button',{name:'Technical View',exact:true}).click();await page.getByRole('button',{name:'Buka hasil draft',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Content Studio');await expect(page.getByRole('link',{name:'Periksa sumber draft',exact:true})).toHaveAttribute('href',/^https:\/\/www\.mkri\.id\//);
  await nav(page,'Backups');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Buat backup aplikasi',exact:true}).click();await expect(page.getByText('Lulus',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Verifikasi ulang backup'}).click();
});

test('API menolak anonymous, CSRF dan publish; riset gagal jujur; video hak belum jelas',async({page,request})=>{
  expect((await request.get('/api/state')).status()).toBe(401);expect((await request.post('/api/action',{data:{action:'backup.create',confirmed:true}})).status()).toBe(401);
  await login(page);expect((await page.request.post('/api/action',{headers:{origin:'http://evil.test'},data:{action:'backup.create',confirmed:true}})).status()).toBe(403);
  expect((await page.request.post('/api/action',{headers:{origin},data:{action:'publish',id:'fake'}})).status()).toBe(400);
  await nav(page,'Legal Intelligence');await page.getByRole('button',{name:'Jalankan riset feed'}).click();const state=await(await page.request.get('/api/state')).json();expect(state.jobs.find((j:any)=>j.type==='LEGAL_RESEARCH').status).toBe('FAILED');
  await nav(page,'TikTok Automation');await page.getByLabel('URL YouTube Shorts / video sumber').fill('https://www.youtube.com/shorts/test-only');await page.getByLabel('Caption berdasarkan isi video').fill('TEST ONLY caption');await page.getByRole('button',{name:'Simpan intake'}).click();const next=await(await page.request.get('/api/state')).json();expect(next.videos[0].status).toBe('NEEDS_PERMISSION');await page.getByRole('button',{name:next.videos[0].id.slice(0,8),exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Setujui paket video'}).click();await expect(page.locator('.error[role=alert]')).toContainText('metadata video harus lengkap');
  await nav(page,'Logs');await page.getByRole('button',{name:'Baca 100 baris log container'}).click();const logs=page.locator('section').filter({has:page.getByRole('heading',{name:'Log n8n',exact:true})}).locator('pre');await expect(logs).toBeVisible();await expect(logs).not.toBeEmpty();expect(await logs.textContent()).not.toContain('browser-test-session-secret');
  await nav(page,'Notifications');
  const unread=page.getByRole('button',{name:'Tandai dibaca',exact:true});
  while(await unread.count()){const before=await unread.count();await unread.first().click();await expect(unread).toHaveCount(before-1);}
  expect(JSON.stringify(next)).not.toContain('browser-test-session-secret');expect(JSON.stringify(next)).not.toContain('ATH_ADMIN_PASSWORD_HASH');
});
