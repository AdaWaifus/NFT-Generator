import path, { basename, dirname } from 'path';

const rarityDelimiter = '#';
const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizePath = (path: string) => path.replace(/\\/g, '/');

export const splitAttributeAndRarity = (imagePath: string, fallbackRarity: number = 1): [string, number] => {
  const [name, rarity] = basename(imagePath).split(rarityDelimiter);
  const nameWithoutExtension = name.replace(/\.[^/.]+$/, '');
  const rarityNumber = parseInt(rarity, 10);

  return [nameWithoutExtension, isNaN(rarityNumber) ? fallbackRarity : rarityNumber];
};
export const mapArrayToRelativePath = (arr: string[]) => arr.map(a => mapToRelativePath(a));
export const mapToRelativePath = (p: string) => path.relative(process.cwd(), p);

export const getAttributeKeyValuePairs = (
  order: string[],
  images: string[],
  restrictionRemovedLayerPrefix?: string,
  restrictionRemovedAttributeValue?: string,
) => {
  return images
    .map(imagePath => {
      if (restrictionRemovedLayerPrefix && restrictionRemovedAttributeValue) {
        if (imagePath.startsWith(restrictionRemovedLayerPrefix)) {
          return [
            basename(dirname(imagePath.substring(restrictionRemovedLayerPrefix.length))),
            restrictionRemovedAttributeValue,
          ];
        }
      }

      const imageDirectory = order.find(
        imageDirectory => normalizePath(dirname(imagePath)) === imageDirectory,
      );

      return imageDirectory ? [basename(dirname(imagePath)), splitAttributeAndRarity(imagePath)[0]] : [];
    })
    .filter(pair => pair.length > 0)
    .sort(([keyA], [KeyB]) => keyA.localeCompare(KeyB, 'en')) as [string, string][];
};

/**
 * Inserts variables into a string which looks like a template
 * @param str The target string
 * @param variables An object which contains the variables. The key is name and the value is the value of the variable.
 * @returns The input string with all found variable literals replaced.
 */
export const insertStringVariables = (str: string, variables: Record<string, unknown>): string => {
  const evalVariablesStr = Object.keys(variables).reduce((variablesStr, key) => {
    const isNumber = typeof variables[key] === 'number';
    const quotationMark = isNumber ? '' : '"';
    const value = variables[key];
    return variablesStr + `const ${key} = ${quotationMark}${value}${quotationMark};`;
  }, '');

  return Object.keys(variables).reduce((replacedStr, key) => {
    // get all parts which are variables
    const variablesMatches = replacedStr.match(/([{}])\1|[{](.*?)(?:!(.+?))?[}]/g);

    if (variablesMatches) {
      // replace the variables with an evaluation if possible
      return variablesMatches.reduce((replacedKeyMatchStr, keyMatch) => {
        let replacement = keyMatch;
        try {
          replacement = String(eval(`${evalVariablesStr}${keyMatch};`));
        } catch (e) { }

        return replacedKeyMatchStr.replace(new RegExp(escapeRegExp(keyMatch), 'g'), replacement);
      }, replacedStr);
    }

    return replacedStr;
  }, str);
};

/**
 * Iterates through an object deeply and inserts variables to all found string literals.
 * @param obj The target object.
 * @param variables An object which contains the variables. The key is name and the value is the value of the variable.
 * @returns The target object but with replaces string literals.
 */
export const insertStringVariablesIntoValues = <T = Record<string, unknown>>(
  obj: Record<string, unknown> | unknown[],
  variables: Record<string, unknown>,
) =>
  Object.keys(obj).reduce(
    (resultObj, key) => {
      const value = resultObj[key];
      const valueIsString = value && typeof value === 'string';
      const valueIsObject = value && typeof value === 'object';
      const valueIsArray = Array.isArray(value);

      if (valueIsString) {
        resultObj[key] = insertStringVariables(value, variables);
      }
      if (valueIsObject || valueIsArray) {
        const result = insertStringVariablesIntoValues(
          value as Record<string, unknown> | unknown[],
          variables,
        );
        resultObj[key] = valueIsArray ? Object.values(result) : result;
      }

      return resultObj;
    },
    { ...obj } as Record<string, unknown>,
  ) as T;
