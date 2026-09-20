import { test, expect, Page } from '@playwright/test';

async function ready(page:Page,route:string) {
 await page.goto(route);
 await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
 await expect(page.locator('.rbt-preloader')).toBeHidden();
}
function errors(page:Page) {
 const result:string[]=[];
 page.on('pageerror',e=>result.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))result.push(m.text());});
 return result;
}
async function cart(page:Page,mobile=false) {
 if(mobile){await page.evaluate(()=>window.scrollTo(0,700));await expect(page.locator('.rbt-header-common-sticky-activation')).toHaveClass(/rbt-sticky/);}
 const trigger=mobile?'.rbt-header-common-sticky-activation.rbt-sticky .rbt-mini-cart > .rbt-cart-sidenav-activation':'header .rbt-mini-cart .rbt-cart-sidenav-activation:visible';
 await page.locator(trigger).first().click();
 const drawer=page.locator('.rbt-cart-side-menu');await expect(drawer).toHaveClass(/side-menu-active/);
 const qty=drawer.locator('.items-qty-input:visible').first();const area=qty.locator('..');
 await qty.fill('01');await area.locator('.qty-item-btn-decr').click();await expect(qty).toHaveValue('01');
 await area.locator('.qty-item-btn-incr').click();await expect(qty).toHaveValue('02');
 await drawer.locator('.minicart-close-button').click();await expect(drawer).not.toHaveClass(/side-menu-active/);
}
for(const route of ['/home','/products','/product-details','/cart','/checkout']) {
 test(`${route}: full page, shared navigation and mini cart`,async({page})=>{
  const failures=errors(page);await ready(page,route);
  await expect(page.locator('header')).toHaveCount(1);await expect(page.locator('footer')).toHaveCount(1);
  expect(await page.locator('.swiper-initialized').count()).toBeGreaterThan(5);
  await cart(page);expect(failures).toEqual([]);
 });
 test(`${route}: mobile menu and responsive layout`,async({page})=>{
  const failures=errors(page);await page.setViewportSize({width:390,height:844});await ready(page,route);
  await page.locator('.hamberger-button:visible').first().click();await expect(page.locator('.popup-mobile-menu')).toHaveClass(/active/);
  await page.locator('.popup-mobile-menu .close-button').click();await expect(page.locator('.popup-mobile-menu')).not.toHaveClass(/active/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await cart(page,true);expect(failures).toEqual([]);
 });
}

test('cart quantities, checkout input, product gallery and shop filters',async({page})=>{
 const failures=errors(page);await ready(page,'/cart');
 const qty=page.locator('app-cart > .rbt-cart-page .items-qty-input').first();
 await qty.fill('01');await qty.locator('..').locator('.qty-item-btn-incr').click();await expect(qty).toHaveValue('02');
 await page.locator('app-cart > .rbt-cart-page a[href="checkout-delivery-step-one.html"]').last().click();
 await expect(page).toHaveURL(/checkout-delivery-step-one\.html$/);await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
 await page.locator('#postcode').fill('SH 5AP');await expect(page.locator('#postcode')).toHaveValue('SH 5AP');
 const next=await page.request.get('/checkout-delivery-step-two.html');expect(next.ok()).toBeTruthy();
 await ready(page,'/product-details');
 const gallery=page.locator('.product-single-slider-two-activation').first();
 await page.locator('.product-single-slider-two-thumb-activation .swiper-slide-visible').nth(1).locator('button').click();
 await expect.poll(()=>gallery.evaluate((el:any)=>el.swiper.realIndex)).toBe(1);
 await ready(page,'/products');
 await page.locator('label[for="cat-list-1"]').first().click();await expect(page.locator('#cat-list-1').first()).toBeChecked();
 const collapse=page.locator('aside a[href="#rbt-collapse-3"]').first();await collapse.click();
 await expect(page.locator('aside #rbt-collapse-3').first()).not.toHaveClass(/show/);
 await expect(page).toHaveURL(/\/products$/);expect(failures).toEqual([]);
});

test('Angular route changes clean up global handlers and keep a single shared cart',async({page})=>{
 const failures=errors(page);await ready(page,'/home');await page.evaluate(()=>{(window as any).testIdentity='same-page';});
 const count=()=>page.evaluate(()=>{const $=(window as any).jQuery;return [window,document,document.body].map(target=>Object.values($._data(target,'events')||{}).flat().filter((e:any)=>e.namespace?.includes('inkersStorefront')).length);});
 const before=await count();
 for(const target of ['shop.html','product-single-default.html','cart.html','checkout-delivery-step-one.html','home-fashion.html']) {
  await page.locator(`a[href="${target}"]`).first().evaluate((link:HTMLAnchorElement)=>link.click());
  await expect(page).toHaveURL(new RegExp('/'+target+'$'));await expect(page.locator('[data-storefront-ready]')).toHaveCount(1);
  await expect(page.locator('.rbt-cart-side-menu')).toHaveCount(1);
  expect(await page.evaluate(()=>(window as any).testIdentity)).toBe('same-page');
 }
 expect(await count()).toEqual(before);await cart(page);expect(failures).toEqual([]);
});

test('PWA installs its service worker and reloads canonical and original routes offline',async({browser})=>{
 test.setTimeout(120_000);
 const context=await browser.newContext({serviceWorkers:'allow',baseURL:'http://127.0.0.1:4302'});
 try {
  const page=await context.newPage();await ready(page,'/home');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:60_000}).toBe(true);
  const manifest=await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');expect(manifest.icons.some((icon:any)=>icon.sizes==='512x512')).toBe(true);
  for(const route of ['/products','/product-details','/cart','/checkout'])await ready(page,route);
  await context.setOffline(true);
  for(const route of ['/home-fashion.html','/shop.html','/product-single-default.html','/cart.html','/checkout-delivery-step-one.html']) {
   await ready(page,route);await expect(page.locator('header')).toHaveCount(1);
  }
 }finally{await context.close();}
});

