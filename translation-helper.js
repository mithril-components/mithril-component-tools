'use strict'

const fs   = require('fs-extra');
const path = require('path');

const localDir = process.cwd();
let translate, hasTranslation;
const getTranslationJson = (jsonPath) => {
	try {
	    let translatedJson = fs.readFileSync(jsonPath, {throws: false});
	    return translatedJson;
	} catch (e) {
		// console.log(e);
		// console.log("No translation.json found at location: ", jsonPath);
	    return null;
	}
}

const translateModule = (module, language, outputPath) => {
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translatedContents = translateContents(fileContents);
    fs.outputFileSync(outputPath, translatedContents);

    return outputPath;
}

const translateContents = (contents, translationJson, language) => {
    // Use regexp to get dependancies including regexp 
    let translationsRegex = /`([^`]*)`/g;
    let newContents = contents.replace(translationsRegex, (match) => {
        let phrase = match.replace(/`/g, '');

        // let individualWords = phrase.split(' ');

        let replacement = "`" + translationJson[phrase][language] + "`";
        return replacement;
    });

    return newContents;
}

module.exports = {
	hasTranslation : hasTranslation,
	getTranslationJson : getTranslationJson,
	translationJSON : translate, // should not be used without first checking hasTranslation
	translateModule : translateModule,
	translateContents : translateContents
}