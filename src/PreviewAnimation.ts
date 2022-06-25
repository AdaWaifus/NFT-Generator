import {dirname} from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import sharp from 'sharp';
import {Config} from './Config';
import {insertStringVariables} from './utils';
import {createCanvas, loadImage} from 'canvas';
import GIFEncoder from 'gifencoder';

interface Size {
  width: number;
  height: number;
}

const getCanvasSize = async (
  preferredSize: Partial<Size>,
  imagesOutputSize: Partial<Size>,
  imagePaths: string[],
): Promise<Size> => {
  const {width: prefWidth, height: prefHeight} = preferredSize;
  const {width: imgWidth, height: imgHeight} = imagesOutputSize;

  if (prefWidth && prefHeight) {
    return {
      width: prefWidth,
      height: prefHeight,
    };
  }

  if (imgWidth && imgHeight) {
    return {
      width: imgWidth,
      height: imgHeight,
    };
  }

  const image = sharp(imagePaths[0]);
  const {width = 0, height = 0} = await image.metadata();

  return {
    width,
    height,
  };
};

export class PreviewAnimation {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  async generate(): Promise<void> {
    const {assets, previewAnimation} = this.#config;
    const imagesDirectory = dirname(assets.outputPath);
    const imagePaths = fg.sync(`${imagesDirectory}/*`);
    const {width, height} = await getCanvasSize(previewAnimation.outputSize, assets.outputSize, imagePaths);

    const {quantity, sampleSize, animation, outputPath: previewAnimationOutputPath} = previewAnimation;

    if (!width || !height) {
      throw new Error(`The canvas size could not be determined. Please specify the "outputSize" option.`);
    }

    if (!previewAnimationOutputPath) {
      throw new Error(`The "outputPath" has to be specified.`);
    }

    for (let i = 0; i < quantity; i++) {
      const {delay, repeat, quality} = animation;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const outputPath = insertStringVariables(previewAnimationOutputPath, {index: i, quantity});

      console.log(`Creating animation: ${outputPath}.`);

      const encoder = new GIFEncoder(width, height);
      encoder.createReadStream().pipe(fs.createWriteStream(outputPath));
      encoder.start();
      encoder.setRepeat(repeat);
      encoder.setDelay(delay);
      encoder.setQuality(quality);

      for (let j = 0; j < sampleSize; j++) {
        const sampleImagePath = imagePaths[Math.floor(Math.random() * imagePaths.length)];
        const image = await loadImage(sampleImagePath);

        ctx.drawImage(image, 0, 0);
        encoder.addFrame(ctx);
      }

      encoder.finish();
    }
  }
}
