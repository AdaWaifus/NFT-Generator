import { readdirSync } from 'fs';


// read the projects folder
const projects = filterJunk(readdirSync('projects'));
console.log(`Total of ${projects.length} found`, projects);

for (const project of projects) {
    console.log(`Reading ${project}`);
    const projectConfigs = filterJsonFiles(filterJunk(readdirSync(`projects/${project}`)));
    console.log(projectConfigs);
}



function filterJunk(array: Array<string>) { return array.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item)); }
function filterJsonFiles(array: Array<string>) { return array.filter(item => item.endsWith('.json')); }
