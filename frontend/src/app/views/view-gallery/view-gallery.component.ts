import { Component } from '@angular/core';
import { AttributeFilter, IAttributes } from './view-gallery.models';
import { Collection } from "./view-gallery.classes";
import { combineLatest, debounceTime, map, Observable } from "rxjs";
import { SummarySeason, ViewGalleryService } from "./view-gallery.service";
import { MatDialog } from "@angular/material/dialog";
import { GalleryDetailDialogComponent } from "./gallery-detail-dialog/gallery-detail-dialog.component";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-view-gallery',
  templateUrl: './view-gallery.component.html',
  styleUrls: ['./view-gallery.component.scss'],
})
export class ViewGalleryComponent {
  public collections?: Observable<string[]>;
  public assets?: Observable<SummarySeason>;
  public projects?: Observable<string[]>;
  public filters?: Observable<IAttributes[]>;
  private selectedProject: string = '';

  constructor(public viewGalleryService: ViewGalleryService, private matDialog: MatDialog) {
    this.projects = viewGalleryService.projects;
  }

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
  selectProject(project: string) {
    this.selectedProject = project;
    this.collections = this.viewGalleryService.getCollections(project);
  }
  selectCollection(collection: string) {
    this.assets = this.viewGalleryService.getAssets(this.selectedProject, collection);
  }
}
