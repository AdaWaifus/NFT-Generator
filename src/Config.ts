import {resolve, dirname, extname, join} from 'path';
import * as fg from 'fast-glob';
import {normalizePath, insertStringVariables, insertStringVariablesIntoValues} from './utils';

const resolvePath = (basePath: string, pathToResolve?: string) =>
  normalizePath(resolve(basePath, pathToResolve || ''));

const isEmptyObject = (obj: Record<string, unknown>) =>
  obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype;

/**
 * Transforms relative path keys to absolute path keys and picks only keys which are existing in the order array.
 */
const transformOrderKeyObject = <T>(
  basePath: string,
  order: string[],
  object: Record<string, T> | undefined,
  caseSensitive: boolean = false,
): Record<string, T> =>
  Object.entries(object || {}).reduce((obj, [relativeOrderDirPath, value]) => {
    const absoluteDirPath = resolvePath(basePath, relativeOrderDirPath);

    if (caseSensitive) {
      if (order.includes(absoluteDirPath)) {
        obj[absoluteDirPath] = value;
      }
    } else {
      const lowercaseDirPath = absoluteDirPath.toLocaleLowerCase();
      const lowercaseOrder = order.map(item => item.toLocaleLowerCase());
      if (lowercaseOrder.includes(lowercaseDirPath)) {
        obj[lowercaseDirPath] = value;
      }
    }

    return obj;
  }, {} as Record<string, T>);

export type ChooseRestriction = Record<string, string[] | null>;

export interface RestrictionItem {
  matches: string[];
  choose: ChooseRestriction;
}

interface Size {
  width: number;
  height: number;
}

interface RawConfigFile {
  name: string;
  amount: number;
  assets: {
    outputPath: string;
    outputSize?: Size;
    fileExtensions?: string[];
    inputPath: string;
    restrictions?: Record<string, RestrictionItem[]>;
    order: string[];
  };
  schema?: {
    outputPath: string;
    attributesKey: string;
    format: {
      name: string;
      [key: string]: unknown;
    };
  };
  rarityCollection?: {
    outputPath: string;
  };
  previewAnimation?: {
    outputPath: string;
    outputSize?: Size;
    sampleSize?: number;
    quantity?: number;
    animation?: {
      quality?: number;
      delay?: number;
      repeat?: number;
    };
  };
}

const defaultFileExtensions = ['png', 'jpg', 'jpeg'];
const validateOutputPath = (outputPath: string, outputPathType: string) => {
  const isFile = !!extname(outputPath);
  const dynamicFilename = insertStringVariables(outputPath, {index: 0}) !== outputPath;

  if (!isFile) {
    throw new Error(
      `The ${outputPathType} output path has to be a path to a file instead of to a directory.`,
    );
  }
  if (!dynamicFilename) {
    throw new Error(`The ${outputPathType} output path has to have the {index} variable in the filename.`);
  }
};

export class Config {
  constructor(absoluteConfigPath: string) {
    const resolvedRawConfig = require(absoluteConfigPath) as Record<string, unknown>;
    const configDirectory = dirname(absoluteConfigPath);
    const variableTypes = ['string', 'number', 'boolean'];

    const rawConfig = insertStringVariablesIntoValues<RawConfigFile>(
      resolvedRawConfig,
      Object.keys(resolvedRawConfig).reduce((obj, key) => {
        const isVariableValue = variableTypes.includes(typeof resolvedRawConfig[key]);
        if (isVariableValue) {
          obj[key] = resolvedRawConfig[key];
        }
        return obj;
      }, {} as Record<string, unknown>),
    );

    const {assets, schema, rarityCollection, previewAnimation} = rawConfig;
    const {outputPath: rawSchemaOutputPath} = schema || {};
    const {
      restrictions: rawAssetsRestrictions,
      outputSize: rawAssetsOutputSize,
      outputPath: rawAssetsOutputPath,
      inputPath: rawAssetsInputPath,
      fileExtensions: rawAssetsFileExtensions,
      order: rawAssetsOrder,
    } = assets;

    const assetsInputPath = resolvePath(configDirectory, rawAssetsInputPath);
    const fileExtensions = Array.from(
      new Set(defaultFileExtensions.concat(rawAssetsFileExtensions || [])), // use set to remove duplicates
    );
    const order = rawAssetsOrder.map(relativeOrderDirPath =>
      resolvePath(assetsInputPath, relativeOrderDirPath),
    );

    const validRestrictions = transformOrderKeyObject(assetsInputPath, order, rawAssetsRestrictions);
    const validRestrictionsWithValidChoose = Object.keys(validRestrictions).reduce((obj, key) => {
      const restrictions = validRestrictions[key];
      const validatedRestrictions = restrictions
        .map(restriction => ({
          matches: restriction.matches,
          choose: transformOrderKeyObject(assetsInputPath, order, restriction.choose),
        }))
        .filter(restriction => !isEmptyObject(restriction.choose));

      if (validatedRestrictions.length > 0) {
        obj[key] = validatedRestrictions;
      }

      return obj;
    }, {} as Record<string, RestrictionItem[]>);

    const {width: outputWidth, height: outputHeight} = rawAssetsOutputSize || {};
    const outputSize = {
      width: outputWidth,
      height: outputHeight,
    };

    this.amount = rawConfig.amount;
    this.assets = {
      outputPath: resolvePath(configDirectory, rawAssetsOutputPath),
      outputSize,
      order,
      fileExtensions,
      restrictions: validRestrictionsWithValidChoose,
      images: order
        .map(imagesDirectory =>
          fg.sync(
            fileExtensions.map(fileExtension =>
              normalizePath(join(imagesDirectory, `**/*.${fileExtension}`)),
            ),
            {caseSensitiveMatch: false},
          ),
        )
        .flat(),
    };
    this.schema = {
      attributesKey: schema?.attributesKey || 'attributes',
      format: schema?.format || {name: ''},
      outputPath: resolvePath(configDirectory, rawSchemaOutputPath),
    };
    this.rarityCollection = {
      outputPath: rarityCollection?.outputPath
        ? resolvePath(configDirectory, rarityCollection?.outputPath)
        : undefined,
    };
    this.previewAnimation = {
      outputPath: previewAnimation?.outputPath
        ? resolvePath(configDirectory, previewAnimation?.outputPath)
        : undefined,
      sampleSize:
        Math.max(1, previewAnimation?.sampleSize || 1) || Math.max(1, Math.min(rawConfig.amount, 10)),
      quantity: Math.max(1, previewAnimation?.quantity || 1),
      outputSize: {
        width: previewAnimation?.outputSize?.width,
        height: previewAnimation?.outputSize?.height,
      },
      animation: {
        delay: previewAnimation?.animation?.delay || 800,
        repeat: previewAnimation?.animation?.repeat || 0,
        quality: previewAnimation?.animation?.quality || 10,
      },
    };
    validateOutputPath(this.assets.outputPath, 'assets');
    validateOutputPath(this.schema.outputPath, 'schema');
    if (this.previewAnimation?.outputPath) {
      validateOutputPath(this.previewAnimation.outputPath, 'previewAnimation');
    }
  }

  amount: number;
  assets: {
    outputPath: string;
    outputSize: Partial<Size>;
    order: string[];
    images: string[];
    fileExtensions: string[];
    restrictions: Record<string, RestrictionItem[]>;
  };
  schema: {
    outputPath: string;
    attributesKey: string;
    format: {
      name: string;
      [key: string]: unknown;
    };
  };
  rarityCollection: {
    outputPath?: string;
  };
  previewAnimation: {
    outputPath?: string;
    sampleSize: number;
    quantity: number;
    outputSize: Partial<Size>;
    animation: {
      quality: number;
      delay: number;
      repeat: number;
    };
  };
}
