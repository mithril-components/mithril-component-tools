'use strict'

const fs   = require('fs-extra');
const less = require('less');
const path = require('path');

const localDir = process.cwd();

let hasLessBool = false;
const hasLess = (lessPath) => {
    if(hasLessBool) return hasLessBool; // don't check for the file twice in a single command

    try {
        fs.accessSync(lessPath, fs.R_OK);
        hasLessBool = true;
    } catch (e) {
        // console.log("Error ", e);
        hasLessBool = false; // TODO should be redundant, but still test first
    }

    return hasLessBool;
}

const render = (lessPath) => {

    var lessContents = fs.readFileSync(path.join(localDir, lessPath), 'UTF-8');

    var lessContentsCopy = lessContents;

    var bootStrapDir = "node_modules/bootstrap/less/"; // TODO test that accessing bootStrap this way will always work

    var lessRegex = /@import '[^\s]*\/([^\s]+.less)';/g; // regex matches @import '.../...something.less'
    var  matches;

    // While a regex match (i.e less file imports) was found... 
    while (matches = lessRegex.exec(lessContents)) {
        let matched = matches[0];
        let lessImport = matches[1];

        let replacement = "@import '" + bootStrapDir + lessImport + "';";


        lessContentsCopy = lessContentsCopy.replace(matched, replacement);
    }

    return new Promise((resolve, reject) => {
       less.render(lessContentsCopy, (err, cssOutput) => {
            if (err == null) {
                resolve(cssOutput.css);
            } else {
                console.log(`Failed to render .less:\n ${err}`);
                reject(false);
            }
        });

    })
}

const renderToFile = (lessPath, outputPath) => {
    return new Promise((resolve, reject) => {
        let lessContents = render(lessPath).then((lessContents) => {
            fs.outputFileSync(outputPath, lessContents);
            resolve();
        }, (err) => {
            // TODO handle err
            reject();
        });
    });
}

const mergeLess = (lessPaths) => {

} 

module.exports = {
    hasLess : hasLess,
    render: render,
    renderToFile: renderToFile
}