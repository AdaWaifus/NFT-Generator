import {Injectable} from '@angular/core';
import {BehaviorSubject, EMPTY, of, Subject, switchMap} from 'rxjs';
import {AttributeFilter, ICurrentFilter} from './view-gallery.models';
import {CurrentFilter} from "./view-gallery.classes";

@Injectable({
  providedIn: 'root',
})
export class ViewGalleryService {
  private slice = 0;
  private _currentFilter = new BehaviorSubject<ICurrentFilter | null>(null);
  private _loadMore = new Subject<boolean>();

  get filter() {
    return this._currentFilter.asObservable();
  }

  /* SEEMS NOT NEEDED
  get loadMore() {
    return this._loadMore.asObservable().pipe(
      switchMap(f => {
        if (f === true) {
          this.slice += 20;
          return of(this.slice);
        } else return EMPTY;
      }),
    );
  }
  */

  private get currentFilter() {
    const f = this._currentFilter.getValue();
    return new CurrentFilter(f);
  }

  setAttributeFilter(attributeFilter: AttributeFilter) {
    this.slice = 0;
    this._loadMore.next(true);

    this.currentFilter.setAttributeFilter(attributeFilter, this._currentFilter);
  }
  setNumberFilter(number: number) {
    this.slice = 0;
    this._loadMore.next(true);
    this.currentFilter.setNumberFilter(number, this._currentFilter);
  }

  loadNext() {
    this._loadMore.next(true);
  }
}
