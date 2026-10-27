import { test, expect } from '@playwright/test';

test('WhatsApp QR lives in the sidebar and inherits both themes on desktop and mobile', async ({ page }) => {
  await page.route('**/api/whatsapp', route => route.fulfill({ json: { session: 'NOT_CREATED', connectorError: '', fileReady: false, job: null } }));
  await page.goto('/');
  await page.getByLabel('Password lokal').fill('browser-test-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  const navigation = page.getByRole('navigation', { name: 'Navigasi utama' });
  await navigation.getByRole('button', { name: 'WhatsApp QR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'WhatsApp QR', exact: true })).toBeVisible();
  await expect(navigation.getByRole('button', { name: 'WhatsApp QR', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Belum dipasangkan' })).toBeVisible();
  await page.screenshot({ path: 'test-results/whatsapp-sidebar-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Mode terang', exact: true }).click();
  await expect.poll(() => page.locator('.whatsapp-embedded').evaluate(el => getComputedStyle(el).getPropertyValue('--ink').trim())).toBe('#202126');
  await page.screenshot({ path: 'test-results/whatsapp-sidebar-light.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await navigation.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await navigation.getByRole('button', { name: 'WhatsApp QR', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/whatsapp-sidebar-mobile.png', fullPage: true });
});

test('WhatsApp exports require authentication and reject foreign origin and invalid sync tokens', async ({ page }) => {
  expect((await page.request.get('/api/whatsapp')).status()).toBe(401);
  expect((await page.request.post('/api/whatsapp/sync', { headers: { 'X-ATH-WhatsApp-Sync': 'invalid' } })).status()).toBe(401);
  await page.goto('/');
  await page.getByLabel('Password lokal').fill('browser-test-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  expect((await page.request.post('/api/whatsapp', { headers: { Origin: 'https://foreign.example' }, data: { action: 'collect' } })).status()).toBe(403);
});

test('WhatsApp QR controls, automatic collection, errors and mobile layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  let session = 'NOT_CREATED', collected = 0, qrRequested = 0;
  const job = { state: 'running', contacts: 0, groups: 0, processedGroups: 0, unresolved: 0, warnings: [], targets: [] };
  await page.route('**/api/whatsapp', async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.action === 'qr') { qrRequested++; session = 'SCAN_QR_CODE'; }
      if (body.action === 'collect') { collected++; }
      await route.fulfill({ json: { started: true } });
    } else await route.fulfill({ json: { session, connectorError: '', fileReady: false, job: collected ? job : null } });
  });
  await page.route('**/api/whatsapp?mode=qr*', route => route.fulfill({ status: 400, json: { error: 'QR fixture unavailable' } }));
  await page.goto('/whatsapp');
  await expect(page.getByRole('heading', { name: 'Belum dipasangkan' })).toBeVisible();
  await expect(page.getByText('Hanya peserta Open House Pucung', { exact: false })).toBeVisible();
  await expect(page.getByText('Gmail unik', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tampilkan QR' }).click();
  expect(qrRequested).toBe(1);
  await expect(page.getByRole('heading', { name: 'Scan QR dari ponsel' })).toBeVisible();
  await expect(page.getByText('QR belum tersedia.', { exact: false })).toBeVisible();
  session = 'WORKING';
  await page.getByRole('button', { name: 'Perbarui status' }).click();
  await expect.poll(() => collected).toBe(1);
  await expect(page.getByRole('button', { name: 'Sedang mengambil data' })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/whatsapp-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Kembali ke ATH' }).focus();
  await expect(page.getByRole('link', { name: 'Kembali ke ATH' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('http://127.0.0.1:3001/');
  expect(errors).toEqual([]);
});
