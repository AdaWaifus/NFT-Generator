import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-gallery-detail-dialog',
  templateUrl: './gallery-detail-dialog.component.html',
  styleUrls: ['./gallery-detail-dialog.component.scss'],
})
export class GalleryDetailDialogComponent {
  private poolPmUrl = 'https://pool.pm/';
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  openPoolPm(fingerprint: string) {
    window.open(`${this.poolPmUrl}${fingerprint}`, '_blank');
  }
}
