'use strict'

const fs   = require('fs-extra');
const path = require('path');
const exec = require('child_process');
const walk = require('walk');

const translator = require('./translation-helper');
const less = require('./less-helper');

const localDir = process.cwd();
const publishDir = path.join(localDir, "/publish/");

let lang;

const copyToPublish = () => {
	return new Promise((resolve, reject) => {
		fs.readdir(localDir, (err, files) => {
	        if (!err) {
	            for (let i = 0; i < files.length; i++) {
	        		let file = files[i];
	                if (fs.lstatSync(file).isDirectory()) {
	                	if(file != "publish") {
	                		fs.emptyDirSync(path.join(publishDir, file)); // must delete everything or will get EExist err
		                	fs.copySync(path.join(localDir, file), path.join(publishDir, file));
	                	}
	                } else {
	                	// ignore single files
	                }
	            }
	            resolve(true);
	        } else {
	        	console.log("Failed to copy files to publish");
	        	resolve(false)
	        }
	    });
	});
}

const next = (path) => {
	let walker = walk.walk(path, options);

	walker.on("directory", directoryHandler); // plural
	walker.on("file", fileHandler);
	walker.on("errors", errorsHandler); // plural
	walker.on("end", endHandler);
}

const fileHandler = (root, fileStats, next) => {
	const fileName = fileStats.name;
	// console.log(fileName);
	const fullPath = path.join(root, fileName);

	if(fileName.includes(".less")) {
		/* HANDLE CONVERTING LESS TO CSS */
		const cssFile = path.join(publishDir, "/public/module.css");

		less.render(fullPath).then((cssResponse) => {
			// console.log("Adding to CSS: ", fileName);
	        fs.appendFileSync(cssFile, cssResponse); // "a" option is for appending (double check this)
			
			next();
		}, (err) => {
			// TODO add error handler (or just do nothing);
			next();
		});  

	} else if (fileName.includes(".js")) {
		/* HANDLE TRANSLATING MODULE FILES */
		if (lang != null) {
			// Check if there is a translation
			let translationFile = 'translation.json';
			let translationJSON = translator.getTranslationJson(path.join(root, translationFile))// throws false makes no error occur if json is invalid

			if (translationJSON == null) { // if it was invalid
				// leave it alone
				next();
			} else {
				// Translate the contents of the file, and write it back to it's location
				const moduleContents = fs.readFileSync(fullPath, {encoding: 'utf-8'});

				const translatedContents = translator.translateContents(moduleContents, translationJSON, lang);
				fs.outputFileSync(fullPath, translatedContents);
				next();
			}
		} else {
			next();
		}
	} else {
		// leave it alone
		next();
	}
}

function errorsHandler(root, nodeStatsArray, next) {
  nodeStatsArray.forEach((n) => {
    console.error("[ERROR] " + n.name)
    console.error(n.error.message || (n.error.code + ": " + n.error.path));
  });
  next();
}

const endHandler = () => {
	console.log("All done");
}

const directoryHandler = (root, dirStats, next) => {
		// console.log(dirStats.name);
		let fullPath = path.join(root, dirStats.name);
		// handler(dirStats.name, fullPath, language);
		next();
}

const execute = (language) => {
	console.log("Executing... ");
	lang = language;

	copyToPublish().then((response) => {
		// console.log("Copied to publish, going through");

		const options = {};
		let walker = walk.walk(publishDir, options);
		walker.on("file", fileHandler);
		walker.on("directory", directoryHandler); // plural
		walker.on("errors", errorsHandler); // plural
		walker.on("end", endHandler);

	}, (err) => {
		console.log("Failed");

	});

	// Run bower
	// let Child = exec('bower', ['install'], {cwd: localDir},
	// 	(error, stdout, stderr) => {

	// });
}

module.exports = {
	execute : execute
}