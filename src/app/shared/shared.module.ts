import { ProductPriceComponent } from './product-price/product-price.component';
import { AddToCartComponent } from './add-to-cart/add-to-cart.component';
import { CartItemsComponent } from './cart-items/cart-items.component';
import { CartQuantityComponent } from './cart-quantity/cart-quantity.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderNavigationComponent } from './header-navigation/header-navigation.component';
import { TemplateUtilitiesComponent } from './template-utilities/template-utilities.component';
import { SideNavigationComponent } from './side-navigation/side-navigation.component';
import { SideCartComponent } from './side-cart/side-cart.component';
import { TemplateOverlaysComponent } from './template-overlays/template-overlays.component';
import { FooterComponent } from './footer/footer.component';
import { CustomerReviewsComponent } from './customer-reviews/customer-reviews.component';
import { SimilarProductsComponent } from './similar-products/similar-products.component';
import { CategoryNavigationComponent } from './category-navigation/category-navigation.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { ProductCardComponent } from './product-card/product-card.component';

const COMPONENTS = [ProductPriceComponent, AddToCartComponent, CartItemsComponent, CartQuantityComponent, HeaderNavigationComponent, TemplateUtilitiesComponent, SideNavigationComponent, SideCartComponent, TemplateOverlaysComponent, FooterComponent, CustomerReviewsComponent, SimilarProductsComponent, CategoryNavigationComponent, ProductCatalogComponent, ProductCardComponent];
@NgModule({ declarations: COMPONENTS, imports: [CommonModule, RouterModule], exports: COMPONENTS })
export class SharedModule {}
