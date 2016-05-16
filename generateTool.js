'use strict'

const fs   = require('fs-extra');
const path = require('path');

const translator = require('./translation-helper');

const localDir = process.cwd();

const execute = (module,language) => {
    const localDir = process.cwd();

    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translationJson = generateTranslationsJSON(fileContents, language);

    // TODO use hasTranslation var to check if there could be an issue with overwriting
    fs.outputJson(path.join(localDir, 'translation.json'), JSON.stringify(translationJson));
    
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
        let lang = `${language}`;
        // TODO clean this up
        translations[matches[1]] = {};
        translations[matches[1]][lang] = matches[1];
    }

    return translations;
}


// const moveFilesForServing = () => {

// }

module.exports = {
    execute: execute
}