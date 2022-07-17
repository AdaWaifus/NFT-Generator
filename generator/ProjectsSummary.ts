import path, { join } from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import { mapArrayToRelativePath, mapToRelativePath, normalizePath } from './utils';
import type { ProjectCollectionSummary } from './';

export class ProjectsSummary {
  #projectCollectionSummaryTemplate: ProjectCollectionSummary;
  #projectCollectionSummaryImport: ProjectCollectionSummary;
  #projectsSummary: string;

  constructor(projectsGlob: string, projectsSummary: string) {
    const summaryFile = fg.sync(projectsSummary, { onlyFiles: true, absolute: true });
    const projects = mapArrayToRelativePath(fg.sync(projectsGlob, { onlyDirectories: true, absolute: true }));
    this.#projectsSummary = projectsSummary;
    this.#projectCollectionSummaryTemplate = projects.reduce((projectsObj, project) => {
      const collections = mapArrayToRelativePath(fg.sync(normalizePath(join(project, '/*')), { onlyFiles: true, absolute: true }));
      projectsObj[project] = collections.reduce((collectionsObj, collection) => {
        collectionsObj[collection] = {
          rarity: '',
          assets: {},
        };
        return collectionsObj;
      }, {} as Record<string, any>);
      return projectsObj;
    }, {} as Record<string, any>);

    if (summaryFile.length === 0) {
      fs.writeFileSync(projectsSummary, JSON.stringify(this.#projectCollectionSummaryTemplate, null, 2));
    }

    this.#projectCollectionSummaryImport = require(fg.sync(projectsSummary, {
      onlyFiles: true,
      absolute: true,
    })[0]);
  }
  async generate(projectCollectionSummary: ProjectCollectionSummary) {
    const result = this.#projectCollectionSummaryImport;
    const projects = mapArrayToRelativePath(Object.keys(projectCollectionSummary))

    projects.forEach(project => {
      const projectInTemplate = Object.keys(this.#projectCollectionSummaryTemplate).includes(project);

      if (projectInTemplate) {
        const projectsObj = projectCollectionSummary[project];
        const projectCollections = Object.keys(projectsObj);
        projectCollections.forEach(projectCollection => {
          const collectionInTemplate = Object.keys(this.#projectCollectionSummaryTemplate[project]).includes(
            projectCollection
          );

          if (collectionInTemplate) {
            if (!!!result[project])
              result[project] = {};
            if (!!!result[project][projectCollection])
              result[project][projectCollection] = { rarity: '', assets: {} };
            const { rarity, assets } = result[project][projectCollection];
            const { rarity: newRarity, assets: newAssets } = projectsObj[projectCollection];
            const newAssetsEmpty = Object.keys(newAssets).length === 0;
            result[project][projectCollection] = {
              rarity: newRarity || rarity,
              assets: newAssetsEmpty ? assets : newAssets,
            };
          } else {
            delete result[project][projectCollection];
          }
        });
      } else {
        delete result[project];
      }
    });

    fs.writeFileSync(this.#projectsSummary, JSON.stringify(result, null, 2));
  }
}
