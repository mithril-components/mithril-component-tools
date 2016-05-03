#!/usr/bin/env node

'use strict'

/** 
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

const translate = require('./translation.json');
let language;

app.use('', router);

router.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

const execute = (command, module) => {    
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
            const base = fs.readFileSync('public/test.html', 'UTF-8');
            fs.writeFileSync('public/index.html', base.replace('%CONTENT%', translatedHtml), 'UTF-8');
        }
    });
}

const translateModule = (modulePath) => {
    
    let fileContents = fs.readFileSync(modulePath, {encoding: 'utf-8'});

    let translatedContents = translateContents(fileContents);
    let translatedModule = `public/[${language}]` + modulePath;
    fs.outputFileSync(translatedModule, translatedContents);

    return translatedModule;
}

const translateContents = (contents) => {
    // Use regexp to get dependancies including regexp 
    var translationsRegex = /`([^`]*)`/g,
        matches;

    let newContents = contents.replace(translationsRegex, (match) => {
        let phrase = match.replace(/`/g, '');

        let individualWords = phrase.split(' ');

        let replacement = "`" + translate[phrase][language] + "`";
        return replacement;
    });

    return newContents;
}

const createTranslatedTest = (modulePath) => {
    if (modulePath == null) {
        throw err;
    }

    // Read the file
    let testContents = fs.readFileSync('test.js', {encoding: 'utf-8'});
    let testCopyContents = testContents;

    // Use regexp to get dependancies
    var modulePathRegex = new RegExp(modulePath, "gi"),
        matches,
        requirements = [];

    while (matches = modulePathRegex.exec(testContents)) {
        testCopyContents = testCopyContents.replace(matches[0], `[${language}]${modulePath}`);
    }

    let translatedTest = `public/[translated]test.js`;
    fs.outputFileSync(translatedTest, testCopyContents);
}


const renderLess = (lessPath) => {
    var lessContents = fs.readFileSync(lessPath, 'UTF-8');
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

            let newCSSPath = "public/test.css";
            fs.outputFileSync(newCSSPath, css.css);
        } else {
            console.log("ERR rendering", err);
        }
    });
}


let testModule = process.argv[3] // node mct test module.js
language = process.argv[4] || 'zh';

execute('test', testModule);
const server = app.listen(port, () => {
    let host = server.address().address
    let port = server.address().port
    console.log("Listening at http://%s:%s\n", host, port)
});
