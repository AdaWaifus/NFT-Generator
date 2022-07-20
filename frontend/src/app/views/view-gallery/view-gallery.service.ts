import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  map,
  of,
  Subject,
  switchMap,
  debounceTime,
  tap,
  startWith,
  take,
  distinctUntilChanged
} from 'rxjs';
import {
  AttributeFilter,
  ICurrentFilter,
} from './view-gallery.models';
import { CurrentFilter } from './view-gallery.classes';
import { HttpClient } from '@angular/common/http';
import { getFiltersFromAttributes, mergeAssetWithJson, filterByAttributes, setAssetsInCache, assetsInCache } from './rxjs.helper';
export interface Summary {
  [key: string]: SummaryProject;
}
export interface SummaryProject {
  [key: string]: SummarySeason;
}

export interface SummarySeason {
  rarity: string;
  assets: { [key: string]: string };
}

@Injectable({
  providedIn: 'any',
})
export class ViewGalleryService {
  private slice = 20;
  private _isLoadingAssets = new BehaviorSubject<Boolean>(false);
  private _isFiltering = new BehaviorSubject<Boolean>(false);
  private _currentFilter = new BehaviorSubject<ICurrentFilter | null>(null);
  private _loadMore = new Subject<boolean>();
  private httpData = this.httpClient.get<Summary>('projects/summary.json');
  private _visiblePct: number = 0;
  constructor(private httpClient: HttpClient) { this.loadAssets() }

  get isLoadingAssets() {
    return this._isLoadingAssets.asObservable();
  }
  loadAssets() {
    this._isLoadingAssets.next(true);
    this.httpData.pipe(mergeAssetWithJson(this.httpClient), take(1)
    ).subscribe((assets) => {
      setAssetsInCache(assets);
      this._isLoadingAssets.next(false);
      this._isLoadingAssets.complete();
    })
  }
  getAssets() {
    const debounceFilter = this._currentFilter.asObservable().pipe(debounceTime(500))
    const assets2 = of(EMPTY).pipe(
      map(() => assetsInCache()),
      filterByAttributes(debounceFilter, this.loadMore),
      tap(() => this._isFiltering.next(false)),
      tap(() => {

        if (this._visiblePct === 100)
          setTimeout(() =>
            this.loadNext(),
            500)
      }),
      distinctUntilChanged()
    );
    return assets2;

  }
  setIsFiltering(value: boolean) {
    this._isFiltering.next(value);
  }
  get isFiltering() {
    return this._isFiltering.asObservable();
  }

  get filters() {
    return of(EMPTY).pipe(
      getFiltersFromAttributes
    )
  }

  get filter() {
    return this._currentFilter.asObservable();
  }

  get loadMore() {
    return this._loadMore.asObservable().pipe(
      switchMap(f => {
        if (f === true) {
          this.slice += 20;
          return of(this.slice);
        } else return EMPTY;
      }),
      startWith(this.slice)
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
  setVisiblePct(value: number) {
    this._visiblePct = value;
  }

  loadNext() {
    this._loadMore.next(true);
  }
}
