import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {
    path: '',
    loadChildren: () =>
      import('./views/view-gallery/view-gallery.module').then(
        (m) => m.ViewGalleryModule
      ),
  },
  {path: '**', redirectTo: 'home'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
