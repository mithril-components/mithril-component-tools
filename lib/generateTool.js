'use strict'

const fs   = require('fs-extra');
const path = require('path');

const translator = require('./translation-helper');

const localDir = process.cwd();
let correctedLocalDir;

const execute = (module,language) => {
    const localModuleDir = module.slice(0,-3); // TODO use regex
    const splitPath = localModuleDir.split("/");
    if (splitPath.length > 1) {
        splitPath.pop();
    }
    const splitCorrectedDir = splitPath.join("/");
    correctedLocalDir = path.join(localDir, splitCorrectedDir);

    const fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    const translationJson = generateTranslationsJSON(fileContents, language);

    // TODO use hasTranslation var to check if there could be an issue with overwriting
    fs.outputJson(path.join(correctedLocalDir, 'translation.json'), translationJson);
    
    return;
}

// TODO implement adding test.js translations as an option
// const addTestTranslations = (module, language) => {
//     let tfileContents = fs.readFileSync(path.join(localDir, "test.js"));
//     let ttranslationJSON = generateTranslationsJSON(tfileContents, language);
//     fs.outputJson(path.join(localDir, "translation.json"), ttranslationJSON);
// }

const generateTranslationsJSON = (contents, language) => {

    let translationsRegex = /`([^`]*)`/g, // matches to any back-tick quotes, i.e `... something ...`
        matches,
        translatables = [];

    let translations = {};
    // console.log(contents);

    while (matches = translationsRegex.exec(contents)) {
        // TODO clean this up
        translations[matches[1]] = {};
        translations[matches[1]][language] = matches[1];
    }

    return translations;
}


// const moveFilesForServing = () => {

// }

module.exports = {
    execute: execute
}