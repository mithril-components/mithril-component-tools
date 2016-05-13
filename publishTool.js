'use strict'

const Promise = require('promise');
const fs   = require('fs-extra');
const path = require('path');
const exec = require('child_process');
const walk = require('walk');

// const translator = require('./translation-helper');
const less = require('./less-helper');

const localDir = process.cwd();
const publishDir = path.join(localDir, "/publish/");

const copyToPublish = () => {
	return new Promise(resolve, reject) => {
		fs.readdir(localDir, (err, files) => {
	        if (!err) {
	            for (let i = 0; i < files.length; i++) {
	        		let file = files[i];
	                if (fs.lstatSync(file).isDirectory()) {
	                	fs.copySync(path.join(localDir, file), path.join(publishDir, file));
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
	}
}

const handler = (dirName, fullPath, language) => {
	/* HANDLE CONVERTING LESS TO CSS */
	// Add CSS
	console.log("Adding to CSS: ", file);
	let dirLessFile = `${dirName}.less`
	let lessFile = path.join(fullPath, dirLessFile);
	let cssFile = path.join(publishDir, "/public/module.css");

	less.render(lessFile).then((cssResponse) => {
        fs.outputSync(cssFile, cssResponse, "a"); // "a" option is for appending (double check this)
	}, (err) => {
		// TODO add error handler (or just do nothing);
	});  

	/* HANDLE TRANSLATING MODULE FILES */
	// Check if there is a translation
	let translationFile = 'translation.json';
	var translateJSON = fs.readJsonSync(path.join(fullPath, translationFile), {throws: false}) // throws false makes no error occur if json is invalid
	let module = `${dirName}.js`;
	if (translationJSON == null) { // if it was invalid or didnt exist
		// leave it alone
	} else {
		// Translate the contents of the file, and write it back to it's location
		let modulePath = path.join(fullPath, module);
		let moduleContents = fs.readFileSync(modulePath, {encoding: 'utf-8'});

		let translatedContents = translator.translateContents(moduleContents);
		fs.outputSync(modulePath, translatedContents);
	}
}


const translateModule = (moduleFile, language) => {
	let module = moduleFile.slice(0,-3); // TODO if change to use regex
	let translationOutputFile = path.join(publishDir, module);
	translator.translateModule(module, language, translationOutputFile);
}

const execute = (language) => {
	copyToPublish().then((response) => {

		let walker = walk.walk("./publish", options);

		walker.on("directory", function (root, dirStats, next) {
			fs.readFile(dirStats.name, function () {
			  handler(fileStats.name, "fullPath", language);
			  next();
			});
	  	});

	  	walker.on("errors", function (root, nodeStatsArray, next) {
		    next();
		});
	 
		walker.on("end", function () {
		  	console.log("all done");
		});

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