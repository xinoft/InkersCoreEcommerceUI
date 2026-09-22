# InkersCoreEcommerceUI

Angular **22.1.7** / CLI **22.1.8** PWA, rebuilt with the requested `CoreModule` and `SharedModule`. Every component has its own folder containing its TypeScript, HTML and CSS files. The original `Template` folder is unchanged. Public categories are provided by the ERP API.

## Start the application

Use Node 24 LTS (verified with 24.18.1).

```sh
npm ci
npm start
```

Development: http://localhost:4300

For the installable PWA and offline support:

```sh
npm run build
npm run preview
```

Production/PWA preview: http://localhost:4302. Install from your browser's app installation menu. Service workers are enabled in production. A deployed installation needs HTTPS; localhost supports local PWA testing.

## Requested structure

```text
src/app/
  app-module.ts
  app-routing-module.ts
  core/
    core.module.ts
    template-page.ts
    home/
      home.component.ts
      home.component.html
      home.component.css
    product-list/
      product-list.component.ts
      product-list.component.html
      product-list.component.css
    product-details/
      product-details.component.ts
      product-details.component.html
      product-details.component.css
    cart/
      cart.component.ts
      cart.component.html
      cart.component.css
    checkout/
      checkout.component.ts
      checkout.component.html
      checkout.component.css
  shared/
    shared.module.ts
    category-navigation/
    product-catalog/
    product-card/
    header-navigation/
    side-navigation/
    side-cart/
    footer/
    template-overlays/
    template-utilities/
    customer-reviews/
    similar-products/
    models/
    services/
      template-runtime.service.ts
```

`CoreModule` is lazy loaded and declares the five page components. `SharedModule` declares and exports the shared UI components. Shared components accept typed page variants and a section kind where necessary, so the home header/footer and inner-page header/footer can preserve their different original layouts. Repeated reviews, recommendations, modal dialogs and utility controls are also shared.

These are actual NgModules, with non-standalone component declarations. The components use signal inputs, OnPush change detection and Angular's built-in control flow. Templates are compiled Angular HTML, not runtime `innerHTML` or iframe copies. Wrapper elements use `display: contents` to retain the original layout and responsive styling.

## Public ecommerce categories

The header, sticky header and both mobile menu tabs use the shared component in
`src/app/shared/category-navigation/`. A root-provided service shares one anonymous
`GET /api/ecommerce/categories` request between these instances. It displays the saved
category tree and order, supports hover/touch/keyboard submenus, and provides loading,
empty and retry states. Categories are not cached offline by the service worker.

Start the API with its InkersCore launch profile (HTTPS port 7264), then run `npm start`.
`proxy.conf.json` forwards `/api/ecommerce/**` to that API; restart the Angular dev server
after changing the proxy. No login or bearer token is needed. Restart the API after
building the new controller if an older instance is still running.

For production, forward `/api/ecommerce/*` from the storefront origin to the API, keeping
that path unchanged. If using another API origin, override the `ECOMMERCE_API_URL`
injection token and configure the corresponding allowed origin on the API.
The local PWA preview forwards this public path to `https://localhost:7264` by default;
set `ECOMMERCE_API_ORIGIN` to change its target. Its relaxed localhost development
certificate validation is only for this preview server.

Category links navigate to `/products?categoryId=<id>`. The separate `product-catalog`
component calls `GET /api/ecommerce/products?categoryId=<id>` anonymously and displays
products assigned to that category or any visible descendant. Omitting the category
lists all active products, including uncategorized products. Results are not paginated.
Multiple matching category assignments never duplicate a product. An unknown/hidden
category returns 404; malformed/nonpositive IDs return 400. Empty categories return 200
with an empty `items` array. Old requests are cancelled when the selection changes.

The product response contains `categoryId`, `categoryName`, `totalCount`, and `items`.
Each product provides ID, name, code, slug, short/full descriptions, category assignments,
stock count, created/updated dates, and public file metadata/URLs. The listing shows these
fields inside the original template product cards; expand Product information for full
descriptions and files. Images have a fallback. The original filters, sorting controls,
pagination, category carousel, badges, example prices/ratings, cart/compare buttons, and
shipping/specification sections are retained for later integration. Prices, ratings,
brand specifications, and non-category filters are still template placeholders because
those APIs do not exist yet. The category checkboxes use the current single-category
API and include descendant categories. Cart/compare/quick-view retain template behavior. Product details, cart, checkout, and the separate promotional
category drawer still use template data.

Run product browser checks with `npx playwright test tests/products.spec.ts`.
The generator preserves the live category and product components.
`tools/prepare-product-catalog.cjs` restores the complete shop layout and first product
card from the source template, then binds supported fields. Its two HTML fragments
contain the category checkbox bindings and additional product information. Dynamic
product cards initialize and clean up their own slider and tooltip behavior.

Run the category browser checks with `npx playwright test tests/categories.spec.ts`.
The original-template visual comparison now includes intentional navigation differences.

## Pages and template sources

| Angular route | Original template |
| --- | --- |
| `/` or `/home` | `Template/dest/home-fashion.html` |
| `/products` | `Template/dest/shop.html` |
| `/product-details` | `Template/dest/product-single-default.html` |
| `/cart` | `Template/dest/cart.html` |
| `/checkout` | `Template/dest/checkout-delivery-step-one.html` |

The corresponding original `.html` URLs are also Angular routes. Links between these five pages use client-side navigation. Placeholder actions and Bootstrap tab/collapse links stay on their current page. The mini cart is the shared `SideCartComponent` and is available on every page.

Unconverted template pages are included as static compatibility destinations, so existing links to other demos, product variants, account pages and later checkout steps retain their original targets. Only the five requested pages have been migrated into Angular. Later checkout steps remain static template demos.

## Styling, animations and behavior

`public/assets` contains copies of the original CSS, images, fonts and vendor libraries. The original CSS files load in their original order in `src/index.html`. Page and shared templates retain the original classes, responsive structure, SVGs, sliders, galleries, drawers, popups and animation hooks.

`TemplateRuntimeService` loads vendor scripts once and initializes the original template behavior after each route renders. It cleans up route-specific global handlers, timers, animation frames, observers, Swipers, Bootstrap instances and overlays on navigation. This prevents duplicate cart actions and repeated event handlers when switching pages.

The storefront retains the template's demo behavior. Cart quantity controls, gallery controls, checkbox/collapse controls, drawers and popup interactions work as supplied. There is no backend connection, persisted shopping cart, recalculated order pricing, real inventory search, login or payment processing in this UI migration.

### Source asset limitations

Many source images are intentional grey dimension placeholders. `assets/images/product-img/fashion/product-new-shoe-01-a-2.webp` contains damaged image data in the supplied template and remains invalid in this copy. These same limitations appear in the original HTML pages. Google Fonts, YouTube and map embeds retain their original URLs and need network access.

## PWA

- `public/manifest.webmanifest` defines the application identity, install display mode and icons.
- Icons reuse the original template favicon.
- `ngsw-config.json` pre-caches application bundles, original styles, fonts and behavior scripts.
- Template images are cached when requested, then refreshed with application updates. Previously viewed images remain available offline; unvisited images and external embeds require a connection.
- All five migrated routes, including their `.html` aliases, can load from the cached application shell offline after the first successful installation.
- Static compatibility pages and future API responses are not automatically cached as application navigations.

Production output is `dist/inkers-core-ecommerce-ui/browser`. Deploy its contents with existing-file serving and an `index.html` fallback for Angular routes. Keep service-worker files and the manifest at the application root. `tools/serve.mjs` is a local preview server, not a production hosting service.

## Checks

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests run against the production build and cover desktop/mobile layouts, shared mini-cart controls, cart quantities, checkout input, product galleries, shop filters, route cleanup and offline PWA navigation. They use installed Chrome; set `CHROME_PATH` to another Chrome installation if needed.

For visual comparisons, start `npm start` and `node tools/serve.mjs --reference` in separate terminals, then run:

```sh
npm run test:visual
```

The comparison checks all five pages against their original HTML at 1440, 768 and 390 pixels. It scrolls through the pages to activate reveal animations, aligns carousel positions, and writes screenshots, difference images and a JSON report into `artifacts/`. Third-party video/map frame contents are excluded, and animations are frozen only while screenshots are taken. Dimension differences, script errors or more than 0.5% differing pixels fail the check.

## Template maintenance

`tools/migrate-template.cjs` extracts the five source pages and their shared parts. Its generated component names and folders match the structure above, with no hashed view filenames. `tools/template-inventory.json` documents their sources and shared variants.

```sh
npm run template:generate
npm run template:assets
node tools/prepare-pwa-icons.cjs
```

Generation overwrites migrated page/shared templates and component declarations; preserve intentional Angular edits before rerunning it. Asset preparation copies original assets and recreates the lifecycle adapter. Keep the original `Template` folder alongside this project to use these tools. Ordinary UI changes can be made directly in each component's HTML/CSS/TypeScript files.


### Server cart

Reusable components live in shared/add-to-cart, shared/cart-items and shared/cart-quantity, each in its own folder. CartService connects them to /api/ecommerce/cart and synchronizes the header count, side cart and cart page.

Carts are stored by the API. Guests use a random HttpOnly cookie; signed-in customers use their customer session, with guest-cart merge after Google login. Reloads restore the server cart. The API validates stock, positive whole quantities, product availability and cart ownership. It supports add, set quantity, remove, clear and merge. LocalStorage is no longer the cart source.

Apply API migration 20260922131105_AddStorefrontCart before testing. See ../InkersCoreERPAPI/docs/storefront-cart.md for endpoints and setup. Product pricing and checkout/order processing are not available in the current APIs; totals remain unavailable.

Validation: npm test and npx playwright test tests/cart.spec.ts. Template generation preserves cart bindings via tools/prepare-cart.cjs.
