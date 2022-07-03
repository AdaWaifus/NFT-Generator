import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, EMPTY, of, Subject, switchMap} from 'rxjs';
import {AttributeFilter, IAttributesFromServer, ICurrentFilter, ServerCollection} from './view-gallery.models';
import {CurrentFilter} from "./view-gallery.classes";
import {filterCollection, mapAttributesFromServer, mapCollectionFromServer} from "../../app.helper";
import {HttpClient} from "@angular/common/http";

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

  public get getCollection2() {
    return combineLatest([
      this.collectionFromServer,
      this.filter,
      this.loadMore,
    ]).pipe(filterCollection);
  }

  // get the collection from the server and map it to front interface
  private get collectionFromServer() {
    return this.httpClient
      .get<ServerCollection[]>(environment.apiUrl + 'collection')
      .pipe(mapCollectionFromServer); // map using rxjs the json from server to a front end format
  }

  public get getCollection() {
    return this.httpClient
      .get<ServerCollection[]>(environment.apiUrl + 'collection')
      .pipe(mapCollectionFromServer);
  }

  // get the attributes from the php server
  public get getAttributes() {
    return this.httpClient
      .get<IAttributesFromServer>(environment.apiUrl + 'attributes')
      .pipe(mapAttributesFromServer); // map json data from the server to front interfaces using rxjs/map
  }

  private get currentFilter() {
    const f = this._currentFilter.getValue();
    return new CurrentFilter(f);
  }

  constructor(private httpClient: HttpClient) {}

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
