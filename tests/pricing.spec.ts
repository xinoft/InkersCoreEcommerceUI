import { test, expect } from '@playwright/test';
import { mockCart } from './mock-cart';
const product = {id:10,name:'Priced shirt',code:'SHIRT',slug:'shirt',stockCount:5,price:100,offerPrice:75,currentPrice:75,
 shortDescription:'Shirt description',fullDescription:'',createdTime:'',lastUpdatedTime:'',categories:[],files:[]};
for (const mobile of [false,true]) {
 test('storefront pricing '+(mobile?'mobile':'desktop'),async({page})=>{
  if(mobile) await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/ecommerce/categories',r=>r.fulfill({json:[]}));
  await page.route('**/api/ecommerce/auth/me',r=>r.fulfill({status:401}));
  await page.route('**/api/ecommerce/products',r=>r.fulfill({json:{items:[product,{...product,id:11,name:'Unpriced',price:null,offerPrice:null,currentPrice:null}],totalCount:2}}));
  await page.route('**/api/ecommerce/products/10',r=>r.fulfill({json:product}));
  await mockCart(page,[product],[{id:10,quantity:1}]);
  await page.goto('/products');
  await expect(page.locator('.rbt-preloader')).toBeHidden();
  const card=page.locator('[data-product-id="10"]');
  await expect(card.locator('app-product-price del')).toHaveText('$100.00');
  await expect(card.locator('app-product-price span')).toHaveText('$75.00');
  await expect(page.locator('[data-product-id="11"] app-product-price')).toHaveText('Price unavailable');
  await card.locator('.rbt-card-title a').click();
  await expect(page).toHaveURL(/productId=10/);
  await expect(page.locator('app-product-details .rbt-card-title.mt--12')).toHaveText('Priced shirt');
  await expect(page.locator('app-product-details .pricing-part.mt--0 app-product-price span')).toHaveText('$75.00');
  await page.goto('/cart');
  await expect(page.locator('.rbt-preloader')).toBeHidden();
  const cart=page.locator('app-cart app-cart-items[layout="page"]');
  await expect(cart.locator('[data-cart-product-id="10"] td').last()).toHaveText('$75.00');
  await cart.getByRole('button',{name:'Increase quantity of Priced shirt'}).click();
  await expect(cart.locator('[data-cart-product-id="10"] td').last()).toHaveText('$150.00');
  await expect(page.locator('app-cart .rbt-cart-subttotal').filter({hasText:'Subtotal'}).first().locator('.price')).toHaveText('$150.00');
  await cart.getByRole('button',{name:'Decrease quantity of Priced shirt'}).click();
  await expect(cart.locator('[data-cart-product-id="10"] td').last()).toHaveText('$75.00');
  expect(errors).toEqual([]);
 });
}
