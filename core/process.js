const ARGS = process.argv.slice(2);
const path = require('path');
const { execFile }  = require('child_process');
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

const PROCESSES = [];

function createProcess(engine, script, callback) {
    const childProcess = execFile(
        engine.path, 
        [script], 
        {}, 
        (err, stdout, stderr) => handleExecFileResult(engine, script, err, stdout, stderr, callback)
    );
    PROCESSES.push({
        script: path.basename(script),
        engine: engine.name,
        childProcess,
        startTime: performance.now(),
        cpuVals: [],
        memVals: [],
    })
}

const pidUsageCallback = (err, stats, p) => {
    if( !checkIfProcessExists(p.childProcess) ) {
        return;
    } else if(err) {
        console.error(err);
        killProcess(p.childProcess);
        const idx = PROCESSES.findIndex(cp => cp.childProcess.pid === p.childProcess.pid);
        PROCESSES.splice(idx, 1);
        return;
    }
    false && console.log(stats);
    // const memOverhead = ENGS[p.engine].memOverhead
    const [cpu, mem] = processPidusageStats(stats); // processPidusageStats(stats, memOverhead);
    p.cpuVals.push(cpu);
    p.memVals.push(mem);
    if(ARGS[0] === 'debug') {
        console.log(p.script, '\t', cpu, '\t', mem );
    } else {
        printOSL(`${p.script}\t${cpu}\t${mem}`);
    }
    // => {
    //   cpu: 10.0,            // percentage (from 0 to 100*vcore)
    //   memory: 357306368,    // bytes
    //   ppid: 312,            // PPID
    //   pid: 727,             // PID
    //   ctime: 867000,        // ms user + system time
    //   elapsed: 6650000,     // ms since the start of the process
    //   timestamp: 864000000  // ms since epoch
    //
};


function handleExecFileResult (engine, script, err, stdout, stderr, callback) {
    const process = PROCESSES.pop();
    const [cpus, mems] = [process.cpuVals, process.memVals];
    if(!err && checkIfProcessFinishedCorrectly(process.childProcess)) {
        engine.testsPassed.push({
            script,
            stdout: parseTestOutput(engine.name, script, stdout),
            stderr,
            status: 'success',
            extime: performance.now() - process.startTime,
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
                : `error ${process.childProcess.exitCode || process.childProcess.signalCode}`,
            extime: performance.now() - process.startTime,
            stats: {
                cpus, mems,
                maxCPU: Math.max.apply(null, cpus),
                maxMem: Math.max.apply(null, mems),
            }
        });    
    }
    if(engine.testsQueue.length == 0) {
        callback(engine);
    } else {
        createProcess(engine, engine.testsQueue.pop(), callback);
    }
}

function startProcessesMonitoring(TIMEOUT) {
    return setInterval(() => {
        PROCESSES.forEach(cp => {
            if ( checkIfProcessExists(cp.childProcess) ) {
                if(performance.now() - cp.startTime < TIMEOUT) {
                    pidusageTree(cp.childProcess.pid, function(err, stats) {
                        pidUsageCallback(err, stats, cp);
                    }).catch((e) => {
                        if(cp.cpuVals.length + cp.memVals.length === 0) {
                            console.warn('#WARN: ', `${cp.engine}:${cp.script} test ended too quickly. CPU and Memory data will be not available.`);
                        }
                    });
                } else {
                    killProcess(cp.childProcess, `${cp.script} timeout`);
                    cp.isTimedOut = true;
                }
            }
        });
    },
    500);
}

module.exports = {
    createProcess,
    startProcessesMonitoring
}