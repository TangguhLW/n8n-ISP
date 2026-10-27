import { test, expect, type Page } from '@playwright/test';

async function login(page:Page){
  await page.goto('/');await page.getByLabel('Password lokal').fill('browser-test-password');
  await page.getByRole('button',{name:'Masuk',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
}

test('material controls: capsule geometry, keyboard, hover, loading, fallback and reduced motion',async({page})=>{
  await page.goto('/design/glass');
  const button=page.getByRole('button',{name:'Get started',exact:true});
  const box=await button.boundingBox();expect(box?.width).toBe(166);expect(box?.height).toBe(46);
  await button.focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Started',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Started',exact:true}).click();await button.hover();
  await expect.poll(()=>button.evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');
  await button.blur();await page.mouse.move(20,20);await page.screenshot({path:'test-results/glass-study-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Uji loading',exact:true}).click();
  await expect(page.getByRole('button',{name:'Memproses…',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Memproses…',exact:true})).toHaveAttribute('aria-busy','true');
  await expect(page.getByRole('button',{name:'Uji loading',exact:true})).toBeEnabled();
  await expect(page.getByRole('button',{name:'Disabled',exact:true})).toBeDisabled();
  const blur=await page.locator('.preset-grid .glass-surface').evaluateAll(elements=>elements.map(e=>getComputedStyle(e).getPropertyValue('--glass-blur')));
  expect(new Set(blur).size).toBe(4);
  expect(await button.evaluate(e=>getComputedStyle(e,'::before').maskComposite)).toContain('exclude');
  await page.getByRole('button',{name:'Fallback nonaktif',exact:true}).click();
  expect(await button.evaluate(e=>getComputedStyle(e).backdropFilter)).toBe('none');
  expect(await button.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(229, 232, 236)');
  await page.screenshot({path:'test-results/glass-fallback.png',fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await button.evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/glass-study-mobile.png',fullPage:true});
});

test('toolbar search, native dialog focus, notifications, profile and distinct mobile navigation',async({page})=>{
  await login(page);await page.keyboard.press('Control+k');
  const dialog=page.getByRole('dialog',{name:'Cari halaman'});await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Nama halaman'})).toBeFocused();
  await page.getByRole('textbox',{name:'Nama halaman'}).fill('workflow');
  await expect(dialog.getByRole('button',{name:'Workflow Manager',exact:true})).toBeVisible();
  await dialog.getByRole('button',{name:'Workflow Manager',exact:true}).click();
  await expect(dialog).not.toBeVisible();await expect(page.getByRole('heading',{level:1})).toHaveText('Workflow Manager');
  await page.getByRole('button',{name:'Cari halaman',exact:true}).click();await page.getByRole('textbox',{name:'Nama halaman'}).fill('not-a-page');
  await expect(dialog.getByText('Halaman tidak ditemukan.',{exact:false})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Cari halaman',exact:true})).toBeFocused();
  await page.getByRole('button',{name:/Notifikasi, \d+ belum dibaca/}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Notifications');
  await page.getByRole('button',{name:'Pengaturan akun lokal',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Settings');
  await page.setViewportSize({width:390,height:844});await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('navigation').getByRole('button',{name:'Overview',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Overview');await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.screenshot({path:'test-results/liquid-overview-mobile.png',fullPage:true});
});

test('600 execution rows stay readable without per-row backdrop filters',async({page})=>{
  await page.route('**/api/state',async route=>{
    const response=await route.fetch();if(response.status()!==200){await route.fulfill({response});return;}
    const data=await response.json();
    data.executions={status:'CONNECTED',data:Array.from({length:600},(_,i)=>({id:`TEST-${i}`,workflowId:'TEST ONLY',status:i%2?'success':'error',startedAt:'2026-10-09T00:00:00Z',stoppedAt:'2026-10-09T00:00:01Z'}))};
    await route.fulfill({response,json:data});
  });
  await login(page);const start=Date.now();
  await page.getByRole('navigation').getByRole('button',{name:'Execution Monitor',exact:true}).click();
  await expect(page.locator('tbody tr')).toHaveCount(600);
  const elapsed=Date.now()-start;test.info().annotations.push({type:'600-row-render-ms',description:String(elapsed)});
  expect(await page.locator('tbody tr').evaluateAll(rows=>rows.every(row=>getComputedStyle(row).backdropFilter==='none'))).toBe(true);
  expect(await page.locator('.glass-surface:visible').count()).toBeLessThanOrEqual(4);
  await page.screenshot({path:'test-results/executions-stress.png'});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
