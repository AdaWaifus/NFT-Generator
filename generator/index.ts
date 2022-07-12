import { basename } from 'path';
import { CLI } from './CLI';
import { Config } from './Config';
import { NFTStorageUpload } from './NFTStorage';
import { Generator, ImageSchemaMap } from './Generator';
import { RarityCollector } from './RarityCollector';
import { PreviewAnimation } from './PreviewAnimation';

import { projectsGlob, projectsSummary, nftStorageApiKey } from '../generator.json';
import { ProjectsSummary } from './ProjectsSummary';
import { mapToRelativePath } from './utils';

export type ProjectCollectionSummary = {
  [projectPath: string]: {
    [configPath: string]: {
      rarity: string;
      assets: {
        [imagePath: string]: string;
      };
    };
  };
};

const addToProjectCollectionSummary = (
  summary: ProjectCollectionSummary,
  projectPath: string,
  configPath: string,
  insert: string | { [imagePath: string]: string },
) => {
  const _projectPath = mapToRelativePath(projectPath);
  const _configPath = mapToRelativePath(configPath);
  if (!summary[_projectPath]) {
    summary[_projectPath] = {};
  }
  if (!summary[_projectPath][_configPath]) {
    summary[_projectPath][_configPath] = {
      rarity: '',
      assets: {},
    };
  }

  if (typeof insert === 'string') {
    summary[_projectPath][_configPath].rarity = mapToRelativePath(insert);
  } else {
    summary[_projectPath][_configPath].assets = insert;
  }
};

const main = async () => {
  const cliAnswers = await CLI(projectsGlob);
  const isBuild = cliAnswers['action'] === 'build';
  const isRarityCollection = cliAnswers['action'] === 'collect rarity';
  const isPreviewAnimation = cliAnswers['action'] === 'preview animation';
  const projectPath = cliAnswers['projectPath'];
  const configPaths = (cliAnswers['configPaths'] || []) as string[];
  const configs = configPaths.map(configPath => new Config(configPath));
  const projectCollectionSummary: ProjectCollectionSummary = {};

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
      const imageSchemaMap = await generator.generate(sharedIndex, batchSize);

      sharedIndex += config.amount;

      addToProjectCollectionSummary(projectCollectionSummary, projectPath, configPath, imageSchemaMap);
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
      const rarityCollectionPath = await collector.collect();

      addToProjectCollectionSummary(projectCollectionSummary, projectPath, configPath, rarityCollectionPath);
    }
  }

  const summary = new ProjectsSummary(projectsGlob, projectsSummary);
  await summary.generate(projectCollectionSummary);
  /*
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
    }*/
};

main();
