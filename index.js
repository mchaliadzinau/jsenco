/**
 * https://mathiasbynens.be/notes/javascript-benchmarking
 */

const path = require('path');
const fs = require('fs');

const {getEnginesSetup} = require('./core/engines');
const {runTests} = require('./core/tests');
const parseTests = require('./core/parsing');
const {stopProcesses} = require('./core/process');

// const ARGS = process.argv.slice(2);
const PATH_TESTS = path.resolve(process.cwd(), 'tests');
const RESULTS_FOLDER = path.resolve(process.cwd(), 'results/data/');
const RESULTS_LATEST = path.join(RESULTS_FOLDER, 'latest.json');

/** @type {string[]} */
const tests = fs.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => path.extname(file.name) === '.js')
    .map(file=> path.resolve(PATH_TESTS,file.name) );

/** @type {EnTest.EnginesSetup} */
const ENGS = getEnginesSetup( parseTests(tests) );

const state = {
    isStarted: true,
    stopTesting() {
        this.isStarted = false;
    }
};

const startTesting = () => {
    state.isStarted = true;
    return runTests([
        ENGS.V8, 
        ENGS.SM,
        ENGS.JSC
    ], {
        TIMEOUT: 120000,
        RESULTS_LATEST,
        skipBenchmarks: true,
        skipPlainRun: false,
        getState() {
            return Object.assign({}, state);
        }
    });
};
startTesting();

fs.watch(PATH_TESTS, async (eventType, filename) => {
    console.log(`event type is: ${eventType}`);
    if (filename && state.isStarted) {
      console.log(`filename provided: ${filename}`);
      console.log('Stopping all processes...');
      process.emitWarning('Stopping all processes...', 'PSTOP');
      state.stopTesting();
      await stopProcesses();

      console.log('Restarting testing...');
      startTesting();
    } else {
      console.log('filename not provided');
    }
});