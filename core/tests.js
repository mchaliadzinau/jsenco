const {basename, dirname, extname, join} = require('path');
const fs = require('fs');

const {createProcess, startProcessesMonitoring} = require('./process');
const {execDryRun, rejectOnProcessStop} = require('./utils');


/** Initializes engines testing
 * @param {EnTest.EngineInfo[]} enginesList
 * @param {EnTest.RunTestsOptions} options - test options
 * @return {Promise} - promise chain
 */
const testEngines = (enginesList, options, callback) => {
    /** @type {Promise} */ 
    let chain = Promise.resolve(1);
    for(let i = 0; i < enginesList.length; i++) {
        const engineName = enginesList[i].name;
        if (fs.existsSync(enginesList[i].path))
            chain = chain.then( () => testEngine(enginesList[i], options) ).then(results => {
                console.log(engineName, results);
            });
    }
    chain.then(()=>{
        const json = JSON.stringify(enginesList);
        
        if(options.RESULTS_LATEST) {
            const RESULTS_FOLDER = dirname(options.RESULTS_LATEST);
            !fs.existsSync(RESULTS_FOLDER) && fs.mkdirSync(RESULTS_FOLDER);
    
            // write latest data into file with timestamp
            const ext = extname(options.RESULTS_LATEST);
            const name = basename(options.RESULTS_LATEST, ext);
            const date = new Date().getTime();
            fs.writeFileSync( join(RESULTS_FOLDER, `${name}.${date}${ext}`), json );
            // write latest data into latest file
            fs.writeFileSync( options.RESULTS_LATEST, json );
        }
        
        if(callback) {
            callback(enginesList);
        }
        
        console.log(json);
    });
    return chain;
} 

/** Initializes testing of a particular engine
 * @param {EnTest.EngineInfo} engine
 * @param {EnTest.RunTestsOptions} options - test options
 * @return {Promise}
 */
const testEngine = (engine, options) => {
    return execDryRun(engine.path, false, false).then(timeOverhead => {
        engine.timeOverhead = timeOverhead;
        return execDryRun(engine.path, true, false).then(memOverhead => {
            engine.memOverhead = memOverhead;
            return execDryRun(engine.path, false, true).then(becnhmarkTimeOverhead => {
                engine.becnhmarkTimeOverhead = becnhmarkTimeOverhead;
                return execDryRun(engine.path, true, true).then(becnhmarkMemOverhead => {
                    engine.becnhmarkMemOverhead = becnhmarkMemOverhead;
                    return startEngineTests(engine, options);
                });
            });
        })
    }).catch(e => {
        if(e && e.message === 'PSTOP') {
            throw e;
        } else if(engine.testsPassed.length + engine.testsFailed.length === 0) {
            const error = `Failed to execute tests on ${engine.name}.`
            engine.errors = [error]
            console.warn('#WARN: ', error);
        }
    });
}

/** Creates test processes for a particular engine
 * @param {EnTest.EngineInfo} engine
 * @param {EnTest.RunTestsOptions} options - test options
 * @return {Promise}
 */
const startEngineTests = (engine, options) => {
    return new Promise(async (resolve, reject) => {
        let idx = 1;
        rejectOnProcessStop(reject);
    
        while(engine.testsQueue.length > 0) {
            const test = engine.testsQueue.pop();
            if(!options.skipPlainRun && options.getState().isStarted) {
                await createProcess(engine, test.plainTestPath, idx);
            }
            if(!options.skipBenchmarks && options.getState().isStarted) {
                await createProcess(engine, test.benchmarkTestPath, idx);
            }
            idx++;
        }

        resolve(engine);
    });
};

/**
 * @param {EnTest.EngineInfo[]} enginesList
 * @param {EnTest.RunTestsOptions} options
 * @return {Promise}
 */
const runTests = (enginesList, options) => {
    enginesList.forEach(engine => {
        if( !fs.existsSync(engine.path) ) {
            throw new Error(`Cannot access ${engine.name}. Please, check if it is installed via JSVU.`);
        }
    });
    if(!options) {
        console.error('#ERR runTests(): No options were provided.');
        process.exit();
    }
    const interval = startProcessesMonitoring(options.TIMEOUT);
    return testEngines(enginesList, options, options.callback)
        .then(()=> clearInterval(interval))
        .catch(e => {
            clearInterval(interval)
            if(e && e.message === 'PSTOP') {
                throw e;
            }
        })
}
module.exports = {
    runTests
}