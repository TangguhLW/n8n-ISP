import { test, expect } from '@playwright/test';
async function login(page: import('@playwright/test').Page) {
  await page.goto('/'); await page.getByLabel('Password lokal').fill('browser-test-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
}
test('n8n command input shows actual response IDs, failures and access protection', async ({ page }) => {
  expect((await page.request.post('/api/n8n/dispatch', { data: { operation: 'health' } })).status()).toBe(401);
  let fail = false;
  await page.route('**/api/action', async route => {
    expect(route.request().postDataJSON().action).toBe('n8n.command');
    await route.fulfill({ status: fail ? 400 : 200, json: fail ? { error: 'n8n fixture offline' } : { ok: true, result: { executionId: 'fixture-42', result: { status: 'CONNECTED', data: [] } } } });
  });
  await login(page);
  await page.getByRole('navigation').getByRole('button', { name: 'Command Center', exact: true }).click();
  await page.getByLabel('Perintah', { exact: true }).fill('daftar workflow');
  await page.getByRole('button', { name: 'Jalankan perintah' }).click();
  await expect(page.getByText('fixture-42', { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/n8n-command-dark.png', fullPage: true });
  fail = true;
  await page.getByRole('button', { name: 'Jalankan perintah' }).click();
  await expect(page.locator('.n8n-command-section .error[role=alert]')).toContainText('n8n fixture offline');
  await expect(page.getByText('fixture-42', { exact: true })).toHaveCount(0);
});

test('TikTok live prepares selected account, validates URL and reminds without sending comments', async ({ page }) => {
  let commands = 0;
  await page.route('**/api/action', async route => {
    commands++;
    expect(route.request().postDataJSON().command).toBe('buka live akun 2 https://www.tiktok.com/@example/live');
    await route.fulfill({ json: { ok: true, result: { executionId: 'fixture-live-17', result: { url: 'https://www.tiktok.com/@example/live', account: 2, state: 'ready_to_open' } } } });
  });
  await login(page);
  await page.getByRole('navigation').getByRole('button', { name: 'TikTok Automation', exact: true }).click();
  await expect.poll(() => page.locator('.live-comment-panel').evaluate(el => getComputedStyle(el).animationName)).toBe('bubble-arrive');
  await page.getByLabel('Link TikTok live').fill('https://example.com/@wrong/live');
  await page.getByRole('button', { name: 'Siapkan live lewat n8n' }).click();
  await expect(page.locator('.live-workspace .error[role=alert]')).toContainText('Gunakan link live lengkap');
  expect(commands).toBe(0);
  await page.getByLabel('Link TikTok live').fill('https://www.tiktok.com/@example/live?share=1');
  await page.getByLabel('Akun untuk live').selectOption('2');
  await page.getByRole('button', { name: 'Siapkan live lewat n8n' }).click();
  await expect(page.getByRole('link', { name: 'Buka TikTok live', exact: true })).toHaveAttribute('href', 'https://www.tiktok.com/@example/live');
  await page.getByLabel('Draft komentar').fill('Pertanyaan untuk pembicara');
  await page.getByLabel('Interval pengingat (menit)').fill('1');
  await page.clock.install();
  await page.getByRole('button', { name: 'Mulai pengingat' }).click();
  await page.clock.fastForward(61000);
  await expect(page.getByText('Saatnya meninjau komentar sebelum Anda kirim.')).toBeVisible();
  expect(commands).toBe(1);
  await page.getByRole('button', { name: 'Hentikan', exact: true }).click();
  await expect(page.getByText('Saatnya meninjau komentar sebelum Anda kirim.')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/tiktok-live-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Mode terang' }).click();
  await page.screenshot({ path: 'test-results/tiktok-live-light.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/tiktok-live-mobile.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('.live-comment-panel').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
