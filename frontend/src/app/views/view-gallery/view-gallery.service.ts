import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  map,
  of,
  Subject,
  switchMap,
  combineLatest,
  debounceTime,
  shareReplay,
  tap,
  mergeMap,
  startWith,
  empty
} from 'rxjs';
import {
  AttributeFilter,
  IAttributes,
  ICurrentFilter,
  IVariant,
} from './view-gallery.models';
import { CurrentFilter } from './view-gallery.classes';
import { HttpClient } from '@angular/common/http';
import { filterByProjectAndCollection, mergeAssetWithJson, filterByAttributes } from './rxjs.helper';
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
  private slice = 0;
  private _isFiltering = new BehaviorSubject<Boolean>(false);
  private _currentFilter = new BehaviorSubject<ICurrentFilter | null>(null);
  private _loadMore = new Subject<boolean>();
  private httpData = this.httpClient.get<Summary>('projects/summary.json').pipe(shareReplay());
  constructor(private httpClient: HttpClient) { }

  getAssets() {
    const debounceFilter = this._currentFilter.asObservable().pipe(debounceTime(500))
    const assets2 = this.httpData.pipe(
      filterByProjectAndCollection(debounceFilter),
      mergeAssetWithJson(this.httpClient),
      filterByAttributes(debounceFilter, this.loadMore),
      tap(() => this._isFiltering.next(false))
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
    const rarity = this.httpData.pipe(
      mergeMap(summary => {
        const result: any[] = [];
        const keys = Object.keys(summary);
        for (const key of keys) {
          const collectionKeys = Object.keys(summary[key]);
          for (const collectionKey of collectionKeys) {
            if (summary[key][collectionKey].rarity)
              result.push(this.httpClient.get<any>(summary[key][collectionKey].rarity));
          }
        }
        return combineLatest(result).pipe(
          map(a =>
            a.reduce((prev, current) => {
              const keys = Object.keys(current);
              for (const key of keys) {
                if (!!!prev[key]) prev[key] = [];
                prev[key].push(...current[key]);
              }
              return prev;
            }, {}),
          ),
          map(a => {
            const result: IAttributes[] = [];
            const keys = Object.keys(a);
            for (const key of keys) {
              const attr = a[key];
              const mergedVariants: any[] = [];
              for (const variant of attr) {
                const existingVariant = mergedVariants.find(a => a.name === variant.attributeValue);
                if (existingVariant)
                  existingVariant.count += variant.count;
                else
                  mergedVariants.push({
                    name: variant.attributeValue,
                    count: variant.count,
                  })

              }
              result.push({
                title: key,
                totalFilters: 0,
                variants: mergedVariants
              });
            }
            return result;
          }),
        );
      }),
    );

    const projectAndCollection = this.httpData.pipe(
      map(summary => {
        const keys = Object.keys(summary);

        const result: IAttributes[] = [
          {
            title: 'projects',
            totalFilters: 0,
            variants: keys.map(p => {
              const v: IVariant = {
                name: p,
                count: Object.keys(summary[p]).reduce<number>((prev, current) => {
                  prev += Object.keys(summary[p][current].assets).length;
                  return prev;
                }, 0),
              };
              return v;
            }),
          },
          {
            title: 'collections',
            totalFilters: 0,
            variants: keys.reduce<Array<IVariant>>((prev, p) => {
              prev.push(
                ...Object.keys(summary[p]).map(col => {
                  const v: IVariant = {
                    name: col,
                    count: Object.keys(summary[p][col].assets).length,
                  };
                  return v;
                }),
              );
              return prev;
            }, []),
          },
        ];
        return result;
      }),
    );

    return combineLatest([rarity, projectAndCollection]).pipe(
      map(([r, pc]) => {
        const result = [];
        result.push(...pc, ...r);
        return result;
      }),
    );
  }

  get filter() {
    return this._currentFilter.asObservable();
  }

  get loadMore() {
    return this._loadMore.asObservable().pipe(
      switchMap(f => {
        if (f === true) {
          this.slice += 80;
          return of(this.slice);
        } else return EMPTY;
      }),
      startWith(80)
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
