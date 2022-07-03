import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, map, of, Subject, switchMap, combineLatest, debounceTime } from 'rxjs';
import { AttributeFilter, ICurrentFilter } from './view-gallery.models';
import { CurrentFilter } from "./view-gallery.classes";
import { HttpClient } from '@angular/common/http';
import { ViewGalleryModule } from './view-gallery.module';

@Injectable({
  providedIn: 'any',
})
export class ViewGalleryService {
  private slice = 0;
  private _currentFilter = new BehaviorSubject<ICurrentFilter | null>(null);
  private _loadMore = new Subject<boolean>();
  private httpData = this.httpClient.get<any>('projects/assets.json').pipe(map(a => a.assetFiles));
  constructor(private httpClient: HttpClient) { }

  get projects() {

    return combineLatest(([this.loadMore.pipe(debounceTime(50)), this.httpData])).pipe((map(([l, d]) => {
      console.log(l);
      return d.slice(0, l);;
    })))
  }

  get filter() {
    return this._currentFilter.asObservable();
  }

  // SEEMS NOT NEEDED
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
