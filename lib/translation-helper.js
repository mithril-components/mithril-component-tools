'use strict'

const fs   = require('fs-extra');
const path = require('path');

const localDir = process.cwd();
let translate, hasTranslation;
const getTranslationJson = (jsonPath) => {
	try {
	    let translatedJson = fs.readJsonSync(jsonPath, {throws: false});
	    return translatedJson;
	} catch (e) {
		// console.log(e);
		// console.log("No translation.json found at location: ", jsonPath);
	    return null;
	}
}

const translateContents = (contents, translationJson, language) => {
    // Use regexp to get dependancies including regexp 
    const translationsRegex = /`([^`]*)`/g;
    const newContents = contents.replace(translationsRegex, (match) => {
        let phrase = match.replace(/`/g, '');

        // let individualWords = phrase.split(' ');
        try {
	        let replacement = "`" + translationJson[phrase][language] + "`";
	        return replacement;
        } catch (e) {
        	console.log(`- Missing translation for "${phrase}" in translation.json`);
        	return "`" + phrase + "`";
        }
    });

    return newContents;
}

module.exports = {
	getTranslationJson : getTranslationJson,
	translateContents : translateContents
}