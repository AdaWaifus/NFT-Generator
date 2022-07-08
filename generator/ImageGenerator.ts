import {dirname, join} from 'path';
import fg from 'fast-glob';
import sharp from 'sharp';
import {Config, ChooseRestriction} from './Config';
import {normalizePath, insertStringVariables, splitAttributeAndRarity} from './utils';

const shuffleArray = <T>(arr: T[]): T[] =>
  arr.reduce(
    (shuffledArr, _, index) => {
      const rand = index + Math.floor(Math.random() * (shuffledArr.length - index));
      [shuffledArr[rand], shuffledArr[index]] = [shuffledArr[index], shuffledArr[rand]];
      return shuffledArr;
    },
    [...arr],
  );

const pickImage = (images: string[]): string => {
  const {commonImages, chanceSum} = images.reduce(
    (obj, imagePath) => {
      const {chanceSum, commonImages} = obj;
      const [, rarity] = splitAttributeAndRarity(imagePath);
      const chance = Math.max(0, rarity);

      obj.chanceSum += chance;
      [...Array(chance).keys()].forEach(index => {
        commonImages[index + chanceSum] = imagePath;
      });

      return obj;
    },
    {
      chanceSum: 0,
      commonImages: [] as string[],
    },
  );

  return shuffleArray(commonImages)[Math.floor(Math.random() * chanceSum)];
};

export interface ImageOutput {
  path: string;
  layers: string[];
  outputInfo: sharp.OutputInfo;
}

export const restrictionRemovedLayerPrefix = '<*>';

export class ImageGenerator {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  #generateImageLayers(): string[] {
    const {images, order, restrictions} = this.#config.assets;
    const chooseRestrictions: ChooseRestriction[] = [];

    return order
      .map(imagesDirectory => {
        const lowercaseDirectory = imagesDirectory.toLocaleLowerCase();
        const useGlob = (globs: string[]) =>
          fg.sync(
            globs.map(glob => normalizePath(join(imagesDirectory, glob))),
            {caseSensitiveMatch: false},
          );
        const currChooseRestrictions = chooseRestrictions
          .map(chooseObj => chooseObj[lowercaseDirectory])
          .filter(choose => choose !== undefined)
          .flat();

        const ignoreLayer = currChooseRestrictions.includes(null);
        const hasRestrictions = !!restrictions?.[lowercaseDirectory];
        const hasChooseRestrictions = !ignoreLayer && currChooseRestrictions.length > 0;

        const allImages = images.filter(imagePath => normalizePath(dirname(imagePath)) === imagesDirectory);
        const selectedImages = useGlob(
          currChooseRestrictions.filter(chooseValue => !!chooseValue) as string[],
        );
        const pickedImage = `${ignoreLayer ? restrictionRemovedLayerPrefix : ''}${pickImage(
          hasChooseRestrictions ? selectedImages : allImages,
        )}`;

        const appliedRestriction =
          hasRestrictions && pickedImage
            ? restrictions[lowercaseDirectory].find(restriction =>
                useGlob(restriction.matches).includes(pickedImage),
              )
            : null;

        if (appliedRestriction) {
          chooseRestrictions.push(appliedRestriction.choose);
        }

        return pickedImage;
      })
      .filter(Boolean);
  }

  async generate(variables: Record<string, unknown>): Promise<ImageOutput> {
    const layers = this.#generateImageLayers();
    const {assets} = this.#config;
    const {outputPath: assetsOutputPath, outputSize} = assets;
    const {width, height} = outputSize;
    const [firstLayer, ...remainingLayers] = layers.filter(
      layer => !layer.startsWith(restrictionRemovedLayerPrefix),
    );
    const outputPath = insertStringVariables(assetsOutputPath, variables);

    const composition = sharp(firstLayer, {}).composite(remainingLayers.map(layer => ({input: layer})));
    const outputInfo =
      width && height
        ? await composition.toBuffer().then(data => sharp(data).resize(width, height).toFile(outputPath))
        : await composition.toFile(outputPath);

    return {
      path: outputPath,
      layers,
      outputInfo,
    };
  }
}
