const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function edit(file, transform) { const p = path.join(root, file); fs.writeFileSync(p, transform(fs.readFileSync(p, 'utf8'))); }
for (const component of ['shared/side-cart/side-cart', 'shared/header-navigation/header-navigation', 'core/cart/cart']) {
  edit('src/app/' + component + '.component.ts', source => {
    if (source.includes("services/cart.service")) return source;
    const prefix = component.startsWith('core') ? '../../shared' : '..';
    return "import { inject } from '@angular/core';\nimport { CartService } from '" + prefix + "/services/cart.service';\n"
      + source.replace(/(export class \w+(?: extends \w+)? \{)/, '$1\n readonly cart = inject(CartService);');
  });
}
edit('src/app/shared/header-navigation/header-navigation.component.html', source =>
  source.replace(/<a\b[^>]*class="[^"]*rbt-cart-sidenav-activation[^"]*"[^>]*>[\s\S]*?<\/a>/g, anchor =>
    anchor.replace(/(<(?:span|div)[^>]*class="[^"]*access-box-count[^"]*"[^>]*>)[\s\S]*?(<\/(?:span|div)>)/g, '$1{{ cart.count() }}$2')));
edit('src/app/shared/side-cart/side-cart.component.html', source => source.replace(/<ul class="rbt-minicart-wrapper">[\s\S]*?<\/ul>/, '<app-cart-items></app-cart-items>'));
edit('src/app/core/cart/cart.component.html', source => source.replace(/<table class="rbt-transparent-table-one[\s\S]*?<\/table>/, '<app-cart-items layout="page"></app-cart-items>'));
for (const file of ['src/app/shared/side-cart/side-cart.component.html', 'src/app/core/cart/cart.component.html']) {
  edit(file, source => source.replace(/Subtotal \(2 items\)/g, 'Subtotal ({{ cart.count() }} items)')
    .replace(/(<p class="price">)\$[\d,.]+(<\/p>)/g, '$1Unavailable$2')
    .replace(/<p>Limited Item,[\s\S]*?<\/p>/, '<p>Items in your cart are not reserved until checkout.</p>'));
}
edit('src/app/shared/product-card/product-card.component.html', source =>
  source.replace(/<a[^>]*class="[^"]*rbt-cart-sidenav-activation[^"]*"[^>]*>[\s\S]*?<\/a>/g, '<app-add-to-cart [product]="product"></app-add-to-cart>'));
edit('src/app/shared/shared.module.ts', source => {
  for (const [name, file] of [['CartQuantity','cart-quantity'], ['CartItems','cart-items'], ['AddToCart','add-to-cart']]) {
    if (!source.includes("from './" + file + "/")) {
      source = "import { " + name + "Component } from './" + file + "/" + file + ".component';\n" + source;
      source = source.replace('const COMPONENTS = [', 'const COMPONENTS = [' + name + 'Component, ');
    }
  }
  return source;
});
