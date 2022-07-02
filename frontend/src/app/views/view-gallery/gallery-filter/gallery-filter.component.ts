import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AttributeFilter, IAttributes} from '../view-gallery.models';

@Component({
  selector: 'app-gallery-filter',
  templateUrl: './gallery-filter.component.html',
  styleUrls: ['./gallery-filter.component.scss'],
})
export class GalleryFilterComponent {
  @Input() attributes: IAttributes[] = [];
  @Output() filterChange = new EventEmitter<AttributeFilter>();

  onChangeFilter(attributeName: string, filter: AttributeFilter) {
    filter.attributeName = attributeName;
    this.filterChange.emit(filter);
  }
}
