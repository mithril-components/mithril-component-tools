#!/usr/bin/env node

'use strict'

/*tes
est.
*/
const fs    = require('fs-extra');
const exec = require('child_process').exec;
const path = require('path');

const less = require('less');
const readline = require('readline');
const express = require('express');

const app    = express();
const port   = process.env.PORT || 8080;
const router = express.Router();

const moduleDir = __dirname;
const localDir = process.cwd();
const translate = require(path.join(localDir, 'translation.json'));

app.use('', router);

router.get('/*', (req, res) => {
    res.sendFile(path.join(moduleDir, 'public/index.html'));
});

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
    // Translate the module itself: 
    let translatedModule = translateModule(module);

    // Change test to use the translatedModule
    let test = 'test.js';
    createTranslatedTest(module);

    const child = exec(`node public/[translated]${test}`,
      (error, stdout, stderr) => {
        if (error !== null) {
            console.log(`exec error: ${error}`);
        } else {
            // console.log(`stdout: ${stdout}`);
            // console.log(`stderr: ${stderr}`);

            let innerHtml = stdout;
            let translatedHtml = translateContents(innerHtml);

            let lessPath = module.replace(".js", ".less");
            renderLess(lessPath);

            /* Generate the output HTML for in-browser test */
            const base = fs.readFileSync(path.join(moduleDir, 'public/test.html'), 'UTF-8');
            fs.outputFileSync(path.join(moduleDir, 'public/index.html'), base.replace('%CONTENT%', translatedHtml), 'UTF-8');
        }
    });
}

const executeGenerate= (module) => {
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translationJson = generateTranslations(fileContents);
    fs.outputFileSync(path.join(moduleDir, 'public/translation.json'), JSON.stringify(translationJson));
    return;
}

const translateModule = (module) => {
    
    let fileContents = fs.readFileSync(path.join(localDir, module), {encoding: 'utf-8'});

    let translatedContents = translateContents(fileContents);
    let translatedModule = `public/[${language}]` + module;
    fs.outputFileSync(translatedModule, translatedContents);

    return translatedModule;
}

const translateContents = (contents) => {
    // Use regexp to get dependancies including regexp 
    var translationsRegex = /`([^`]*)`/g;
    let newContents = contents.replace(translationsRegex, (match) => {
        let phrase = match.replace(/`/g, '');

        let individualWords = phrase.split(' ');

        let replacement = "`" + translate[phrase][language] + "`";
        return replacement;
    });

    return newContents;
}

const generateTranslations = (contents) => {
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

const createTranslatedTest = (module) => {
    if (module == null) {
        throw err;
    }

    // Read the file
    let testContents = fs.readFileSync(path.join(localDir, 'test.js'), {encoding: 'utf-8'});
    let testCopyContents = testContents;

    // Use regexp to get dependancies
    var moduleRegex = new RegExp(module, "gi"),
        matches,
        requirements = [];

    while (matches = moduleRegex.exec(testContents)) {
        testCopyContents = testCopyContents.replace(matches[0], `[${language}]${module}`);
    }

    let translatedTest = `mctTest/[translated]test.js`;
    fs.outputFileSync(translatedTest, testCopyContents);
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
        // console.log(matched); // lessImport.less
        let replacement = "@import '" + bootStrapDir + lessImport + "';";
        // console.log(replacement); // bootstrapDir/lessImport.less

        lessContentsCopy = lessContentsCopy.replace(matched, replacement);
    }

    // console.log("Contents: ", lessContentsCopy);

    less.render(lessContentsCopy, function(err, css) {
        if (!err) {
            fs.outputFileSync(path.join(moduleDir, "public/test.css"), css.css);
        } else {
            console.log("ERR rendering", err);
        }
    });
}

// Expected format: mct command module.js lang
let executableCommand  = process.argv[2];
let executableModule = process.argv[3]; 
let language = process.argv[4] || 'zh';

execute(executableCommand, executableModule);