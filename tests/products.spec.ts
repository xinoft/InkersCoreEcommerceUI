import { mockCart } from './mock-cart';
import { test, expect } from '@playwright/test';
const categories = [{ id: 1, name: 'Clothing', children: [{ id: 2, name: 'Shirts', children: [] }] }, { id: 3, name: 'Other', children: [] }];
const product = (id:number, name:string, categoryId:number) => ({ id,name,code:'CODE-'+id,slug:'product-'+id,
 shortDescription:'Short description '+id,fullDescription:'<p>Full description '+id+'</p>',stockCount: id===1?5:0,
 createdTime:'2026-09-01T00:00:00Z',lastUpdatedTime:'2026-09-20T00:00:00Z',files:[],categories:[{id:categoryId,name:categoryId===1?'Clothing':'Shirts',uniqueKey:'category'}] });
const products=[product(1,'Parent product',1),product(2,'Child product',2)];

for(const mobile of [false,true]) {
 test('live product component selection and fields: '+(mobile?'mobile':'desktop'),async({page})=>{
  if(mobile) await page.setViewportSize({width:390,height:844});
  await page.route('**/api/ecommerce/categories',route=>route.fulfill({json:categories}));
  await page.route('**/api/ecommerce/products*',route=>{
   expect(route.request().headers()['authorization']).toBeUndefined();
   const categoryId=Number(new URL(route.request().url()).searchParams.get('categoryId'))||null;
   const items=categoryId===2?[products[1]]:categoryId===3?[]:products;
   return route.fulfill({json:{categoryId,categoryName:categoryId===1?'Clothing':categoryId===2?'Shirts':categoryId===3?'Other':null,totalCount:items.length,items}});
  });
  await page.goto('/products?categoryId=1');
  await expect(page.locator('.rbt-preloader')).toBeHidden();
  const catalog=page.locator('app-product-catalog');
  await expect(catalog.locator('[data-product-id]')).toHaveCount(2);
  await expect(catalog).toContainText('including subcategories');
  await expect(catalog).toContainText('CODE-1');
  await expect(catalog).toContainText('5 in Stock');
  await expect(catalog).toContainText('Out of stock');
  const card=catalog.locator('[data-product-id="1"]');
  await expect(card.locator('.rbt-product-badge')).toHaveCount(2);
  await expect(card.locator('.price-text')).toBeVisible();
  await expect(card.locator('.rbt-card-rating')).toBeVisible();
  await card.hover();
  await card.locator('.rbt-show-more-btn').click();
  await expect(card.locator('.rbt-show-more-btn')).toHaveText('Show Less');
  await card.locator('.rbt-compare-btn-activation').click();
  await expect(card.locator('.rbt-compare-btn-activation')).toHaveClass(/added-compare/);
  await card.locator('.rbt-cart-sidenav-activation').click();
  await expect(page.locator('.rbt-cart-side-menu')).toHaveClass(/side-menu-active/);
  await page.locator('.rbt-cart-side-menu .minicart-close-button').click();
  await card.locator('summary').click();
  await expect(catalog.locator('[data-product-id="1"]')).toContainText('Full description 1');
  await expect(catalog.locator('[data-product-id="1"]')).toContainText('product-1');
  if(mobile) await catalog.getByRole('link',{name:'Show Filter',exact:true}).click();
  const filters = mobile ? catalog.locator('.rbt-filter-offcanvas-area') : catalog.locator('aside').first();
  if(mobile) await filters.locator('a[href="#mobile-rbt-collapse-3"]').click();
  await filters.getByText('Shirts',{exact:true}).click();
  await expect(page).toHaveURL(/categoryId=2$/);
  await expect(catalog.locator('[data-product-id]')).toHaveCount(1);
  await expect(catalog.locator('[data-product-id="1"]')).toHaveCount(0);
  await filters.getByText('Other',{exact:true}).click();
  await expect(catalog).toContainText('No products found in this category or its subcategories');
  await filters.getByText('All Products',{exact:true}).click();
  if(mobile) await filters.locator('.rbt-sidebar-close-btn').click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(catalog.locator('[data-product-id]')).toHaveCount(2);
  if(mobile) expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 });
}

test('product listing has recoverable errors and rejects invalid categories',async({page})=>{
 await page.route('**/api/ecommerce/categories',route=>route.fulfill({json:categories}));
 let calls=0;
 await page.route('**/api/ecommerce/products*',route=>++calls===1?route.fulfill({status:503}):route.fulfill({json:{categoryId:1,categoryName:'Clothing',totalCount:0,items:[]}}));
 await page.goto('/products?categoryId=1');
 const catalog=page.locator('app-product-catalog');
 await expect(catalog).toContainText('Products could not be loaded');
 await catalog.getByRole('button',{name:'Retry products'}).click();
 await expect(catalog).toContainText('No products found');
 await page.goto('/products?categoryId=invalid');
 await expect(catalog).toContainText('This category link is invalid');
 expect(calls).toBe(2);
});

test.beforeEach(async ({page}) => { await mockCart(page, products); });
