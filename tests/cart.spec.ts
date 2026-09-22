import { mockCart } from './mock-cart';
import { test, expect } from '@playwright/test';
const product = { id: 10, name: 'API Shirt', code: 'SHIRT-10', slug: 'shirt', stockCount: 3,
  shortDescription: 'A shirt', fullDescription: '', createdTime: '', lastUpdatedTime: '', categories: [], files: [] };
for (const mobile of [false, true]) {
  test('persistent cart: ' + (mobile ? 'mobile' : 'desktop'), async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/ecommerce/categories', r => r.fulfill({ json: [] }));
    await page.route('**/api/ecommerce/auth/me', r => r.fulfill({ status: 401 }));
    await page.route('**/api/ecommerce/products*', r => r.fulfill({ json: { items: [product, { ...product, id: 11, name: 'Sold out', stockCount: 0 }], totalCount: 2 } }));
    await mockCart(page, [product]);
    await page.goto('/products');
    await expect(page.locator('.rbt-preloader')).toBeHidden();
    const card = page.locator('app-product-card [data-product-id="10"]');
    await expect(page.locator('app-product-card [data-product-id="11"] app-add-to-cart button')).toBeDisabled();
    await card.getByRole('button', { name: 'Add To Cart', exact: true }).click();
    const side = page.locator('.rbt-cart-side-menu');
    await expect(side).toHaveClass(/side-menu-active/);
    await expect(side.locator('[data-cart-product-id]')).toHaveCount(1);
    const quantity = side.getByRole('spinbutton', { name: 'Quantity of API Shirt', exact: true });
    await expect(quantity).toHaveValue('1');
    await expect(side.getByRole('button', { name: 'Decrease quantity of API Shirt' })).toBeDisabled();
    await side.getByRole('button', { name: 'Increase quantity of API Shirt' }).click();
    await expect(quantity).toHaveValue('2');
    await side.getByRole('button', { name: 'Increase quantity of API Shirt' }).click();
    await expect(quantity).toHaveValue('3');
    await expect(side.getByRole('button', { name: 'Increase quantity of API Shirt' })).toBeDisabled();
    await side.getByRole('button', { name: 'Decrease quantity of API Shirt' }).click();
    await expect(quantity).toHaveValue('2');
    await side.getByRole('link', { name: 'View Cart' }).click();
    await expect(page).toHaveURL(/cart.html$/);
    const cart = page.locator('app-cart app-cart-items[layout="page"]');
    const cartQuantity = cart.getByRole('spinbutton', { name: 'Quantity of API Shirt', exact: true });
    await expect(cartQuantity).toHaveValue('2');
    await cartQuantity.fill('0'); await cartQuantity.press('Tab'); await expect(cartQuantity).toHaveValue('2');
    await cartQuantity.fill('100'); await cartQuantity.press('Tab'); await expect(cartQuantity).toHaveValue('2');
    await expect(cart).toContainText('exceeds available stock');
    await page.reload();
    await expect(cartQuantity).toHaveValue('2');
    await cart.getByRole('button', { name: 'Decrease quantity of API Shirt' }).click();
    await expect(cartQuantity).toHaveValue('1');
    await expect(page.locator('header .rbt-mini-cart .access-box-count').first()).toHaveText('1');
    await cart.getByRole('button', { name: 'Remove API Shirt' }).click();
    await expect(cart).toContainText('Your cart is empty');
    await page.reload(); await expect(cart).toContainText('Your cart is empty');
    expect(errors).toEqual([]);
  });
}
