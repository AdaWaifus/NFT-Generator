import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, map, of, Subject, switchMap, combineLatest, debounceTime, shareReplay, observable } from 'rxjs';
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

  getAssets(project: string, collection: string) {
    return this.httpData.pipe((map(d => {
      return d[project][collection];
    })))
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
    return this.httpData.pipe(map(summary => {
      const keys = Object.keys(summary);

      const result: IAttributes[] = [{
        title: 'projects',
        totalFilters: keys.length,
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
        totalFilters: keys.reduce<number>((prev, p) => {
          prev += Object.keys(summary[p]).length;
          return prev;
        }, 0),
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
}
