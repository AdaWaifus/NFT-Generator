"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
// read the projects folder
var projects = (0, fs_1.readdirSync)('projects').filter(function (item) { return !(/(^|\/)\.[^\/\.]/g).test(item); });
console.log("Total of ".concat(projects.length, " found"), projects);
for (var _i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
    var project = projects_1[_i];
    console.log("Reading ".concat(project));
    var projectConfigs = (0, fs_1.readdirSync)("projects/".concat(project));
    console.log(projectConfigs);
}
