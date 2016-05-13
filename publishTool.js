'use strict'

const Promise = require('promise');
const fs   = require('fs-extra');
const path = require('path');
const exec = require('child_process');
const walk = require('walk');

const translator = require('./translation-helper');
const less = require('./less-helper');

const localDir = process.cwd();
const publishDir = path.join(localDir, "/publish/");

const copyToPublish = () => {
	return new Promise((resolve, reject) => {
		fs.readdir(localDir, (err, files) => {
	        if (!err) {
	            for (let i = 0; i < files.length; i++) {
	        		let file = files[i];
	                if (fs.lstatSync(file).isDirectory()) {
	                	if(file != "publish") {
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

const translateModule = (moduleFile, language) => {
	let module = moduleFile.slice(0,-3); // TODO if change to use regex
	let translationOutputFile = path.join(publishDir, module);
	translator.translateModule(module, language, translationOutputFile);
}

const next = (path) => {
	let walker = walk.walk(path, options);

	walker.on("directory", directoryHandler); // plural
	walker.on("file", fileHandler);
	walker.on("errors", errorsHandler); // plural
	walker.on("end", endHandler);
}

const fileHandler = (root, fileStats, next) => {
	let fileName = fileStats.name;
	// console.log(fileName);
	let fullPath = path.join(root, fileName);

	if(fileName.includes(".less")) {
		/* HANDLE CONVERTING LESS TO CSS */
		let cssFile = path.join(publishDir, "/public/module.css");

		less.render(fullPath).then((cssResponse) => {
			// console.log("Adding to CSS: ", fileName);
	        fs.appendFileSync(cssFile, cssResponse); // "a" option is for appending (double check this)
			
			next();
		}, (err) => {
			// TODO add error handler (or just do nothing);
			next();
		});  

	} else if (fileName.includes(".json")) {
		/* HANDLE TRANSLATING MODULE FILES */
		// Check if there is a translation
		let translationFile = 'translation.json';
		let translationJSON;
		try {
		 translationJSON = fs.readJsonSync(path.join(root, translationFile), {throws: false}) // throws false makes no error occur if json is invalid
		} catch (e) { // if translation doesn't exist
			next();
		}

		if (translationJSON == null) { // if it was invalid
			// leave it alone
			next();
		} else {
			let module = `piechart.js`; // TODO fix this

			// Translate the contents of the file, and write it back to it's location
			let moduleContents = fs.readFileSync(fullPath, {encoding: 'utf-8'});

			let translatedContents = translator.translateContents(moduleContents);
			fs.outputFileSync(fullPath, translatedContents);
			next();
		}
	} else {
		// leave it alone
		next();
	}
}

function errorsHandler(root, nodeStatsArray, next) {
  nodeStatsArray.forEach(function (n) {
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
	copyToPublish().then((response) => {
		// console.log("Copied to publish, going through");

		let options = {};
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


// var walk = function(dir, handlerFunction, language, done) {
//   var results = [];
//   fs.readdir(dir, function(err, list) {
//     if (err) return done(err);
//     var pending = list.length;
//     if (!pending) return done(null, results);

//     list.forEach(function(file) {
//       file = path.resolve(dir, file);
//       fs.stat(file, function(err, stat) {
//         if (stat && stat.isDirectory()) {

//           // walk(file, function(err, res) {
//           //   results = results.concat(res);
//           //   if (!--pending) done(null, results);
//           // });
//         } else {
//           // results.push(file);
//           if (!--pending) done(null, results);
//         }
//       });
//     });
//   });
// };

module.exports = {
	execute : execute
}