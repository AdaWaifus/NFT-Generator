import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { } from 'os';
import { sep } from 'path';

// read the projects folder
const projects = excludeJsonFiles(filterJunk(readdirSync('projects')));
console.log(`Total of ${projects.length} porject(s) found`, projects);

for (const project of projects) {
    console.log(`Reading ${project}`);
    const projectConfigs = filterJsonFiles(filterJunk(readdirSync(`projects/${project}`)));
    console.log(projectConfigs);
    for (const config of projectConfigs) {
        const config$ = JSON.parse(readFileSync(`projects/${project}/${config}`).toString());
        const { name, assets, schema, rarityCollection } = config$;
        // console.log(name, assets, schema);

        const assetPath = (assets.outputPath as String).split(sep).filter((v, i, arr) => i < arr.length - 1).join(sep).replace('{name}', name);
        const schemaPath = (schema.outputPath as String).split(sep).filter((v, i, arr) => i < arr.length - 1).join(sep).replace('{name}', name);
        const assetFiles = filterJunk(readdirSync(`projects/${project}/${assetPath}`)).map(f => encodeURIComponent(`projects/${project}/${assetPath}/${f}`));
        const schemaFiles = filterJunk(readdirSync(`projects/${project}/${schemaPath}`)).map(f => `projects/${project}/${assetPath}/${f}`);
        const rarityPath = `projects/${project}/${rarityCollection.outputPath}`.replace('{name}', name);
        const result = {
            assetFiles,
            schemaFiles,
            name,
            rarityPath
        }
        writeFileSync(`projects/assets.json`, JSON.stringify(result));
    }
}



function filterJunk(array: Array<string>) { return array.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item)); }
function filterJsonFiles(array: Array<string>) { return array.filter(item => item.endsWith('.json')); }
function excludeJsonFiles(array: Array<string>) { return array.filter(item => !item.endsWith('.json')); }
