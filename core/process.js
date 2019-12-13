const ARGS = process.argv.slice(2);
const path = require('path');
const { spawn }  = require('child_process');
const pidusageTree = require('pidusage-tree');
const { performance } = require('perf_hooks');
const {
    checkIfProcessExists, 
    checkIfProcessFinishedCorrectly,
    printOSL, 
    processPidusageStats, 
    killProcess,
    parseTestOutput
} = require('./utils');

/**
 * @type {EnTest.Process[]}
 */
const PROCESSES = [];

/** Creates test process for particular Engine
 * @param {EnTest.EngineInfo} engine
 * @param {string} script
 * @return {Promise} Process
 */
async function createProcess(engine, script) {
    let stdout = '';
    let stderr = '';
    const childProcess = spawn(
        engine.path, 
        [script], 
        {},             // options
    );
    const process = {
        script: path.basename(script),
        engine: engine.name,
        childProcess,
        startTime: performance.now(),
        cpuVals: [],
        memVals: [],
        isTimedOut: false,
        finishedAt: null,
        isKilled: false
    };

    PROCESSES.push(process);

    childProcess.stdout.on('data', (data) => {
        const output = parseTestOutput(engine.name, script, data.toString());
        const START_MARK = output.find(e=>!!e['START_MARK']);
        if(START_MARK) {
            process.startTime = START_MARK['time'];
            console.log(START_MARK['START_MARK'], process.startTime);
        }

        const END_MARK = output.find(e=>!!e['END_MARK']);
        if(END_MARK) {
            process.finishedAt = END_MARK['time'];
            childProcess.stdin.write('# STOP\n');
            console.log(END_MARK['END_MARK'], process.finishedAt);
        }
        stdout += data;
    });
    childProcess.stderr.on('data', (data) => {
        stderr += data;
    });
    return new Promise((resolve, reject) => {
        // https://nodejs.org/api/child_process.html#child_process_event_close
        childProcess.on('close', (code, signal) => { // If the process exited, code is the final exit code of the process, otherwise null. If the process terminated due to receipt of a signal, signal is the string name of the signal, otherwise null. One of the two will always be non-null.
            if (code !== 0) {
                const processEndResult = {
                    code: code ? code : null,
                    signal
                };
                handleExecFileResult(engine, script, processEndResult, stdout, stderr);
            } else {
                handleExecFileResult(engine, script, null, stdout, stderr);
            }
            resolve(engine);
        });
        // https://nodejs.org/api/child_process.html#child_process_event_error
        childProcess.on('error', (err) => {
            if(err) {
                const processEndResult = !process.finishedAt ? {
                    code: null,
                    error: err
                } : null;
                handleExecFileResult(engine, script, processEndResult, stdout, stderr);
            }
            resolve(engine);
        });
    })

}

/** Handle `pidusageTree` callback 
 * @param {string | Error} err
 * @param {EnTest.ProcessStats[]} stats
 * @return {EnTest.Process} p
 */

const pidUsageCallback = (err, stats, process) => {
    if( !checkIfProcessExists(process.childProcess) ) {
        return;
    } else if(err) {
        console.error(err);
        killProcess(process, 'error');
        const idx = PROCESSES.findIndex(cp => cp.childProcess.pid === process.childProcess.pid);
        PROCESSES.splice(idx, 1);
        return;
    }
    false && console.log(stats);
    const [cpu, mem] = processPidusageStats(stats);
    if(cpu && mem) {
        process.cpuVals.push(cpu);
        process.memVals.push(mem);
        if(ARGS[0] === 'debug') {
            console.log(process.script, '\t', cpu, '\t', mem );
        } else {
            printOSL(`${process.script}\t${cpu}\t${mem}`);
        }
    }
};

/** Handles results of test process execution
 * @param {EnTest.EngineInfo} engine 
 * @param {string} script - test script path
 * @param {EnTest.ProcessEndResult | null} err - error if process was ended with an error
 * @param {string} stdout - test process normal output
 * @param {string} stderr - test process errors output
 */
function handleExecFileResult (engine, script, err, stdout, stderr) {
    const process = PROCESSES.pop();
    const [cpus, mems] = [process.cpuVals, process.memVals];
    if(!err && checkIfProcessFinishedCorrectly(process)) {
        const parsedOutput = parseTestOutput(engine.name, script, stdout);
        engine.testsPassed.push({
            script,
            stdout: parsedOutput.find(entry => entry.score && entry.version),
            stderr,
            status: 'success',
            extime: (process.finishedAt ? process.finishedAt : performance.now() ) - process.startTime,
            stats: {
                cpus, mems,
                maxCPU: Math.max.apply(null, cpus),
                minCPU: Math.min.apply(null, cpus),
                maxMem: Math.max.apply(null, mems),
                minMem: Math.min.apply(null, mems),
            }
        });
    } else {
        engine.testsFailed.push({
            script,
            stdout: stdout.replace(/\n/g, ' '),
            stderr,
            status: process.isTimedOut 
                ? `timeout`
                : `error ${process.childProcess['exitCode'] || process.childProcess['signalCode']}`,
            extime: (process.finishedAt ? process.finishedAt : performance.now() ) - process.startTime,
            stats: {
                cpus, mems,
                maxCPU: Math.max.apply(null, cpus),
                minCPU: Math.min.apply(null, cpus),
                maxMem: Math.max.apply(null, mems),
                minMem: Math.min.apply(null, mems),
            }
        });    
    }
}

/** Starts Processes Monitoring
 * @param {number} TIMEOUT 
 * @param {number} INTERVAL = 100 
 * @return {NodeJS.Timeout} intervalId 
 */
function startProcessesMonitoring(TIMEOUT, INTERVAL = 100) {
    return setInterval(() => {
        PROCESSES.forEach(process => {
            if ( checkIfProcessExists(process.childProcess) ) {
                if(performance.now() - process.startTime < TIMEOUT) {
                    pidusageTree(process.childProcess.pid, function(err, stats) {
                        pidUsageCallback(err, stats, process);
                    }).catch((e) => {
                        if(process.cpuVals.length + process.memVals.length === 0) {
                            console.warn('#WARN: ', `${process.engine}:${process.script} test ended too quickly. CPU and Memory data will be not available.`);
                        }
                    });
                } else {
                    killProcess(process, `${process.script} timeout`);
                    process.isTimedOut = true;
                }
            }
        });
    },
    INTERVAL);
}

module.exports = {
    createProcess,
    startProcessesMonitoring
}