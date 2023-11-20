export interface IAttributesFromServer {
  [key: string]: IAttributeFromServer[];
}

export interface IAttributeFromServer {
  variant: string;
  count: number;
}

export interface IAttributes {
  title: string;
  variants: IVariant[];
  totalFilters: Number;
}

export interface IVariant {
  name: string;
  count: number;
}

export interface ICurrentFilter {
  filterByNumber: number | null;
  filterByAttributes: {
    [key: string]: { [key: string]: boolean };
  } | null;
}
export interface IAsset {
  internalUrl: string;
  nft: any;
}
export interface ServerCollection {
  id: string;
  name: string;
  collection: string;
  image: string;
  season: string;
  type: string;
  accessory: string;
  background: string;
  clothing: string;
  ears: string;
  eyes: string;
  hairstyle: string;
  hands: string;
  mouth: string;
  skin: string;
  tokenName: string;
  sort: string;
  fingerprint: string;
}

export interface ICollection {
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
}

export interface AttributeFilter {
  attributeName: string;
  variant: string;
  value: boolean;
}
export interface RarityFile {
  [key: string]: RarityEntry[]
}
export interface RarityEntry {
  attributeValue: string;
  count: number;
  percent: number;
}
