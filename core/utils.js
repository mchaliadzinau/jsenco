const FS = require('fs');
const { execFile }  = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');
const pidusageTree = require('pidusage-tree');
const kill = require('tree-kill');

const TEST_DRYRUN = path.resolve(process.cwd(), 'core/tests/dryrun.js');
const TEST_DRYLOOP = path.resolve(process.cwd(), 'core/tests/dryloop.js');
const TEST_DRYRUN_BENCHMARK = path.resolve(process.cwd(), 'core/tests/dryrun.benchmark.js');
const TEST_DRYLOOP_BENCHMARK = path.resolve(process.cwd(), 'core/tests/dryloop.benchmark.js');
const DRY_LOOP_MEM_CHECKS_COUNT = 4;
const DRY_MON_INTERWAL = 1000;

const checkIfProcessExists = cp => !(cp.exitCode === 0 || cp.killed);

const checkIfProcessFinishedCorrectly = process => ( !!process.finishedAt || process.childProcess.exitCode === 0 || !process.childProcess.killed );

/**
 * Print on Same Line (restricted to 80 chars line)
 * @param {string} text 
 */
const printOSL = text => {
    process.stdout.write('                                                                                \033[0G');
    process.stdout.write(text + '\033[0G');
}

/** Gets total Memory and CPU used by process
 * @param {EnTest.ProcessStats[]} stats
 * @param {number} memOverhead
 * @return {number[]} [mem, cpu]
 */
const processPidusageStats = (stats, memOverhead = 0) => {
    const keys = Object.keys(stats);
    const s = keys.reduce((acc, key) => {
        acc.mem += stats[key].memory;
        acc.cpu += stats[key].cpu;
        return acc;
    }, {
        mem: 0,
        cpu: 0
    });
    return [ Math.round(s.cpu), Math.round( s.mem / 1024 / 1024 - memOverhead) ]
}

/** Gets path of dry test
 * @param {boolean} isLoop
 * @param {boolean} isBenchmark
 * @return {string} fullpath
 */
const getDryScriptName = (isLoop, isBenchmark) => {
    if(isBenchmark) {
        return isLoop ? TEST_DRYLOOP_BENCHMARK : TEST_DRYRUN_BENCHMARK;
    } else {
        return isLoop ? TEST_DRYLOOP : TEST_DRYRUN;
    }
};

/**
 * @param {string} enginePath
 * @param {boolean} isLoop
 * @param {boolean} isBenchmark
 * @return {Promise}
 */
const execDryRun = (enginePath, isLoop, isBenchmark) => {
    return new Promise((resolve,reject) => {
        const startTime = performance.now();

        const script = getDryScriptName(isLoop, isBenchmark);
        const dryRunProcess = execFile(enginePath, [script],{}, (err, stdout, stderr)=>{
            if(err || stderr) {
                return reject({err, stderr, enginePath, script});
            }
            if(!isLoop) { // if checking startup time
                resolve(performance.now() - startTime);
            }
        });
        // dryRunProcess.on('connection', (a) => {
        //     console.log(a);
        // })
        if(isLoop) {
            const dryLoopMemoryValues = [];
            const dryLoopCheckInterval = setInterval(() => {
                pidusageTree(dryRunProcess.pid, function(err, stats) {
                    if(err) reject(`#ERR\t${script}\t${err}`);
                    const [cpu, mem] = processPidusageStats(stats);
                    if(dryLoopMemoryValues.length < DRY_LOOP_MEM_CHECKS_COUNT) {
                        dryLoopMemoryValues.push(mem);
                    } else {
                        killProcess(dryRunProcess, path.basename(script));
                        clearInterval(dryLoopCheckInterval);
                        resolve(Math.max.apply(null, dryLoopMemoryValues));
                    }
                }).catch(err => {
                    clearInterval(dryLoopCheckInterval);
                    console.warn('#WARN: ', `${enginePath} dryrun ended too quickly. Memory data will include engine overhead.`);
                });
            }, DRY_MON_INTERWAL);
        }
    })
}

/** Returns path to engine executable depending on platform
 * @param {string} path 
 */
const getOsDependantFullPath = path => ~process.platform.indexOf('win32') ? `${path}.cmd` : path;

/** Kills `NodeJS.Process` and logs it
 * @param {import('child_process').ChildProcess} process - child process object
 * @param {string} description - reason of kill
 * @return {void}
 */
const killProcess = (process, description) => {
    console.log('# killing', process.pid, `(${description})`)
    // process.kill();
    kill(process.pid, err => err && console.error(err) );
};

/** Parses successful test process output
 * @param {string} engineName - name of the engine running the test
 * @param {string} test - test name
 * @param {string} output - test process stdout
 * @return {array} text
 */
const parseTestOutput = (engineName, test, output) => {
    try {
        return output.replace(/\r/g,'')
            .split('\n')
            .filter(e => !!e)
            .map(e => JSON.parse(e));
    } catch (e) {
        console.warn('#WARN', engineName, test, 'output is not valid JSON.' );
        return [output.replace(/\n/g, ' ')]
    }
}

const cleanupTestChamber = (directory) => {
    const files = FS.readdirSync(directory);
    for (const file of files) {
        FS.unlinkSync(path.join(directory, file));
    }
}

module.exports = {
    checkIfProcessExists,
    checkIfProcessFinishedCorrectly,
    printOSL,
    processPidusageStats,
    execDryRun,
    getOsDependantFullPath,
    killProcess,
    parseTestOutput,
    cleanupTestChamber
}