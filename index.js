/**
 * https://mathiasbynens.be/notes/javascript-benchmarking
 */

const path = require('path');
const fs = require('fs');

const {getEnginesSetup} = require('./core/engines');
const {runTests} = require('./core/tests');
const parseTests = require('./core/parsing');

const ARGS = process.argv.slice(2);
const PATH_TESTS = path.resolve(process.cwd(), 'tests');
const RESULTS_FOLDER = path.resolve(process.cwd(), 'results/data/');
const RESULTS_LATEST = path.join(RESULTS_FOLDER, 'latest.json');

const ARG_NONE = 'NONE',
    ARG_SKIP_VIEWER = 'SKIP_VIEWER';

/** @type {string[]} */
const tests = fs.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => path.extname(file.name) === '.js')
    .map(file=> path.resolve(PATH_TESTS,file.name) );

/** @type {EnTest.EnginesSetup} */
const ENGS = getEnginesSetup( parseTests(tests) );
const testEnginesList = ARGS[0] 
    ? ARGS[0] === ARG_NONE
        ? []
        : ARGS[0].split(',')
            .filter(engineName => ENGS.list.includes(engineName))
            .map(engineName => ENGS[engineName])
    : [ENGS.V8, ENGS.SM,ENGS.JSC];

const SHOW_VIEWER = ARGS[1] !== ARG_SKIP_VIEWER;

testEnginesList.length && console.log('Running tests for:', testEnginesList.map(e => e.name).join(','));

runTests(testEnginesList, {
    TIMEOUT: 120000,
    RESULTS_FOLDER,
    RESULTS_LATEST,
}).then(() => {
    if(SHOW_VIEWER) {
        const { httpServer } = require('./server');
    }
});