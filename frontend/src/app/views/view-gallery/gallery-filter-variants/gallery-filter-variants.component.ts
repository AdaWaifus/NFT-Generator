import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AttributeFilter, IVariant} from '../view-gallery.models';
import {removeItemFromList} from '../../../app.utilities';

@Component({
  selector: 'app-gallery-filter-variants',
  templateUrl: './gallery-filter-variants.component.html',
  styleUrls: ['./gallery-filter-variants.component.scss'],
})
export class GalleryFilterVariantsComponent {
  @Input() variants!: IVariant[];
  @Output() filterChange = new EventEmitter<AttributeFilter>();
  @Output() totalFiltersChange = new EventEmitter<number>();
  public searchValue!: string;
  public selectedValues: string[] = [];

  changeFilter(variant: string, value: boolean) {
    if (value) this.selectedValues.push(variant);
    if (!value) {
      removeItemFromList(this.selectedValues, variant);
    }
    this.filterChange.emit({attributeName: '', value, variant});
    this.totalFiltersChange.emit(this.selectedValues.length);
  }
  onSearchChange(event: Event) {
    const element = event.target as HTMLInputElement;
    this.searchValue = element.value;
  }
}
