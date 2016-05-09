#!/usr/bin/env node

'use strict'

/*tes
est.
*/
const fs    = require('fs-extra');
const exec = require('child_process').execFile;
const path = require('path');
const less = require('less');
const readline = require('readline');
const express = require('express');

const app    = express();
const port   = process.env.PORT || 8080;

const moduleDir = __dirname;
const localDir = process.cwd();


app.use("/node_modules/", express.static(path.join(moduleDir, 'node_modules')));
app.use("/test.css", express.static(path.join(moduleDir, 'public/test.css')));
app.get('/', function(req, res) {
  res.sendFile(path.join(moduleDir, 'public/index.html'));
});

let translate, hasTranslation;
try {
    translate = require(path.join(localDir, 'translation.json'));
    hasTranslation = true;
} catch (e) {
    hasTranslation = false
}

const execute = (command, module) => {
    switch(command) {
        case 'test': 
            executeTest(module);
            let server = app.listen(port, () => {
                let host = server.address().address
                let port = server.address().port
                console.log("Listening at http://%s:%s\n", host, port)
            });
            break;
        case 'generate': 
            executeGenerate(module);
            break;
        default: 
            console.log('Unrecognized command');
    }
}

const executeTest = (module) => {

    let test = 'test.js';

    // check if there is a translation.json
    if (hasTranslation) {
        // Translate test.js and return the translated file's location
        test = translateTest(module);;
        // Translate the module itself: 
        let translatedModule = translateModule(module);
    }

    // check if there is a less file for the module
    let lessFile = module.replace(".js", ".less");
    let hasLess = true;
    try {
        fs.accessSync(lessFile, fs.R_OK);
    } catch (e) {
        // console.log("Error ")
        hasLess = false;
    }

    const child = exec('node', [`${test}`], {cwd: localDir},
      (error, stdout, stderr) => {
        if (error !== null) {
            console.log(`Test execution error: ${error}`);
        } else {
            // console.log(`stdout: ${stdout}`);
            // console.log(`stderr: ${stderr}`);

            let innerHtml = stdout;
            if(hasTranslation) {
                innerHtml = translateContents(innerHtml);
            }
            if (hasLess) {
                renderLess(lessFile);
            }
            /* Generate the output HTML for in-browser test */
            const base = fs.readFileSync(path.join(moduleDir, 'public/test.html'), 'UTF-8');
            fs.outputFileSync(path.join(moduleDir, 'public/index.html'), base.replace('%CONTENT%', innerHtml), 'UTF-8');
        }
    });
}

const executeGenerate= (module) => {
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translationJson = generateTranslationsJSON(fileContents);
    fs.outputFileSync(path.join(localDir, 'translation.json'), JSON.stringify(translationJson));
    return;
}

const translateTest = (module) => {
    if (module == null) {
        throw err;
    }

    // Read the file
    let testContents = fs.readFileSync(path.join(localDir, 'test.js'), {encoding: 'utf-8'});
    let testCopyContents = testContents;

    // Use regexp to get dependancies and replace the module being tested
    var moduleRegex = new RegExp(module, "gi"),
        matches,
        requirements = [];

    while (matches = moduleRegex.exec(testContents)) {
        testCopyContents = testCopyContents.replace(matches[0], `[${language}]${module}`);
    }

    // Use regexp to translate the rest of the content
    let translatedTestContent = translateContents(testCopyContents);
    let translatedTest = path.join(moduleDir, `public/[${language}]test.js`);
    fs.outputFileSync(translatedTest, translatedTestContent);

    return translatedTest;
}

const translateModule = (module) => {
    
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translatedContents = translateContents(fileContents);
    let translatedModule = `public/[${language}]${module}`;
    fs.outputFileSync(path.join(moduleDir, translatedModule), translatedContents);

    return translatedModule;
}

const translateContents = (contents) => {
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

const generateTranslationsJSON = (contents) => {
    var translationsRegex = /`([^`]*)`/g,
        matches,
        translatables = [];

    let translations = {};

    while (matches = translationsRegex.exec(contents)) {
        let lang = `${language}`;

        // TODO cleana this up
        translations[matches[1]] = {};
        translations[matches[1]][lang] = matches[1];
    }

    return translations;
}

const renderLess = (lessPath) => {
    var lessContents = fs.readFileSync(path.join(localDir, lessPath), 'UTF-8');
    var lessContentsCopy = lessContents;

    var bootStrapDir = "node_modules/bootstrap/less/";

    var lessRegex = /@import '[^\s]*\/([^\s]+.less)';/g; // regex matches `...`
    var  matches;

    // While a regex match (i.e less file imports) was found... 
    while (matches = lessRegex.exec(lessContents)) {
        let matched = matches[0];
        let lessImport = matches[1];

        let replacement = "@import '" + bootStrapDir + lessImport + "';";


        lessContentsCopy = lessContentsCopy.replace(matched, replacement);
    }

    less.render(lessContentsCopy, function(err, css) {
        if (!err) {
            fs.outputFileSync(path.join(moduleDir, "public/test.css"), css.css);
        } else {
            console.log("ERR rendering", err);
        }
    });
}

// TODO cleanup after files
const cleanUpDir = () => {

}

// Expected format: mct command module.js lang
let executableCommand  = process.argv[2];
let executableModule = process.argv[3]; 
let language = process.argv[4] || 'zh';
execute(executableCommand, executableModule);