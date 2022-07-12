import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewGalleryComponent } from './view-gallery.component';
import { ViewGalleryRoutingModule } from './view-gallery-routing.module';
import { MatModule } from '../../shared/mat.module';
import { GalleryFilterComponent } from './gallery-filter/gallery-filter.component';
import { GalleryFilterVariantsComponent } from './gallery-filter-variants/gallery-filter-variants.component';
import { FilterPipe } from '../../pipes/filter.pipe';
import { GalleryDetailDialogComponent } from './gallery-detail-dialog/gallery-detail-dialog.component';
import { IntersectionObserverDirective } from '../../directives/intersection-observer.directive';
import { HttpClientModule } from '@angular/common/http';
import { ToObjectKeys } from '../../pipes/toObjectKeys.pipe';
import { UrlEncodedPipe } from '../../pipes/url-encoded';

@NgModule({
  declarations: [
    ViewGalleryComponent,
    GalleryFilterComponent,
    GalleryFilterVariantsComponent,
    GalleryDetailDialogComponent,
    FilterPipe,
    ToObjectKeys,
    UrlEncodedPipe,
    IntersectionObserverDirective,
  ],
  imports: [CommonModule, ViewGalleryRoutingModule, MatModule, HttpClientModule],
})
export class ViewGalleryModule { }
