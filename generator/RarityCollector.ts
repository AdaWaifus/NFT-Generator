import { dirname, join } from 'path';
import { readdir, writeFile } from 'fs/promises';
import { Config } from './Config';
import { normalizePath, getAttributeKeyValuePairs } from './utils';

export interface RarityEntry {
  attributeValue: string;
  count: number;
  percent: number;
}

export class RarityCollector {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  async collect(): Promise<[string, Record<string, RarityEntry[]>]> {
    const { amount, assets, schema, rarityCollection } = this.#config;
    const { outputPath: schemaOutputPath, attributesKey } = schema;
    const { images, order } = assets;
    const { outputPath } = rarityCollection;
    const schemaOutputDir = dirname(schemaOutputPath);
    const schemaPaths = (await readdir(dirname(schemaOutputPath)).catch(() => [])).map(schemaFilename =>
      normalizePath(join(schemaOutputDir, schemaFilename)),
    );

    if (outputPath && schemaPaths.length > 0) {
      const result = getAttributeKeyValuePairs(order, images).reduce((obj, [key, value]) => {
        const rarityEntries: RarityEntry[] = obj[key] || [];
        const newRarityEntry = {
          attributeValue: value,
          count: 0,
          percent: 0,
        };
        rarityEntries.push(newRarityEntry);

        if (!obj[key]) {
          obj[key] = rarityEntries;
        }

        return obj;
      }, {} as Record<string, RarityEntry[]>);

      schemaPaths.forEach(schemaPath => {
        const resolvedSchema = require(schemaPath) as Record<string, any>;
        const potentialAttributesObj: Record<string, string> = resolvedSchema[attributesKey];
        const attributeKeys = Object.keys(
          potentialAttributesObj && typeof potentialAttributesObj === 'object' ? potentialAttributesObj : {},
        );
        attributeKeys.forEach(attribute => {
          const value = potentialAttributesObj[attribute];
          const rarityEntries = result[attribute];
          if (rarityEntries) {
            const rarityEntry = rarityEntries.find(rarityEntry => rarityEntry.attributeValue === value);

            if (rarityEntry) {
              rarityEntry.count += 1;
              rarityEntry.percent = Math.round((rarityEntry.count / (amount / 100)) * 100) / 100;
            }
          }
        });
      });

      console.log(`Rarity collected in: ${outputPath}`);
      await writeFile(outputPath, JSON.stringify(result, null, 2));
      return [outputPath, result];
    } else {
      console.log(`Nothing to collect.`);
      return ['', {}];
    }
  }
}
