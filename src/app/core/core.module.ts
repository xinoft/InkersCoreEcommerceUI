import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'home-fashion.html', component: HomeComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'shop.html', component: ProductListComponent },
  { path: 'product-details', component: ProductDetailsComponent },
  { path: 'product-single-default.html', component: ProductDetailsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'cart.html', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'checkout-delivery-step-one.html', component: CheckoutComponent },
  { path: '**', redirectTo: '' },
];
@NgModule({
 declarations: [LoginComponent, HomeComponent, ProductListComponent, ProductDetailsComponent, CartComponent, CheckoutComponent],
 imports: [ReactiveFormsModule, CommonModule, SharedModule, RouterModule.forChild(routes)],
})
export class CoreModule {}
