#!/usr/bin/env node
'use strict'

const test = require('./lib/testTool');
const generate = require('./lib/generateTool');
const publish = require('./lib/publishTool');

// Expected format: mct command module.js lang
const expectedFormat = "mct command /path/to/module.js [lang]";

const execute = (command, args) => {
    if (args.module == null) {
        console.log(`Expected format: ${expectedFormat}`);
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
                // TODO: Perhaps gracefully handle by asking for a language input
            }
            break;
        case 'publish':
            publish.execute(args.language);
            break;
        default: 
            console.log('Unrecognized command');
    }
}

const command  = process.argv[2];
const commandArgs = {
    module : process.argv[3],
    language : process.argv[4],
}

execute(command, commandArgs);







