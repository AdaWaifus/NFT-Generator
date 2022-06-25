import {basename} from 'path';
import {CLI} from './src/CLI';
import {Config} from './src/Config';
import {NFTStorageUpload} from './src/NFTStorage';
import {Generator} from './src/Generator/Generator';
import {RarityCollector} from './src/RarityCollector';
import {PreviewAnimation} from './src/PreviewAnimation';

import {projectsGlob, nftStorageApiKey} from './config.json';

const main = async () => {
  const cliAnswers = await CLI(projectsGlob);
  const isBuild = cliAnswers['action'] === 'build';
  const isRarityCollection = cliAnswers['action'] === 'collect rarity';
  const isPreviewAnimation = cliAnswers['action'] === 'preview animation';
  const configPaths = (cliAnswers['configPaths'] || []) as string[];
  const configs = configPaths.map(configPath => new Config(configPath));

  if (isBuild) {
    const batchSize = cliAnswers['batchSize'] || undefined;
    const upload = cliAnswers['upload'] || false;
    const nftStorageUpload = upload ? new NFTStorageUpload(nftStorageApiKey) : undefined;
    let sharedIndex = 0;
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const configPath = configPaths[i];
      console.log(`===========================================`);
      console.log(`Generate Images and Schemas ${basename(configPath)} at totalIndex: ${sharedIndex}:`);
      console.log(`===========================================`);

      const generator = new Generator(config, nftStorageUpload);
      await generator.generate(sharedIndex, batchSize);

      sharedIndex += config.amount;
    }
  }
  if (isRarityCollection || isBuild) {
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const configPath = configPaths[i];
      console.log(`===========================================`);
      console.log(`Collecting Rarity ${basename(configPath)}:`);
      console.log(`===========================================`);

      const collector = new RarityCollector(config);
      await collector.collect();
    }
  }
  if (isPreviewAnimation || isBuild) {
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const configPath = configPaths[i];
      console.log(`===========================================`);
      console.log(`Preview Animation ${basename(configPath)}:`);
      console.log(`===========================================`);

      const previewAnimation = new PreviewAnimation(config);
      await previewAnimation.generate();
    }
  }
};

main();
