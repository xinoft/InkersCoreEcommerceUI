import { mockCart } from './mock-cart';
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, configured = true, returning = false) {
  const customer = { id: 7, firstName: 'Chosen', lastName: 'Name', email: 'google@example.test', phone: null };
  await page.route('**/api/ecommerce/categories', r => r.fulfill({ json: [] }));
  await page.route('**/api/ecommerce/products*', r => r.fulfill({ json: { items: [], totalCount: 0 } }));
  await page.route('**/api/ecommerce/auth/me', r => r.fulfill({ status: 401 }));
  await page.route('**/api/ecommerce/auth/challenge', r => r.fulfill({ json: { clientId: configured ? 'test-client' : '', nonce: 'nonce', csrfToken: 'csrf-test' } }));
  await page.route('https://accounts.google.com/gsi/client', r => r.fulfill({ contentType: 'application/javascript', body:
    'window.google={accounts:{id:{initialize(o){window.googleOptions=o},renderButton(host){const b=document.createElement("button");b.textContent="Google test account";b.type="button";b.onclick=()=>window.googleOptions.callback({credential:"verified-test-token"});host.append(b)}}}};' }));
  await page.route('**/api/ecommerce/auth/google', async r => {
    expect(r.request().postDataJSON()).toEqual({ credential: 'verified-test-token' });
    expect(r.request().headers()['x-storefront-csrf']).toBe('csrf-test');
    await r.fulfill({ json: returning ? { requiresRegistration: false, customer } : { requiresRegistration: true, firstName: 'Google', lastName: 'Account', email: customer.email } });
  });
  await page.route('**/api/ecommerce/auth/register', async r => {
    expect(r.request().postDataJSON()).toEqual({ firstName: 'Chosen', lastName: 'Name', phone: '' });
    await r.fulfill({ json: { requiresRegistration: false, customer } });
  });
  await page.route('**/api/ecommerce/auth/logout', r => r.fulfill({ status: 204 }));
  await page.goto('/products');
  await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
  await expect(page.locator('.rbt-preloader')).toBeHidden();
  if ((page.viewportSize()?.width ?? 1440) < 992) await page.evaluate(() => window.scrollTo(0, 700));
  await page.locator((page.viewportSize()?.width ?? 1440) < 992 ? '.rbt-toolbar [data-bs-target="#signinModal"]' : 'header [data-bs-target="#signinModal"]:visible').first().click();
  await expect(page.locator('#signinModal')).toBeVisible();
}

test('Google first signup prefills names, allows no phone, restores template modal and logs out', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await setup(page);
  const modal = page.locator('#signinModal');
  await modal.getByRole('button', { name: 'Google test account' }).click();
  await expect(modal.getByLabel('First name', { exact: true })).toHaveValue('Google');
  await expect(modal.getByLabel('Last name', { exact: true })).toHaveValue('Account');
  await modal.getByLabel('First name', { exact: true }).fill('Chosen');
  await modal.getByLabel('Last name', { exact: true }).fill('Name');
  await modal.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(modal).toContainText('Welcome, Chosen');
  await modal.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(modal.getByRole('button', { name: 'Google test account' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('returning Google account skips name confirmation', async ({ page }) => {
  await setup(page, true, true);
  const modal = page.locator('#signinModal');
  await modal.getByRole('button', { name: 'Google test account' }).click();
  await expect(modal).toContainText('Welcome, Chosen');
  await expect(modal.getByLabel('First name', { exact: true })).toHaveCount(0);
});

test('unconfigured Google gives an actionable message without removing template UI', async ({ page }) => {
  await setup(page, false);
  const modal = page.locator('#signinModal');
  await expect(modal.getByRole('alert')).toContainText('not been configured');
  await expect(modal.getByRole('button', { name: 'Continue with Facebook' })).toBeVisible();
  await expect(modal.locator('.rbt-log-slide-activation')).toBeVisible();
  await modal.locator('[data-bs-target="#signupModal"]').click();
  await expect(page.locator('#signupModal')).toBeVisible();
});

test('Google name confirmation works on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const modal = page.locator('#signinModal');
  await modal.getByRole('button', { name: 'Google test account' }).click();
  await expect(modal.getByLabel('First name', { exact: true })).toHaveValue('Google');
  await expect(modal.getByLabel('Mobile number (optional)')).not.toHaveAttribute('required');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
test.beforeEach(async ({page}) => { await mockCart(page, []); });
