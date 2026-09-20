import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
const routes: Routes = [{ path: '', loadChildren: () => import('./core/core.module').then(module => module.CoreModule) }];
@NgModule({
 imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })],
 exports: [RouterModule],
})
export class AppRoutingModule {}
