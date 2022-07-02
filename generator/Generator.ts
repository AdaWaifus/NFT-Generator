import sharp from 'sharp';
import {basename, dirname} from 'path';
import {mkdir, rm} from 'fs/promises';
import {getType} from 'mime';
import {Config} from './Config';
import {NFTStorageUpload} from './NFTStorage';
import {ImageGenerator} from './ImageGenerator';
import {SchemaGenerator} from './SchemaGenerator';

sharp.concurrency(1);

const checkImageValidaity = async (images: string[]) => {
  console.log(`Checking images for validity...`);

  const corruptedImages: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const currentImage = images[i];

    await sharp(currentImage)
      .toBuffer()
      .catch(() => {
        corruptedImages.push(currentImage);
      });
  }

  corruptedImages.forEach(corruptedImage => {
    console.log(`Image "${corruptedImage}" is corrupted.`);
  });

  if (corruptedImages.length > 0) {
    process.exit(1);
  }
};

export class Generator {
  readonly #config: Config;
  readonly #nftStorageUpload: NFTStorageUpload | undefined;
  #imageGenerator: ImageGenerator;
  #schemaGenerator: SchemaGenerator;

  constructor(config: Config, nftStorageUpload?: NFTStorageUpload) {
    this.#config = config;
    this.#imageGenerator = new ImageGenerator(config);
    this.#schemaGenerator = new SchemaGenerator(config);
    this.#nftStorageUpload = nftStorageUpload;
  }

  async generate(indexOffset: number = 0, batchSize: number = sharp.concurrency()): Promise<void> {
    const {amount, assets, schema} = this.#config;
    const {outputPath: assetsOutputPath, images} = assets;
    const {outputPath: schemaOutputPath} = schema;
    const finalBatchSize = Math.min(amount, batchSize);
    const assetsOutputDir = dirname(assetsOutputPath);
    const schemaOutputDir = dirname(schemaOutputPath);

    console.log(`Total images: ${amount}.`);
    console.log(`Image Output: ${assetsOutputDir}.`);
    console.log(`Schema Output: ${schemaOutputDir}.`);
    console.log(`Batch size: ${finalBatchSize}. Sharp concurrency: ${sharp.concurrency()}.`);

    await checkImageValidaity(images);

    await rm(assetsOutputDir, {recursive: true, force: true});
    await mkdir(assetsOutputDir, {recursive: true});
    await rm(schemaOutputDir, {recursive: true, force: true});
    await mkdir(schemaOutputDir, {recursive: true});

    for (let i = 0; i < amount; i += finalBatchSize) {
      console.log(`Processing batch: ${i / finalBatchSize + 1} / ${Math.ceil(amount / finalBatchSize)}...`);

      const currentBatchSize = i + finalBatchSize > amount ? amount - i : finalBatchSize;
      const promisesBatch = [...Array(currentBatchSize).keys()].map(batchCount => {
        const index = i + batchCount;
        const totalIndex = indexOffset + i + batchCount;
        const literalVariables = {index, totalIndex};

        return this.#imageGenerator.generate(literalVariables).then(async imageOutput => {
          const {path, layers, outputInfo} = imageOutput;
          const {width, height} = outputInfo;
          const formattedImageNumber = String(index).padStart(String(amount).length, '0');

          console.log(`Image ${formattedImageNumber} done. ["${basename(path)}": ${width}x${height}]`);

          const mediaType = getType(path);
          const cid = this.#nftStorageUpload
            ? await this.#nftStorageUpload.uploadFile(path).catch(() => '')
            : '';

          const schemaOutput = await this.#schemaGenerator.generate(layers, {
            ...literalVariables,
            cid,
            mediaType,
          });

          if (schemaOutput.path) {
            console.log(`Schema ${formattedImageNumber} done. ["${basename(schemaOutput.path)}"]`);
          }
        });
      });

      await Promise.all(promisesBatch);
    }
  }
}
