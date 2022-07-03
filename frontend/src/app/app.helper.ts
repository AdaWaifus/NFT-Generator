import { map } from 'rxjs/operators';
import {IAttributesFromServer, ICurrentFilter, ServerCollection} from "./views/view-gallery/view-gallery.models";
import {Attributes, Collection, Variant} from "./views/view-gallery/view-gallery.classes";

// Mapping server data to front interfaces
export const mapAttributesFromServer = map((d: IAttributesFromServer) => {
  const result = [];
  const keys = Object.keys(d);
  for (const key of keys) {
    const attribute = new Attributes(
      key,
      d[key].map((d) => new Variant(d.variant, d.count))
    );
    result.push(attribute);
  }
  return result;
});

export const mapCollectionFromServer = map((data: ServerCollection[]) =>
  data.map((d) => new Collection(d))
);

export const filterCollection = map(
  ([collection, filter, slice = 20]: [
    Collection[],
    ICurrentFilter | null,
    number
  ]) => {
    //if no filter return the collection
    if (!filter) return collection.slice(0, slice);
    collection = filterByAttributes(collection, filter);
    collection = filterByNumber(collection, filter);

    return collection.slice(0, slice);
  }
);

function filterByNumber(collection: Collection[], filter: ICurrentFilter) {
  if (!filter) return collection;
  if (!filter.filterByNumber) return collection;

  return collection.filter((d: Collection) => {
    const number = filter.filterByNumber!;
    return d.sort === number;
  });
}
// this code will filter by attributes
// could be improvded oneday
function filterByAttributes(collection: Collection[], filter: ICurrentFilter) {
  if (!filter) return collection;
  if (!filter.filterByAttributes) return collection;

  return collection.filter((d: Collection) => {
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
