'use strict'

const fs   = require('fs-extra');
const path = require('path');

const localDir = process.cwd();
let translate, hasTranslation;
try {
    translate = require(path.join(localDir, 'translation.json'));
    hasTranslation = true;
} catch (e) {
    hasTranslation = false
}

const translateModule = (module, language, outputPath) => {
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translatedContents = translateContents(fileContents);
    fs.outputFileSync(outputPath, translatedContents);

    return outputPath;
}

const translateContents = (contents, language) => {
    // Use regexp to get dependancies including regexp 
    var translationsRegex = /`([^`]*)`/g;
    let newContents = contents.replace(translationsRegex, (match) => {
        let phrase = match.replace(/`/g, '');

        // let individualWords = phrase.split(' ');

        let replacement = "`" + translate[phrase][language] + "`";
        return replacement;
    });

    return newContents;
}

module.exports = {
	hasTranslation : hasTranslation,
	translationJSON : translate, // should not be used without first checking hasTranslation
	translateModule : translateModule,
	translateContents : translateContents
}