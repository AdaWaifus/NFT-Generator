import {basename} from 'path';
import Table from 'cli-table';
import clc from 'cli-color';
import {CLI} from './CLI';
import {Config} from './Config';
import {NFTStorageUpload} from './NFTStorage';
import {Generator, ImageSchemaMap} from './Generator';
import {RarityCollector} from './RarityCollector';
import {PreviewAnimation} from './PreviewAnimation';

import {projectsGlob, projectsSummary, nftStorageApiKey} from '../generator.json';
import {ProjectsSummary} from './ProjectsSummary';
import {mapToRelativePath} from './utils';

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
  insert: string | {[imagePath: string]: string},
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
      const [rarityCollectionPath, rarityCollection] = await collector.collect();

      if (isRarityCollection) {
        const layers = Object.keys(rarityCollection);
        var table = new Table({
          head: ['Layer', 'Attribute', 'Amount', 'Rarity %'],
        });

        layers.forEach(layer => {
          const rarityEntries = rarityCollection[layer];

          rarityEntries.forEach((rarityEntry, i) => {
            const {attributeValue, count, percent} = rarityEntry;
            let countColor = count === 0 ? clc.bgRed : clc;
            let percentColor = percent < 5 ? clc.bold.black.bgCyanBright : clc;
            percentColor = percent < 1 ? clc.bold.black.bgYellowBright : percentColor;
            percentColor = percent === 0 ? clc.bold.black.bgRed : percentColor;

            table.push({
              [i === 0 ? layer : '']: [
                attributeValue,
                countColor(` ${count} `),
                percentColor(` ${percent}% `),
              ],
            });
          });
        });
        console.log(table.toString());
      }

      addToProjectCollectionSummary(projectCollectionSummary, projectPath, configPath, rarityCollectionPath);
    }
  }

  const summary = new ProjectsSummary(projectsGlob, projectsSummary);
  await summary.generate(projectCollectionSummary);
  if (isPreviewAnimation) {
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
