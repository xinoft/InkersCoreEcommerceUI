import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderNavigationComponent } from './header-navigation/header-navigation.component';
import { TemplateUtilitiesComponent } from './template-utilities/template-utilities.component';
import { SideNavigationComponent } from './side-navigation/side-navigation.component';
import { SideCartComponent } from './side-cart/side-cart.component';
import { TemplateOverlaysComponent } from './template-overlays/template-overlays.component';
import { FooterComponent } from './footer/footer.component';
import { CustomerReviewsComponent } from './customer-reviews/customer-reviews.component';
import { SimilarProductsComponent } from './similar-products/similar-products.component';

const COMPONENTS = [HeaderNavigationComponent, TemplateUtilitiesComponent, SideNavigationComponent, SideCartComponent, TemplateOverlaysComponent, FooterComponent, CustomerReviewsComponent, SimilarProductsComponent];
@NgModule({ declarations: COMPONENTS, imports: [CommonModule], exports: COMPONENTS })
export class SharedModule {}
