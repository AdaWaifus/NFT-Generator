import fg from 'fast-glob';
import inquirer from 'inquirer';
import {basename, join} from 'path';
import {normalizePath} from './utils';

export const CLI = async (projectsGlob: string) => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Please select your action:',
      choices: ['build', 'collect rarity', 'preview animation'],
    },
    {
      type: 'list',
      name: 'projectPath',
      message: 'Please select your project:',
      choices: () => {
        const projects = fg.sync(projectsGlob, {onlyDirectories: true, absolute: true});
        return projects.map(projectPath => ({
          name: basename(projectPath),
          value: projectPath,
        }));
      },
    },
    {
      type: 'checkbox',
      name: 'configPaths',
      message: 'Please select your project:',
      choices: (answers: inquirer.Answers) => {
        const project = answers['projectPath'];
        const configs = fg.sync(normalizePath(join(project, '/*')), {onlyFiles: true, absolute: true});
        return configs.map(configPath => ({
          name: basename(configPath),
          value: configPath,
          checked: true,
        }));
      },
      when: (answers: inquirer.Answers) => answers['projectPath'],
    },
    {
      type: 'number',
      name: 'batchSize',
      message: 'Please select the batch size:',
      default: 1,
      when: (answers: inquirer.Answers) => answers['action'] === 'build' && answers['configPaths'].length > 0,
    },
    {
      type: 'confirm',
      name: 'upload',
      message: 'Do you wanna upload the images? (default: No)',
      default: false,
      when: (answers: inquirer.Answers) => answers['action'] === 'build' && answers['configPaths'].length > 0,
    },
  ]);

  return answers;
};
