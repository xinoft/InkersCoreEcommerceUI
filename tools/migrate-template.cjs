const fs = require('node:fs');
const path = require('node:path');
const { parse, serializeOuter } = require('parse5');
const root = path.resolve(__dirname, '..');
const source = path.resolve(root, '../Template/dest');
const pages = [
 {name:'home',file:'home-fashion',title:'Home Fashion'},
 {name:'product-list',file:'shop',title:'Shop'},
 {name:'product-details',file:'product-single-default',title:'Product Details'},
 {name:'cart',file:'cart',title:'Cart'},
 {name:'checkout',file:'checkout-delivery-step-one',title:'Checkout Delivery Details'},
];
const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value||'';
const pascal=s=>s.split('-').map(p=>p[0].toUpperCase()+p.slice(1)).join('');
const shared = new Map();
function html(n) {
 // Escape Angular control-flow characters in static template text; preserve all source elements.
 return serializeOuter(n).replace(/javascript:void\(0\);?/gi,'#').replace(/@/g,'&#64;').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;');
}
function sharedTag(group,kind,n,page) {
 if(!shared.has(group)) shared.set(group,new Map());
 const kinds=shared.get(group);
 if(!kinds.has(kind)) kinds.set(kind,new Map());
 const variants=kinds.get(kind);const markup=Array.isArray(n)?n.map(html).join('\n'):html(n);
 if(!variants.has(markup)) variants.set(markup,[]);
 variants.get(markup).push(page.name);
 return `<app-${group} kind="${kind}" variant="${page.name}"></app-${group}>`;
}
for(const page of pages) {
 const doc=parse(fs.readFileSync(path.join(source,page.file+'.html'),'utf8'));
 const body=doc.childNodes.find(n=>n.tagName==='html').childNodes.find(n=>n.tagName==='body');
 const nodes=body.childNodes.filter(n=>n.tagName&&n.tagName!=='script');
 const result=[];
 for(let index=0;index<nodes.length;index++) {
  const n=nodes[index], cls=attr(n,'class'), id=attr(n,'id');
  if(n.tagName==='header') result.push(sharedTag('header-navigation','header',n,page));
  else if(/popup-mobile-menu|rbt-offcanvas-cat-side-menu|rbt-special-offprds-side-menu/.test(cls)) result.push(sharedTag('side-navigation',cls.includes('popup-mobile')?'mobile':cls.includes('offcanvas-cat')?'categories':'special-offers',n,page));
  else if(cls.includes('rbt-cart-side-menu')) result.push(sharedTag('side-cart','cart',n,page));
  else if(cls.includes('rbt-collapsible-content-section')&&nodes[index+1]?.tagName==='footer') result.push(sharedTag('footer','footer',[n,nodes[++index]],page));
  else if(n.tagName==='footer') result.push(sharedTag('footer','footer',n,page));
  else if(/\bmodal\b|rbt-comparison-message-area/.test(cls)) result.push(sharedTag('template-overlays',id||'comparison-message',n,page));
  else if(/rbt-preloader|rbt-toolbar|rbt-toaster|rbt-progress-parent|close_side_menu|common-close_search_dropdown/.test(cls)) result.push(sharedTag('template-utilities',id||cls.split(' ')[0],n,page));
  else if(cls.includes('rbt-countdown-area')&&['cart','checkout'].includes(page.name)) result.push(sharedTag('customer-reviews','reviews',n,page));
  else if(cls.includes('rbt-bg-color-gray-white')&&['cart','checkout'].includes(page.name)) result.push(sharedTag('similar-products','products',n,page));
  else result.push(html(n));
 }
 const folder=path.join(root,'src/app/core',page.name);fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,page.name+'.component.html'),result.join('\n\n'));
 fs.writeFileSync(path.join(folder,page.name+'.component.css'),':host { display: contents; }\n');
 fs.writeFileSync(path.join(folder,page.name+'.component.ts'),`import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TemplatePage } from '../template-page';

@Component({
 selector: 'app-${page.name}',
 standalone: false,
 templateUrl: './${page.name}.component.html',
 styleUrl: './${page.name}.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class ${pascal(page.name)}Component extends TemplatePage {
 protected override readonly pageTitle = '${page.title}';
}
`);
}
function variantMarkup(variants) {
 const entries=[...variants.entries()];
 if(entries.length===1)return entries[0][0];
 return entries.map(([markup,names],index)=>`${index===0?'@if':index===entries.length-1?'@else':'@else if'}${index===entries.length-1?'':` (${names.map(n=>`variant() === '${n}'`).join(' || ')})`} {\n${markup}\n}`).join('\n');
}
for(const [group,kinds] of shared) {
 const folder=path.join(root,'src/app/shared',group);fs.mkdirSync(folder,{recursive:true});
 const markup=kinds.size===1?variantMarkup([...kinds.values()][0]):`@switch (kind()) {\n${[...kinds].map(([kind,variants])=>`@case ('${kind}') {\n${variantMarkup(variants)}\n}`).join('\n')}\n}`;
 fs.writeFileSync(path.join(folder,group+'.component.html'),markup);
 fs.writeFileSync(path.join(folder,group+'.component.css'),':host { display: contents; }\n');
 fs.writeFileSync(path.join(folder,group+'.component.ts'),`import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { StorefrontPage } from '../models/storefront-page';

@Component({
 selector: 'app-${group}',
 standalone: false,
 templateUrl: './${group}.component.html',
 styleUrl: './${group}.component.css',
 changeDetection: ChangeDetectionStrategy.OnPush,
 preserveWhitespaces: true,
})
export class ${pascal(group)}Component {
 readonly variant = input<StorefrontPage>('home');
 readonly kind = input('');
}
`);
}
const groups=[...shared.keys()];
fs.writeFileSync(path.join(root,'src/app/shared/shared.module.ts'),`import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
${groups.map(g=>`import { ${pascal(g)}Component } from './${g}/${g}.component';`).join('\n')}

const COMPONENTS = [${groups.map(g=>pascal(g)+'Component').join(', ')}];
@NgModule({ declarations: COMPONENTS, imports: [CommonModule], exports: COMPONENTS })
export class SharedModule {}
`);
fs.mkdirSync(path.join(root,'src/app/shared/models'),{recursive:true});
fs.writeFileSync(path.join(root,'src/app/shared/models/storefront-page.ts'),`export type StorefrontPage = ${pages.map(p=>`'${p.name}'`).join(' | ')};\n`);
fs.writeFileSync(path.join(root,'tools/template-inventory.json'),JSON.stringify({pages,shared:groups.map(group=>({component:group,kinds:[...shared.get(group)].map(([kind,v])=>({kind,variants:v.size}))}))},null,2));
console.log('Converted',pages.length,'pages with',groups.length,'shared components.');
