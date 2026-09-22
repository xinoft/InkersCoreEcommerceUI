// Preserve the complete shop template, binding only fields supported by the public APIs.
const fs = require('node:fs');
const path = require('node:path');
const { parse, serializeOuter } = require('parse5');
const root = path.resolve(__dirname, '..');
const attr = (n,k) => n.attrs?.find(a => a.name === k)?.value || '';
const has = (n,c) => attr(n,'class').split(' ').includes(c);
const walk = (n, fn) => { fn(n); for(const child of n.childNodes || []) walk(child,fn); };
const all = (n,fn) => {const nodes=[]; walk(n,x=>{if(fn(x))nodes.push(x);}); return nodes;};
const set = (n,k,v) => {n.attrs ||= []; const a=n.attrs.find(a=>a.name===k); if(a)a.value=v; else n.attrs.push({name:k,value:v});};
const remove = (n,k) => {n.attrs=n.attrs.filter(a=>a.name!==k);};
const marker = text => ({nodeName:'#text',value:text});
const replace = (n,s) => {const parent=n.parentNode; parent.childNodes[parent.childNodes.indexOf(n)]=marker(s);};
const html = n => serializeOuter(n).replace(/javascript:void\(0\);?/gi,'#').replace(/@/g,'&#64;').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;');
const doc=parse(fs.readFileSync(path.join(root,'../Template/dest/shop.html'),'utf8'));
const area=all(doc,n=>has(n,'rbt-shop-filter-area'))[0];
const card=all(area,n=>has(n,'rbt-product-card'))[0];
const column=card.parentNode, grid=column.parentNode;
const columnClass=attr(column,'class');
set(card,'[attr.data-product-id]','product.id');
const inner=all(card,n=>has(n,'inner'))[0];set(inner,'class','inner catalog-reveal');
const images=all(card,n=>n.tagName==='img');
for(let i=0;i<images.length;i++){
 remove(images[i],'src');remove(images[i],'alt');set(images[i],'[src]',i===0?'image()':'hoverImage()');set(images[i],'[alt]','product.name');
 set(images[i],'(error)','imageFailed($event)');set(images[i],'loading','lazy');
}
replace(all(card,n=>has(n,'rbt-card-subtitle'))[0],'__LIVE_CARD_CATEGORIES__');
const title=all(card,n=>has(n,'rbt-card-title'))[0];title.childNodes[0].childNodes=[marker('__PRODUCT_NAME__')];
title.parentNode.childNodes.splice(title.parentNode.childNodes.indexOf(title)+1,0,marker('__PRODUCT_DESCRIPTION__'));
const stock=all(card,n=>has(n,'rbt-badge'))[0];stock.childNodes=[marker('__STOCK__')];set(stock,'[class.rbt-badge-bg-green]','product.stockCount > 0');
const compare=all(card,n=>has(n,'rbt-compare-btn-activation'))[0];set(compare,'(click)','compare($event)');set(compare,'[class.added-compare]','compared()');
card.childNodes.push(marker('__PRODUCT_INFORMATION__'));
let cardMarkup=html(card).replaceAll('__PRODUCT_NAME__','{{ product.name }}')
 .replace('__STOCK__',"{{ product.stockCount > 0 ? product.stockCount + ' in Stock' : 'Out of stock' }}")
 .replace('__PRODUCT_DESCRIPTION__','<p class="catalog-code">Code: {{ product.code }}</p>\n@if (product.shortDescription) { <p class="catalog-summary">{{ product.shortDescription }}</p> }')
 .replace('__LIVE_CARD_CATEGORIES__','<div class="rbt-card-subtitle rbt-card-catagories-text">@for (category of product.categories; track category.id; let last = $last) { <a routerLink="/products" [queryParams]="{ categoryId: category.id }">{{ category.name }}</a>{{ last ? "" : ", " }} }</div>')
 .replace('__PRODUCT_INFORMATION__',fs.readFileSync(path.join(__dirname,'product-information.html'),'utf8'));
fs.mkdirSync(path.join(root,'src/app/shared/product-card'),{recursive:true});
fs.writeFileSync(path.join(root,'src/app/shared/product-card/product-card.component.html'),'@let product = item();\n'+cardMarkup+'\n');
// Keep grid wrappers and all surrounding filters/toolbars/pagination from the source.
grid.childNodes=[marker('__LIVE_PRODUCTS__')];
const categories=all(area,n=>n.tagName==='div'&&attr(n,'id')==='rbt-collapse-3');
categories.forEach((n,i)=>{n.childNodes=[marker('__CATEGORY_FILTER_'+i+'__')];});
// The original desktop/mobile filters duplicate IDs. Scope the mobile IDs and their references.
const mobile=all(area,n=>has(n,'rbt-filter-offcanvas-area'))[0];
const identifiers=new Map(all(mobile,n=>attr(n,'id')).map(n=>[attr(n,'id'),'mobile-'+attr(n,'id')]));
walk(mobile,n=>{for(const a of n.attrs||[]){if(['id','for','aria-controls','aria-labelledby'].includes(a.name)&&identifiers.has(a.value))a.value=identifiers.get(a.value);else if(['href','data-bs-target'].includes(a.name)&&a.value.startsWith('#')&&identifiers.has(a.value.slice(1)))a.value='#'+identifiers.get(a.value.slice(1));}});
let markup=html(area).replace(/Showing 1–20 of 45 results\s*/,"{{ resultSummary() }}")
 .replace('__CATEGORY_FILTER_0__','<ng-container *ngTemplateOutlet="categoryFilter; context: { prefix: \'desktop\' }"></ng-container>')
 .replace('__CATEGORY_FILTER_1__','<ng-container *ngTemplateOutlet="categoryFilter; context: { prefix: \'mobile\' }"></ng-container>')
 .replace('__LIVE_PRODUCTS__',
 '@if (state().status === "loading") { <p class="mt--24" role="status">Loading products…</p> }\n'+
 '@else if (state().status === "error") { <div class="mt--24" role="alert"><p>{{ state().message }}</p><button class="rbt-btn rbt-btn-sm" type="button" (click)="retry()">Retry products</button></div> }\n'+
 '@else if (state().result; as result) {\n'+
 '@if (!result.items.length) { <p class="mt--24" role="status">No products found{{ result.categoryId ? " in this category or its subcategories" : "" }}.</p> }\n'+
 '@for (product of result.items; track product.id) { <div class="'+columnClass+'"><app-product-card [item]="product"></app-product-card></div> }\n}');
markup+='\n'+fs.readFileSync(path.join(__dirname,'product-category-filter.html'),'utf8');
fs.writeFileSync(path.join(root,'src/app/shared/product-catalog/product-catalog.component.html'),markup+'\n');
