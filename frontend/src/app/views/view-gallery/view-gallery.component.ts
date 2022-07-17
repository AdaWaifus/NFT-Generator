import { Component } from '@angular/core';
import { AttributeFilter, IAttributes } from './view-gallery.models';
import { Observable } from 'rxjs';
import { SummarySeason, ViewGalleryService } from './view-gallery.service';
import { MatDialog } from '@angular/material/dialog';
import { GalleryDetailDialogComponent } from './gallery-detail-dialog/gallery-detail-dialog.component';
import { Asset } from './view-gallery.classes';

@Component({
  selector: 'app-view-gallery',
  templateUrl: './view-gallery.component.html',
  styleUrls: ['./view-gallery.component.scss'],
})
export class ViewGalleryComponent {
  public assets?: Observable<Asset[]>;
  public filters?: Observable<IAttributes[]>;
  public isFiltering: Observable<Boolean>;

  constructor(public viewGalleryService: ViewGalleryService, private matDialog: MatDialog) {
    this.filters = viewGalleryService.filters;
    this.assets = this.viewGalleryService.getAssets();
    this.isFiltering = this.viewGalleryService.isFiltering;
  }

  filterChange(filter: AttributeFilter) {
    this.viewGalleryService.setIsFiltering(true);
    this.viewGalleryService.setAttributeFilter(filter);
  }

  openDetailDialog(item: Asset) {
    this.matDialog.open(GalleryDetailDialogComponent, {
      data: item,
      panelClass: 'detail-dialog',
    });
  }

  onSearchChange(event: Event | null) {
    if (!event) {
      this.viewGalleryService.setNumberFilter(0);
      return;
    }
    this.viewGalleryService.setNumberFilter(+(event.target as HTMLInputElement).value);
  }

  onVisible(event: any) {
    if (event === true)
      this.viewGalleryService.loadNext();
  }

  trackByNumber(index: number, item: Asset) {
    return +item.nft.name.substring(11);
  }

}
