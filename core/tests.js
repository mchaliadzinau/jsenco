const {dirname} = require('path');
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
const startEngineTests = engine => (
    new Promise( (resolve, reject) => {
        const test = engine.testsQueue.pop();
/**
 * 1) we should wait until certain STDOUT value
 * 2) new test format: 
 */
/** {
    "name":"StringsConcat",
    "benchmarks":[
        {
            "name":"strings_concat.strings",
            "plainTestPath":"/Users/ws-032-31b/Projects/SRCs/rv4-js-eng-opt-comparator/test_chamber/strings_concat.strings.js",
            "benchmarkTestPath":"/Users/ws-032-31b/Projects/SRCs/rv4-js-eng-opt-comparator/test_chamber/strings_concat.strings.becnhmark.js"
        }
    ]
} */


        createProcess( 
            engine, 
            test,
            resolve
        )
    })
);

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
    return testEngines(enginesList, options.RESULTS_LATEST).then(()=> clearInterval(interval))
}
module.exports = {
    runTests
}