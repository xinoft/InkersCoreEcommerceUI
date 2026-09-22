const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function edit(file, transform) { const p=path.join(root,file); fs.writeFileSync(p,transform(fs.readFileSync(p,'utf8'))); }
edit('src/app/shared/shared.module.ts', s => s.includes("from './product-price/") ? s :
 "import { ProductPriceComponent } from './product-price/product-price.component';\n"+s.replace('const COMPONENTS = [','const COMPONENTS = [ProductPriceComponent, '));
edit('src/app/shared/product-card/product-card.component.html', s => s
 .replace('<span class="price-text">$23.00 - $134.98</span>','<app-product-price [product]="product"></app-product-price>')
 .replaceAll('href="product-single-default.html"','routerLink="/product-details" [queryParams]="{ productId: product.id }"'));
for(const file of ['src/app/shared/side-cart/side-cart.component.html','src/app/core/cart/cart.component.html']) {
 edit(file,s=>s.replace(/(<p>Subtotal \(\{\{ cart.count\(\) \}\} items\)<\/p>\s*)<p class="price">Unavailable<\/p>/,
 '$1<p class="price">{{ cart.subtotal() != null ? (cart.subtotal() | currency:\'USD\':\'symbol\':\'1.2-2\') : \'Unavailable\' }}</p>'));
}
edit('src/app/core/product-details/product-details.component.html', s => {
 if(!s.includes('@let selectedProduct')) s='@let selectedProduct = state().product;\n@if (state().message) { <div class="container py-3" role="status">{{state().message}}</div> }\n'+s;
 return s.replace(/<h2 class="rbt-card-title mt--12">[\s\S]*?<\/h2>/,'<h2 class="rbt-card-title mt--12">{{ selectedProduct?.name || "Product details" }}</h2>')
 .replace(/<p class="description-text b2 mt--16">[\s\S]*?<\/p>/,'<p class="description-text b2 mt--16">{{ selectedProduct?.shortDescription }}</p>')
 .replace('<p> HN-508801</p>','<p>{{ selectedProduct?.code }}</p>')
 .replace(/<div class="pricing-part mt--0">[\s\S]*?<\/div>/,'<div class="pricing-part mt--0"><app-product-price [product]="selectedProduct"></app-product-price></div>')
 .replace(/<del class="price-text rbt-text-semi-bold rbt-text-color-gray-400">[^<]*<\/del>\s*<span class="price-text rbt-text-bold rbt-text-color-heading">[^<]*<\/span>/,'<app-product-price [product]="selectedProduct"></app-product-price>')
 .replace(/<h2 class="rbt-title mb--0 rbt-text-bold h6">[\s\S]*?<\/h2>/,'<h2 class="rbt-title mb--0 rbt-text-bold h6">{{ selectedProduct?.name }}</h2>')
 .replace('<p class="rbt-desc">Accessibility Statement Wi-Fi 512GB Gray Space....</p>','<p class="rbt-desc">{{selectedProduct?.shortDescription}}</p>');
});
edit('src/app/core/product-details/product-details.component.ts', s => s.includes('readonly state = toSignal') ? s : "import { inject } from '@angular/core';\nimport { ActivatedRoute } from '@angular/router';\nimport { toSignal } from '@angular/core/rxjs-interop';\nimport { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';\nimport { EcommerceProductsService } from '../../shared/services/ecommerce-products.service';\nimport { StorefrontProduct } from '../../shared/models/storefront-product';\n" + s.replace(' protected override readonly pageTitle', " private readonly products = inject(EcommerceProductsService);\n readonly state = toSignal(inject(ActivatedRoute).queryParamMap.pipe(\n  map(params => params.get('productId')), distinctUntilChanged(),\n  switchMap(value => {\n   const id = Number(value);\n   if (!value || !Number.isSafeInteger(id) || id <= 0) return of({product: null as StorefrontProduct | null, message: 'Select a product from the product listing to view its pricing.'});\n   return this.products.get(id).pipe(\n    map(product => ({product: product as StorefrontProduct | null, message: ''})),\n    catchError(() => of({product: null as StorefrontProduct | null, message: 'Unable to load this product. Please refresh and try again.'})),\n    startWith({product: null as StorefrontProduct | null, message: 'Loading product…'})\n   );\n  })\n ), {initialValue: {product: null as StorefrontProduct | null, message: 'Loading product…'}});\n" + ' protected override readonly pageTitle'));
