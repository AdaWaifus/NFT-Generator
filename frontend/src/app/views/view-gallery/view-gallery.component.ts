import {Component} from '@angular/core';
import {AttributeFilter, IAttributes} from './view-gallery.models';
import {Collection} from "./view-gallery.classes";
import {Observable} from "rxjs";
import {ViewGalleryService} from "./view-gallery.service";
import {MatDialog} from "@angular/material/dialog";
import {GalleryDetailDialogComponent} from "./gallery-detail-dialog/gallery-detail-dialog.component";

@Component({
  selector: 'app-view-gallery',
  templateUrl: './view-gallery.component.html',
  styleUrls: ['./view-gallery.component.scss'],
})
export class ViewGalleryComponent {
  public collection?: Observable<Collection[]>;
  public filters?: Observable<IAttributes[]>;

  constructor(public viewGalleryService: ViewGalleryService, private matDialog: MatDialog) {}

  filterChange(filter: AttributeFilter) {
    this.viewGalleryService.setAttributeFilter(filter);
  }

  trackById(index: number, item: Collection) {
    return item.id;
  }

  openDetailDialog(item: any) {
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
    if (event === true) this.viewGalleryService.loadNext();
  }
}
