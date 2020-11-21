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

const app = {
    _testsResultPromise: null,
    isStarted: false,
    isFinished: false,
    async stopTesting() {
        this.isStarted = false;
        const processes = await stopProcesses();
        return new Promise(res => {
            if(this.isFinished) {
                res();
            } else {
                process.emitWarning('Stopping all processes...', 'PSTOP');
                this._testsResultPromise.catch(e => {
                    if(e && e.message === 'PSTOP') {
                        res();
                    }
                })
            }
        })
    },
    startTesting() {
        console.log('Starting testing...');
    
        this.isStarted = true;
        this.isFinished = false;
    
        /** @type {EnTest.EnginesSetup} */
        const ENGS = getEnginesSetup( parseTests(tests) );

        this._testsResultPromise = runTests([
            ENGS.V8, 
            // ENGS.SM,
            // ENGS.JSC
        ], {
            TIMEOUT: 120000,
            RESULTS_LATEST,
            skipBenchmarks: true,
            skipPlainRun: false,
            getState() {
                return {isStarted: app.isStarted}
            }
        }).then(() => {
            this.isFinished = true;
        });

        return this._testsResultPromise;
    }
};

app.startTesting();

fs.watch(PATH_TESTS, async (eventType, filename) => {
    console.log(`event type is: ${eventType} AASDA`);
    if (filename && app.isStarted) {
      console.log(`filename provided: ${filename}`);
      console.log('Stopping all processes...');
      await app.stopTesting();
      app.startTesting();
    } else if(app.isFinished) {
        app.startTesting();
    }
});