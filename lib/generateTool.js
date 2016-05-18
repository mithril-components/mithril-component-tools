'use strict'

const fs   = require('fs-extra');
const path = require('path');

const translator = require('./translation-helper');

const localDir = process.cwd();
let correctedLocalDir;

const execute = (module,language) => {
    console.log("Executing... ");

    const filePathRegex = /(\/?.+\/)*(.+?)(?:\.js)?$/m;
    const matches = filePathRegex.exec(module);
    correctedLocalDir = matches[1];
    // let moduleName = matches[2];
    
    const fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'}); // TODO double check that joining localDir to module is necessary

    const newTranslationJson = generateTranslationJSON(fileContents, language);
    const originalTranslationJson = translator.getTranslationJson(path.join(correctedLocalDir, 'translation.json'));
    // If there was already a translation json, merge the new words/phrases into it
    if (originalTranslationJson != null && originalTranslationJson != {}) {
        const newWords = Object.keys(newTranslationJson);
        for (let i = 0; i < newWords.length; i++) {
            if (originalTranslationJson[newWords[i]] == null) {
                originalTranslationJson[newWords[i]]= {};
                originalTranslationJson[newWords[i]][language] = newWords[i];
            }
        }
        fs.outputJsonSync(path.join(correctedLocalDir, 'translation.json'), originalTranslationJson);
    } else {
        fs.outputJsonSync(path.join(correctedLocalDir, 'translation.json'), newTranslationJson);
    }
    
    console.log("All done");
    return;
}

const generateTranslationJSON = (contents, language) => {

    let translationsRegex = /`([^`]*)`/g, // matches to any back-tick quotes, i.e `... something ...`
        matches,
        translatables = [];

    let translations = {};
    // console.log(contents);

    while (matches = translationsRegex.exec(contents)) {
        translations[matches[1]] = {};
        translations[matches[1]][language] = matches[1];
    }

    return translations;
}

module.exports = {
    execute: execute
}