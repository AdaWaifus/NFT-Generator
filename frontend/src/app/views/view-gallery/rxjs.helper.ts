import { HttpClient } from "@angular/common/http"
import { combineLatest, filter, map, Observable, of, switchMap, withLatestFrom } from "rxjs"
import { Asset, CurrentFilter } from "./view-gallery.classes"
import { ICurrentFilter } from "./view-gallery.models"
import { Summary } from "./view-gallery.service"

export const filterByAttributes = (currentFilter: Observable<ICurrentFilter | null>) =>
((source: Observable<Asset[]>) => {


    return combineLatest([currentFilter, source]).pipe(map(([filter, assets]) => {
        if (!!!filter) return assets;



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
        })


    }))
})

export const filterByProjectAndCollection =
    (currentFilter: Observable<ICurrentFilter | null>) =>
    ((source: Observable<Summary>) => {

        const filterdFilter = currentFilter.pipe(map((f): ICurrentFilter | null => {
            console.log('filter stuff');
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
                console.log('map stuff', filters);
                const result: Summary = {};
                const keys = Object.keys(assets);
                for (const key of keys) {
                    // Filter by projects
                    if (filters && filters.filterByAttributes && filters.filterByAttributes['Projects']) {
                        const projectFilterKeys = Object.keys(filters.filterByAttributes['Projects']);
                        console.log('projectFilterKeys.length > 0 && projectFilterKeys.indexOf(key) === -1', projectFilterKeys.length > 0 && projectFilterKeys.indexOf(key) === -1)
                        if (projectFilterKeys.length > 0 && projectFilterKeys.indexOf(key) === -1) continue;

                    }
                    result[key] = {};

                    // filter by collection
                    const collectionKeys = Object.keys(assets[key]);
                    for (const collectionKey of collectionKeys) {
                        if (filters && filters.filterByAttributes && filters.filterByAttributes['Collections']) {
                            const collectionFilterKeys = Object.keys(filters.filterByAttributes!['Collections']);
                            console.log('collectionFilterKeys.length > 0 && collectionFilterKeys.indexOf(collectionKey) === -1', collectionFilterKeys.length > 0 && collectionFilterKeys.indexOf(collectionKey) === -1)

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


export const mergeAssetWithJson = (httpClient: HttpClient) => ((source: Observable<Summary>) => {
    return source.pipe(
        switchMap((summary) => {
            console.log('mergeAssetWithJson');
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
                        const assetMerged = combineLatest([of(imgUrl), httpClient.get(jsonUrl)]).pipe(map(([url, json]) => {
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