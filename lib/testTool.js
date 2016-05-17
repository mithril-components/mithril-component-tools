'use strict'

const express = require('express');
const fs   = require('fs-extra');
const exec = require('child_process').execFile;
const path = require('path');

const translator = require('./translation-helper');
const less = require('./less-helper');

const app  = express();
let port   = process.env.PORT || 9004;


const moduleDir = path.join(__dirname, "../");
const localDir = process.cwd();
// Hash from: http://stackoverflow.com/a/7616484
const hashString = (string) => {
  let hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
const hashDirNum = hashString(localDir) + "/";
const tmpDir = path.join("/tmp", hashDirNum); // /tmp

let correctedLocalDir;
let componentName; // todo implement 'global' moduleName to save trouble elsewhere

const startServer = () => {
    app.use("/node_modules/", express.static(path.join(tmpDir, 'public/node_modules')));
    app.use("/test.css", express.static(path.join(tmpDir, 'public/test.css')));
    app.get('/', (req, res) => {
      res.sendFile(path.join(tmpDir, 'public/index.html'));
    });

    const server = app.listen(port, () => {
        const host = server.address().address
        const runningPort = server.address().port
        console.log("Listening at http://%s:%s\n", host, runningPort);
    }).on('error',(err) => {
        if (err.errno === 'EADDRINUSE') {
            port = port + 1;
            console.log(`Test server port in use, retrying on next port: ${port}`);
            startServer();
        } else {
            cleanDir(tmpDir);
            console.log("Local server error: ", err);
        }
    });
}

const execute = (module, language) => {
    console.log("Executing...");
    const localModuleDir = module.slice(0,-3); // TODO use regex
    const splitPath = localModuleDir.split("/");
    componentName = splitPath[splitPath.length-1];

    if (splitPath.length > 1) {
        splitPath.pop();
    }
    const splitCorrectedDir = splitPath.join("/");
    correctedLocalDir = path.join(localDir, splitCorrectedDir);

    let testPath = "test.js";
    // Check if a language was entered
    if (language != null) {
        // Check if there is a translation.json
        const translationJson = translator.getTranslationJson(path.join(correctedLocalDir, "translation.json"));
        if (translationJson != null ) {
            // Translate test.js and return the translated file's tmp location
            testPath = translateTest(testPath, language);

            const moduleContent = fs.readFileSync(path.join(localDir, module), 'UTF-8');
            const translatedModuleContent = translator.translateContents(moduleContent, translationJson, language);
            fs.outputFileSync(path.join(tmpDir, `public/[${language}]${componentName}.js`), translatedModuleContent);
        } else {
            console.log("No translation.json file found with component");
        }
    }
    // Copy node modules
    try {
        fs.emptyDirSync(path.join(tmpDir, '/public/node_modules')); // must delete everything or will get EExist err
        fs.copySync(path.join(localDir, '/node_modules'), path.join(tmpDir, '/public/node_modules'), {clobber : true});
    } catch (e){
        console.log(e);
    }

    runTest(module, testPath).then((response) => {
        
        startServer(); // startServer pointing to the testDir
    }, (err) => {
        // TODO add console output for error
        console.log("Failed to start test");
    });
}

const runTest = (module, test) => {
    return new Promise((resolve, reject) => {
        let Child = exec('node', [`${test}`], {cwd: correctedLocalDir},
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
                // Should not need the following lines if the module and test already translated
                // const translationJson = translator.getTranslationJson(path.join(correctedLocalDir, "translation.json"));

                // if(translationJson != null ) { // TODO check hasTranslation or just use fs.fromJSON
                //     innerHtml = translator.translateContents(innerHtml, translationJson, language);
                // }

                // Check if there is a less file for the module
                const lessFile = module.replace(".js", ".less");
                if (less.hasLess(lessFile)) { // TODO chance has less to not require mdule. calc less file before this
                    less.renderToFile(lessFile, path.join(tmpDir, "public/test.css")).then((response) => {
                        /* Generate the output HTML for in-browser test */
                        const base = fs.readFileSync(path.join(moduleDir, 'public/test.html'), 'UTF-8');
                        fs.outputFileSync(path.join(tmpDir, 'public/index.html'), base.replace('%CONTENT%', innerHtml), 'UTF-8');
                        
                        Child.emit("custom-success");
                    }, (err) => {
                        console.log("Less rendering error");
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
            // console.log("Failed test");
            reject(); 
        });

        Child.addListener("custom-success", () => { 
            // console.log("Successful test");
            resolve();
        })
    })
}

const translateTest = (testPath, language) => {
    // Read the file
    const testContents = fs.readFileSync(path.join(correctedLocalDir, testPath), {encoding: 'utf-8'});
    let testCopyContents = testContents;

    // Use regexp to get dependancies and replace the module being tested
    let moduleRegex = new RegExp(`\.\/(${componentName})(?:\.js)?`, "g"), // TODO update this regexp for all possibilities
        matches,
        requirements = [];

    while (matches = moduleRegex.exec(testContents)) {
        testCopyContents = testCopyContents.replace(matches[0], `./[${language}]${componentName}`);
    }

    const translationJson = translator.getTranslationJson(path.join(correctedLocalDir, "translation.json"));

    // Use regexp to translate the rest of the content
    const translatedTestContent = translator.translateContents(testCopyContents, translationJson, language);
    const translatedTest = path.join(tmpDir, `public/[${language}]test.js`);
    fs.outputFileSync(translatedTest, translatedTestContent);

    return translatedTest;
}

// TODO cleanup after files
const cleanDir = (dir) => {
    try {
        fs.removeSync(dir);
    } catch (e) {

    }
}

module.exports = {
    execute: execute
}