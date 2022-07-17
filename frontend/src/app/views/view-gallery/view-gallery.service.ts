import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, map, of, Subject, switchMap, combineLatest, debounceTime, shareReplay, observable, combineLatestAll, forkJoin, mergeAll, mergeMap, concatAll, zip, zipAll } from 'rxjs';
import { AttributeFilter, IAttributes, IAttributesFromServer, ICurrentFilter, IVariant, ServerCollection } from './view-gallery.models';
import { CurrentFilter } from "./view-gallery.classes";
import { HttpClient } from '@angular/common/http';
import { environment } from 'frontend/src/environments/environment';
import { filterCollection, mapCollectionFromServer, mapAttributesFromServer } from '../../app.helper';

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
  private _currentFilter = new BehaviorSubject<ICurrentFilter | null>(null);
  private _loadMore = new Subject<boolean>();
  private httpData = this.httpClient.get<Summary>('projects/summary.json').pipe(shareReplay());
  constructor(private httpClient: HttpClient) { }

  getAssets() {
    const assets = this.httpData;

    return combineLatest([this._currentFilter.asObservable(), assets]).pipe(map(([filter, assets]) => {
      console.log(filter);
      const result: any = { assets: {} };
      const keys = Object.keys(assets);
      for (const key of keys) {
        if (filter && filter.filterByAttributes && filter.filterByAttributes['Projects']) {
          const projectFilterKeys = Object.keys(filter.filterByAttributes['Projects']);
          if (projectFilterKeys.length > 0 && projectFilterKeys.indexOf(key) === -1)
            continue;
        }

        const collectionKeys = Object.keys(assets[key]);
        for (const collectionKey of collectionKeys) {

          if (filter && filter.filterByAttributes && filter.filterByAttributes['Collections']) {
            const collectionFilterKeys = Object.keys(filter.filterByAttributes!['Collections']);
            if (collectionFilterKeys.length > 0 && collectionFilterKeys.indexOf(collectionKey) === -1)
              continue;

          }

          const assetsKeys = Object.keys(assets[key][collectionKey].assets);
          for (const assetsKey of assetsKeys) {
            result.assets[assetsKey] = assets[key][collectionKey].assets[assetsKey];
          }
        }
      }
      // if (filter)
      // this.filterByAttributes(result, filter);
      return result;
    }));
  }

  getCollections(project: string) {
    return this.httpData.pipe((map(d => {
      return Object.keys(d[project]);
    })))
  }

  get projects() {
    return this.httpData.pipe((map(d => {
      return Object.keys(d);
    })))
  }

  get filters() {

    const rarity = this.httpData.pipe(
      mergeMap(summary => {
        const result = [];
        const keys = Object.keys(summary);
        for (const key of keys) {
          const collectionKeys = Object.keys(summary[key]);
          for (const collectionKey of collectionKeys) {
            result.push(this.httpClient.get<any>(summary[key][collectionKey].rarity))
          }
        }
        return combineLatest(result).pipe(map((a) => a.reduce((prev, current) => {
          const keys = Object.keys(current);
          for (const key of keys) {
            if (!!!prev[key]) prev[key] = [];
            prev[key].push(...current[key]);
          }
          return prev;
        }, {})),
          map(a => {
            const result: IAttributes[] = [];
            const keys = Object.keys(a);
            for (const key of keys) {
              const attr = a[key];
              result.push({
                title: key,
                totalFilters: 0,
                variants: attr.map((aa: any) => {
                  return {
                    name: aa.attributeValue,
                    count: aa.count
                  }
                })
              })
            }
            return result;
          })
        );
      }),
    );

    const projectAndCollection = this.httpData.pipe(map(summary => {
      const keys = Object.keys(summary);

      const result: IAttributes[] = [{
        title: 'projects',
        totalFilters: 0,
        variants: keys.map(p => {
          const v: IVariant = {
            name: p,
            count: Object.keys(summary[p]).reduce<number>((prev, current) => {
              prev += Object.keys(summary[p][current].assets).length;
              return prev
            }, 0)
          };
          return v;
        })
      },
      {
        title: 'collections',
        totalFilters: 0,
        variants: keys.reduce<Array<IVariant>>((prev, p) => {
          prev.push(...Object.keys(summary[p]).map(col => {
            const v: IVariant = {
              name: col,
              count: Object.keys(summary[p][col].assets).length
            }
            return v;
          }));
          return prev;
        }, [])
      }];
      return result;
    }))

    return combineLatest([rarity, projectAndCollection]).pipe(map(([r, pc]) => {
      const result = [];
      result.push(...pc, ...r);
      return result;
    }))
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
    );
  }

  // public get getCollection2() {
  //   return combineLatest([
  //     this.collectionFromServer,
  //     this.filter,
  //     this.loadMore,
  //   ]).pipe(filterCollection);
  // }

  // get the collection from the server and map it to front interface
  // private get collectionFromServer() {
  //   return this.httpClient
  //     .get<ServerCollection[]>(environment.apiUrl + 'collection')
  //     .pipe(mapCollectionFromServer); // map using rxjs the json from server to a front end format
  // }

  // public get getCollection() {
  //   return this.httpClient
  //     .get<ServerCollection[]>(environment.apiUrl + 'collection')
  //     .pipe(mapCollectionFromServer);
  // }

  // // get the attributes from the php server
  // public get getAttributes() {
  //   return this.httpClient
  //     .get<IAttributesFromServer>(environment.apiUrl + 'attributes')
  //     .pipe(mapAttributesFromServer); // map json data from the server to front interfaces using rxjs/map
  // }

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

  // this code will filter by attributes
  // could be improvded oneday
  filterByAttributes(collection: any[], filter: ICurrentFilter) {
    if (!filter) return collection;
    if (!filter.filterByAttributes) return collection;

    return collection.filter((d: any) => {
      const filters = filter.filterByAttributes!;
      if (Object.keys(filters).length === 0) return true;
      const attributeNames = Object.keys(filters);
      let totalAttributes = 0;
      let matchedAttribute = 0;
      for (const attribute of attributeNames) {
        const variantNames = Object.keys(filters[attribute]);
        if (variantNames.length > 0) totalAttributes++;
        for (const variantName of variantNames) {
          if (
            d.attributes[attribute] === variantName &&
            filters[attribute][variantName]
          ) {
            matchedAttribute++;

            break;
          }
          continue;
        }
      }
      return totalAttributes === matchedAttribute;
    });
  }
}
