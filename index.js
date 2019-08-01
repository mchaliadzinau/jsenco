/**
 * https://mathiasbynens.be/notes/javascript-benchmarking
 */

const path = require('path');
const fs = require('fs');

const {getEnginesSetup} = require('./core/engines');
const {runTests} = require('./core/tests')

// const ARGS = process.argv.slice(2);
const PATH_TESTS = path.resolve(process.cwd(), 'tests');
const RESULTS_FOLDER = path.resolve(process.cwd(), 'results/data/');
const RESULTS_LATEST = path.join(RESULTS_FOLDER, 'latest.json');

/** @type {string[]} */
const tests = fs.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => path.extname(file.name) === '.js')
    .map(file=> path.resolve(PATH_TESTS,file.name) );

/** @type {EnTest.EnginesSetup} */
const ENGS = getEnginesSetup(tests);

runTests([
    ENGS.V8, 
    ENGS.SM
], {
    TIMEOUT: 120000,
    RESULTS_FOLDER,
    RESULTS_LATEST,
});