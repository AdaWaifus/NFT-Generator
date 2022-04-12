import {writeFile} from 'fs/promises';
import {Config} from './../Config';
import {insertStringVariables, insertStringVariablesIntoValues, getAttributeKeyValuePairs} from './../utils';

export interface SchemaOutput {
  path: string | null;
}

export class SchemaGenerator {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  async generate(imageLayers: string[], variables: Record<string, unknown>): Promise<SchemaOutput> {
    const {assets, schema} = this.#config;
    const {outputPath: schemaOutputPath} = schema;
    const outputPath = insertStringVariables(schemaOutputPath, variables);

    if (schema) {
      const {format, attributesKey} = schema;
      const {order} = assets;
      const attributesObj =
        typeof format[attributesKey] === 'object' ? (format[attributesKey] as object) : {};
      const adaptedFormat = insertStringVariablesIntoValues(
        {
          ...format,
          [attributesKey]: {
            ...attributesObj,
          },
        },
        variables,
      );

      getAttributeKeyValuePairs(order, imageLayers).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, adaptedFormat[attributesKey] as Record<string, string>);

      await writeFile(outputPath, JSON.stringify(adaptedFormat, null, 2));
    }
    return {
      path: schema ? outputPath : null,
    };
  }
}
