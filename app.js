#!/usr/bin/env node
'use strict'

const test = require('./testTool');
const generate = require('./generateTool');
const publish = require('./publishTool');

// Expected format: mct command module.js lang
const expectedFormat = "mct command module.js [lang]";

const execute = (command, args) => {
    if (args.module == null) {
        console.err(`Expected format: ${expectedFormat}`);
        return;
    }

    switch(command) {
        case 'test':
            test.execute(args.module, args.language);
            break;
        case 'generate':
            if (!(args.language == null)) {
                generate.execute(args.module, args.language);
            } else {
                // Perhaps gracefully handle
            }
            break;
        case 'publish':
            publish.execute(args.language);
            break;
        default: 
            console.log('Unrecognized command');
    }
}

let command  = process.argv[2];
let commandArgs = {
    module : process.argv[3],
    language : process.argv[4],
}

execute(command, commandArgs);







