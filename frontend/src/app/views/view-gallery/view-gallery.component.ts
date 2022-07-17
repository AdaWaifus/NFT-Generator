import {Component} from '@angular/core';
import {AttributeFilter, IAttributes} from './view-gallery.models';
import {Observable} from 'rxjs';
import {SummarySeason, ViewGalleryService} from './view-gallery.service';
import {MatDialog} from '@angular/material/dialog';
import {GalleryDetailDialogComponent} from './gallery-detail-dialog/gallery-detail-dialog.component';

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
    this.filters = viewGalleryService.filters;
    this.assets = this.viewGalleryService.getAssets();
  }

  filterChange(filter: AttributeFilter) {
    this.viewGalleryService.setAttributeFilter(filter);
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

  selectProject(project: string) {
    this.selectedProject = project;
    this.collections = this.viewGalleryService.getCollections(project);
  }

  selectCollection(collection: string) {}
}
