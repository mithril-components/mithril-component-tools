'use strict'

const Promise = require('promise');
const express = require('express');
const fs   = require('fs-extra');
const exec = require('child_process').execFile;
const path = require('path');

const translator = require('./translation-helper');
const less = require('./less-helper');

const app  = express();
let port   = process.env.PORT || 9004;


const moduleDir = __dirname;
const localDir = process.cwd();
// Hash from: http://stackoverflow.com/a/7616484
const hashString = (string) => {
  var hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
let hashDirNum = hashString(localDir) + "/";
const tmpDir = path.join("/tmp", hashDirNum);


const startServer = () => {
    app.use("/node_modules/", express.static(path.join(tmpDir, '/public/node_modules')));
    app.use("/test.css", express.static(path.join(tmpDir, 'public/test.css')));
    app.get('/', function(req, res) {
      res.sendFile(path.join(tmpDir, 'public/index.html'));
    });

    let server = app.listen(port, () => {
        let host = server.address().address
        let port = server.address().port
        console.log("Listening at http://%s:%s\n", host, port)
    }).on('error', function(err) {
        if (err.errno === 'EADDRINUSE') {
            port = port + 1;
            console.log(`Test server port in use, retrying on next port: ${port}`);

            startServer();
        } else {
            console.log("Local server error: ", err);
        }
    });
}

const prepServer = () => {
    // cleanTempDir();
    fs.copySync(path.join(localDir, '/node_modules'), path.join(tmpDir, '/public/node_modules'));
}

const execute = (module, language) => {
    let localModuleDir = module.slice(0,-3); // TODO use regex

    let splitPath = localModuleDir.split("/");
    console.log(splitPath);
    if (splitPath.length > 1) {
        splitPath.pop();
    }
    console.log(splitPath);
    let correctedlocalDir = splitPath.join("/");
    let componentDir = path.join(localDir, correctedlocalDir);
    let testPath = path.join(componentDir, 'test.js');
    console.log(testPath);
    // Check if a language was entered
    if (language != null) {
        // Check if there is a translation.json
        if (translator.hasTranslation) {
            // Translate test.js and return the translated file's location
            let test = translateTest(testPath, language);

            // Translate the module itself 
            translator.translateModule(testPath, language, path.join(tmpDir, `public/[${language}]${module}`));
        }
    }

    runTest(module, testPath).then((response) => {
        prepServer();
        startServer(); // startServer pointing to the testDir
    }, (err) => {
        // TODO add console output for error
        console.log("Failed to start test");
    });
}

const runTest = (module, test) => {
    return new Promise(function (resolve, reject) {
        let Child = exec('node', [`${test}`], {cwd: localDir},
          (error, stdout, stderr) => {
            if (error !== null) {
                console.log(`${error}`);
                return false;
            } else {
                // TODO: Handle user defined errors
                if (stderr != '') {
                    console.log(`Internal test error:\n ${stderr}`);
                }

                let innerHtml = stdout;
                console.log(`Has translation: ${translator.hasTranslation}`);
                if(translator.hasTranslation) { // TODO check hasTranslation or just use fs.fromJSON
                    innerHtml = translator.translateContents(innerHtml);
                }

                // Check if there is a less file for the module
                let lessFile = module.replace(".js", ".less");
                if (less.hasLess(lessFile)) { // TODO chance has less to not require mdule. calc less file before this
                    less.renderToFile(lessFile, path.join(tmpDir, "public/test.css")).then((response) => {
                        /* Generate the output HTML for in-browser test */
                        const base = fs.readFileSync(path.join(moduleDir, 'public/test.html'), 'UTF-8');
                        fs.outputFileSync(path.join(tmpDir, 'public/index.html'), base.replace('%CONTENT%', innerHtml), 'UTF-8');
                        
                        Child.emit("custom-success");
                    }, (err) => {
                        console.log("rendering error");
                        Child.emit("error");
                        return;
                    });
                } else {
                    /* Generate the output HTML for in-browser test */
                    const base = fs.readFileSync(path.join(moduleDir, 'public/test.html'), 'UTF-8');
                    fs.outputFileSync(path.join(tmpDir, 'public/index.html'), base.replace('%CONTENT%', innerHtml), 'UTF-8');
                    
                    Child.emit("custom-success");
                }
            }
        });

        Child.addListener("error", () => { // TODO check for err parameter
            // console.log("Error in test"); 
            reject(); 
        });

        Child.addListener("custom-success", () => { 
            // console.log("Sucessful test"); 
            resolve(); 
        });
    })
}

const translateTest = (module, language) => {

    let moduleName = module.slice(0,-3); // TODO if change to use regex to also accept module without js, fix this

    // Read the file
    let testContents = fs.readFileSync(path.join(localDir, 'test.js'), {encoding: 'utf-8'});
    let testCopyContents = testContents;

    // Use regexp to get dependancies and replace the module being tested
    var moduleRegex = new RegExp(`\.\/(${moduleName})(?:\.js)?`, "g"),
        matches,
        requirements = [];

    while (matches = moduleRegex.exec(testContents)) {
        testCopyContents = testCopyContents.replace(matches[0], `./[${language}]${module}`);
    }

    // Use regexp to translate the rest of the content
    let translatedTestContent = translator.translateContents(testCopyContents);
    let translatedTest = path.join(tmpDir, `public/[${language}]test.js`);
    fs.outputFileSync(translatedTest, translatedTestContent);

    return translatedTest;
}

// TODO cleanup after files
const cleanTmpDir = () => {

}

module.exports = {
    execute: execute
}