import { HttpClient } from "@angular/common/http"
import { combineLatest, delay, filter, map, Observable, of, shareReplay, startWith, switchMap, take, withLatestFrom } from "rxjs"
import { Asset, CurrentFilter } from "./view-gallery.classes"
import { IAttributes, ICurrentFilter } from "./view-gallery.models"
import { Summary } from "./view-gallery.service"
function sortByNumber(a: Asset, b: Asset) {
    const aN = +a.nft.name.substring(11);
    const bN = +b.nft.name.substring(11);
    return aN - bN;
}

let _assets: Asset[] = [];
export const assetsInCache = () => _assets;
export const setAssetsInCache = (assets: Asset[]) => {
    _assets = assets;
}

export const filterByAttributes = (currentFilter: Observable<ICurrentFilter | null>, loadMore: Observable<number>) =>
((source: Observable<Asset[]>) => {

    console.log('filterByAttributes');
    return combineLatest([currentFilter, source, loadMore]).pipe(map(([filter, assets, slice]) => {
        console.log('combinelatest', assets);
        if (!!!filter) return assets.sort(sortByNumber).slice(0, slice);


        return assets.filter(asset => {
            const filters = filter.filterByAttributes!;
            const filterKeys = Object.keys(filters);
            if (filterKeys.length === 0) return true;
            const attributeNames = Object.keys(filters);
            let totalAttributes = 0;
            let matchedAttribute = 0;
            for (const attribute of attributeNames) {
                if (attribute === 'Projects') continue;
                if (attribute === 'Collections') continue;

                const variantNames = Object.keys(filters[attribute]);
                if (variantNames.length > 0) totalAttributes++;
                for (const variantName of variantNames) {
                    if (
                        asset.nft.attributes[attribute] === variantName &&
                        filters[attribute][variantName]
                    ) {
                        matchedAttribute++;

                        break;
                    }
                    continue;
                }
            }
            return totalAttributes === matchedAttribute;
        }).sort(sortByNumber).slice(0, slice);


    }))
})

export const filterByProjectAndCollection =
    (currentFilter: Observable<ICurrentFilter | null>) =>
    ((source: Observable<Summary>) => {

        const filterdFilter = currentFilter.pipe(map((f): ICurrentFilter | null => {
            if (f && f.filterByAttributes && (!(!!!f.filterByAttributes['Projects']) || !(!!!f.filterByAttributes['Collections'])))
                return {
                    filterByNumber: f.filterByNumber, filterByAttributes: {
                        ['Projects']: f.filterByAttributes['Projects'],
                        ['Collections']: f.filterByAttributes['Collections']
                    }
                };
            return null;
        }))
        return combineLatest([filterdFilter, source]).pipe(
            map(([filters, assets]) => {
                const result: Summary = {};
                const keys = Object.keys(assets);
                for (const key of keys) {
                    // Filter by projects
                    if (filters && filters.filterByAttributes && filters.filterByAttributes['Projects']) {
                        const projectFilterKeys = Object.keys(filters.filterByAttributes['Projects']);
                        if (projectFilterKeys.length > 0 && projectFilterKeys.indexOf(key) === -1) continue;

                    }
                    result[key] = {};

                    // filter by collection
                    const collectionKeys = Object.keys(assets[key]);
                    for (const collectionKey of collectionKeys) {
                        if (filters && filters.filterByAttributes && filters.filterByAttributes['Collections']) {
                            const collectionFilterKeys = Object.keys(filters.filterByAttributes!['Collections']);

                            if (collectionFilterKeys.length > 0 && collectionFilterKeys.indexOf(collectionKey) === -1)
                                continue;
                            result[key][collectionKey] = assets[key][collectionKey];
                        } else
                            result[key][collectionKey] = assets[key][collectionKey];

                    }
                }
                return result;

            })

        );
    })
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const cache: any = {};
export const mergeAssetWithJson = (httpClient: HttpClient) => ((source: Observable<Summary>) => {
    return source.pipe(
        switchMap((summary) => {
            const result: Observable<Asset>[] = [];
            const projectKeys = Object.keys(summary);
            for (const projectKey of projectKeys) {
                const project = summary[projectKey];
                const collectionKeys = Object.keys(project);
                for (const collectionKey of collectionKeys) {

                    const collection = summary[projectKey][collectionKey];
                    const assetKeys = Object.keys(collection.assets);
                    for (const assetKey of assetKeys) {
                        const imgUrl = assetKey;
                        const jsonUrl = summary[projectKey][collectionKey].assets[assetKey];
                        const assetMerged = combineLatest([of(imgUrl), httpClient.get(jsonUrl).pipe(take(1), delay(getRandomInt(50, 250)))]).pipe(map(([url, json]) => {
                            return new Asset(url, json);
                        }))
                        result.push(assetMerged);

                    }

                }
            }



            return combineLatest(result);
        })
    )
})

export const getFiltersFromAttributes = (source: Observable<any>) => source.pipe(map(() => _assets),
    map((assets: Asset[]) => {
        const result: IAttributes[] = [];

        for (const asset of assets) {
            const attributesKeys = Object.keys(asset.nft.attributes);
            for (const attributesKey of attributesKeys) {
                const iAttribute = result.find(a => a.title === attributesKey);
                const nftAttribute = asset.nft.attributes[attributesKey];

                if (iAttribute) {
                    const iVariant = iAttribute.variants.find(a => a.name === nftAttribute);
                    if (iVariant)
                        iVariant.count++;
                    else
                        iAttribute.variants.push({ name: nftAttribute, count: 1 })
                } else {
                    result.push({ title: attributesKey, variants: [{ name: nftAttribute, count: 1 }], totalFilters: 0 })
                }
            }

        }

        return result;
    })
)

