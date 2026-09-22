import { mockCart } from './mock-cart';
import { test, expect } from '@playwright/test';
const categories = [{id:1,parentId:null,name:'Fashion',uniqueKey:'fashion',sortOrder:0,children:[
 {id:2,parentId:1,name:'Women',uniqueKey:'women',sortOrder:0,children:[
  {id:3,parentId:2,name:'Dresses',uniqueKey:'dresses',sortOrder:0,children:[]}
 ]}
]}];

for (const mobile of [false, true]) {
 test('public categories: ' + (mobile ? 'mobile nested navigation' : 'desktop hover and keyboard navigation'), async ({page}) => {
  if(mobile) await page.setViewportSize({width:390,height:844});
  let requests=0;
  await page.route('**/api/ecommerce/categories', async route => {
   requests++; expect(route.request().headers()['authorization']).toBeUndefined();
   await route.fulfill({json:categories});
  });
  await page.goto('/home');
  await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
  await expect(page.locator('.rbt-preloader')).toBeHidden();
  if(mobile) await page.locator('.hamberger-button:visible').first().click();
  const nav = page.locator(mobile ? '#rbt-tab-pane-mobilemenu-1 app-category-navigation' : 'header app-category-navigation:visible').first();
  const rootToggle=nav.getByRole('button',{name:'Subcategories of Fashion'});
  if(mobile) await rootToggle.click(); else {
   await nav.getByRole('link',{name:'Fashion',exact:true}).hover();
   await expect(rootToggle).toHaveAttribute('aria-expanded','true');
   await rootToggle.focus();await page.keyboard.press('Escape');
   await expect(rootToggle).toHaveAttribute('aria-expanded','false');
   await page.keyboard.press('Enter');
  }
  await expect(rootToggle).toHaveAttribute('aria-expanded','true');
  if(mobile) await nav.getByRole('button',{name:'Subcategories of Women'}).click();
  else await nav.getByRole('link',{name:'Women',exact:true}).hover();
  await nav.getByRole('link',{name:'Dresses',exact:true}).click();
  await expect(page).toHaveURL('http://127.0.0.1:4302/products?categoryId=3');
  await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
  expect(requests).toBe(1);
  await expect(page.locator('.popup-mobile-menu')).not.toHaveClass(/active/);
  if(mobile) expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 });
}

test('failed category request offers retry and handles empty data',async({page})=>{
 let attempts=0;
 await page.route('**/api/ecommerce/categories',route=> ++attempts === 1
  ? route.fulfill({status:503,body:'Unavailable'}) : route.fulfill({json:[]}));
 await page.goto('/products');
 await expect(page.locator('.rbt-preloader')).toBeHidden();
 const nav=page.locator('header app-category-navigation:visible').first();
 await expect(nav).toContainText('Categories unavailable');
 await nav.getByRole('button',{name:'Retry'}).click();
 await expect(nav).toContainText('No categories available');
 await expect(nav.getByRole('link',{name:'All Products'})).toHaveAttribute('href','/products');
 expect(attempts).toBe(2);
});


test.beforeEach(async ({page}) => { await mockCart(page, []); });
