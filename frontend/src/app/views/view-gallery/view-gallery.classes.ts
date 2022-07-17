import { BehaviorSubject } from 'rxjs';
import {
  AttributeFilter,
  IAsset,
  IAttributes,
  ICollection,
  ICurrentFilter,
  IVariant,
  ServerCollection,
} from './view-gallery.models';
import { camelize } from '../../app.utilities';

export class Variant implements IVariant {
  constructor(public name: string, public count: number) { }
}

export class Attributes implements IAttributes {
  public totalFilters = 0;
  constructor(public title: string, public variants: IVariant[]) { }
}

export class Asset implements IAsset {
  internalUrl: string;
  nft: any;
  constructor(url: string, jsonValues: any) {
    this.internalUrl = url;
    this.nft = jsonValues;
  }
}

// TODO ALEX PLEASE DONT USE THIS REMODELLING IN THIS PROJECT, HERE WE NEED TO USE EXACTLY THE GENERATOR CREATED METADATA WHICH CAN CHANGE IN EVERY PROJECT
export class Collection implements ICollection {
  id: number;
  name: string;
  image: string[];
  artist: string;
  twitter: string;
  homepage: string;
  publisher: string;
  artist_url: string;
  attributes: { [key: string]: string };
  sort: number;
  collection: string;
  fingerprint: string;
  constructor(serverCollection: ServerCollection) {
    this.id = +serverCollection.id;
    this.name = serverCollection.name;
    this.image = ['ipfs=//', serverCollection.image];
    this.artist = 'KIVI.ART';
    this.twitter = 'https=//twitter.com/adawaifus';
    this.homepage = 'https=//adawaifus.io';
    this.publisher = 'AdaWaifus.io';
    this.artist_url = 'https=//kivi.art';
    this.attributes = {
      Ears: serverCollection.ears,
      Eyes: serverCollection.eyes,
      Skin: serverCollection.skin,
      Type: serverCollection.type,
      Hands: serverCollection.hands,
      Mouth: serverCollection.mouth,
      Season: serverCollection.season,
      Clothing: serverCollection.clothing,
      Accessory: serverCollection.accessory,
      Hairstyle: serverCollection.hairstyle,
      Background: serverCollection.background,
    };
    this.sort = +serverCollection.sort;
    this.collection = serverCollection.collection;
    this.fingerprint = serverCollection.fingerprint;
  }
}

export class CurrentFilter implements ICurrentFilter {
  filterByNumber: number | null = null;
  filterByAttributes: { [key: string]: { [key: string]: boolean } } | null = null;

  constructor(previousFilter: ICurrentFilter | null) {
    if (!previousFilter) this.init();
    else {
      this.filterByAttributes = previousFilter.filterByAttributes;
      this.filterByNumber = previousFilter.filterByNumber;
    }
  }

  private init() {
    this.filterByAttributes = {};
  }

  setNumberFilter(number: number, subject: BehaviorSubject<ICurrentFilter | null>) {
    this.filterByNumber = number;
    subject.next(this);
  }

  setAttributeFilter(attributeFilter: AttributeFilter, subject: BehaviorSubject<ICurrentFilter | null>) {
    const attributeName = camelize(attributeFilter.attributeName);
    if (!attributeFilter.value) {
      delete this.filterByAttributes![attributeName][attributeFilter.variant];
      subject.next(this);
      return;
    }
    if (!this.filterByAttributes![attributeName]) this.filterByAttributes![attributeName] = {};
    this.filterByAttributes![attributeName][attributeFilter.variant] = attributeFilter.value;
    subject.next(this);
  }
}
