const {basename, dirname, extname, join} = require('path');
const fs = require('fs');

const {createProcess, startProcessesMonitoring} = require('./process');
const {execDryRun} = require('./utils');


/** Initializes engines testing
 * @param {EnTest.EngineInfo[]} enginesList
 * @param {string} RESULTS_LATEST - path to file to store last tests run result
 * @return {Promise} - promise chain
 */
const testEngines = (enginesList, RESULTS_LATEST) => {
    /** @type {Promise} */ 
    let chain = Promise.resolve(1);
    for(let i = 0; i < enginesList.length; i++) {
        const engineName = enginesList[i].name;
        if (fs.existsSync(enginesList[i].path))
            chain = chain.then( () => testEngine(enginesList[i]) ).then(results => {
                console.log(engineName, results);
            });
    }
    chain.then(()=>{
        const json = JSON.stringify(enginesList);
        const RESULTS_FOLDER = dirname(RESULTS_LATEST);
        !fs.existsSync(RESULTS_FOLDER) && fs.mkdirSync(RESULTS_FOLDER);
        // save old results file if necessary
        if(fs.existsSync(RESULTS_LATEST)) {
            const ext = extname(RESULTS_LATEST);
            const name = basename(RESULTS_LATEST, ext);
            const date = new Date().getTime();
            fs.renameSync(RESULTS_LATEST, join(RESULTS_FOLDER, `${name}.${date}${ext}`) );
        }
        // write latest data
        fs.writeFileSync(RESULTS_LATEST, json);
        console.log(json);
    });
    return chain;
} 

/** Initializes testing of a particular engine
 * @param {EnTest.EngineInfo} engine
 * @return {Promise}
 */
const testEngine = engine => {
    return execDryRun(engine.path, false, false).then(timeOverhead => {
        engine.timeOverhead = timeOverhead;
        return execDryRun(engine.path, true, false).then(memOverhead => {
            engine.memOverhead = memOverhead;
            return execDryRun(engine.path, false, true).then(becnhmarkTimeOverhead => {
                engine.becnhmarkTimeOverhead = becnhmarkTimeOverhead;
                return execDryRun(engine.path, true, true).then(becnhmarkMemOverhead => {
                    engine.becnhmarkMemOverhead = becnhmarkMemOverhead;
                    return startEngineTests(engine);
                });
            });
        })
    }).catch(e => {
        if(engine.testsPassed.length + engine.testsFailed.length === 0) {
            const error = `Failed to execute tests on ${engine.name}.`
            engine.errors = [error]
            console.warn('#WARN: ', error);
        }
    });
}

/** Creates test processes for a particular engine
 * @param {EnTest.EngineInfo} engine
 * @return {Promise}
 */
const startEngineTests = async engine => {
    let idx = 1;
    while(engine.testsQueue.length > 0) {
        const test = engine.testsQueue.pop();
        await createProcess(engine, test.plainTestPath, idx);
        await createProcess(engine, test.benchmarkTestPath, idx);
        idx++;
    }

    return Promise.resolve(engine);
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

    if(enginesList.length > 0) {
        const interval = startProcessesMonitoring(options.TIMEOUT);
        return testEngines(enginesList, options.RESULTS_LATEST).then(()=> clearInterval(interval))
    } else {
        return Promise.resolve([]);
    }
}
module.exports = {
    runTests
}