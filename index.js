/**
 * https://mathiasbynens.be/notes/javascript-benchmarking
 */

const path = require('path');
const fs = require('fs');
const { execFile }  = require('child_process');
const pidusageTree = require('pidusage-tree');
const { performance } = require('perf_hooks');

const {
    checkIfProcessExists, 
    checkIfProcessFinishedCorrectly,
    printOSL, 
    processPidusageStats, 
    execDryRun,
    getOsDependantFullPath,
    killProcess,
    parseTestOutput
} = require('./utils');

const ARGS = process.argv.slice(2);
const PATH_TESTS = path.resolve(process.cwd(), 'tests');
const TIMEOUT = 60000;

const tests = fs.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => path.extname(file.name) === '.js')
    .map(file=> path.resolve(PATH_TESTS,file.name) );

const [V8, JSC, SM, CHAKRA] = ['V8','JSC','SM','CHAKRA'];
const ENGS = {
    list: [V8, JSC, SM, CHAKRA],
    [V8]: {
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/v8') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    [JSC]: {
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/jsc') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    [SM]: {
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/sm') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    [CHAKRA]: {
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/chakra') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    }
}

const processes = [];

const testEngines = engineNamesList => {
    // process.platform.indexOf('win') === 0 && console.log('\t Results may be not accurate on ', process.platform)
    const list = engineNamesList || ENGS.list
    let chain = Promise.resolve(1);
    for(let i = 0; i < list.length; i++) {
        const engineName = list[i];
        if (fs.existsSync(ENGS[engineName].path))
            chain = chain.then( () => testEngine(list[i]) ).then(results => {
                console.log(engineName, results);
            });
    }
    chain.then(()=>{
        console.log(JSON.stringify(ENGS));
    });
    return chain;
} 

const testEngine = engineName => {
    return execDryRun(ENGS[engineName].path, false).then(time => {
        ENGS[engineName].timeOverhead = time;
        return execDryRun(ENGS[engineName].path, true).then(mem => {
            ENGS[engineName].memOverhead = mem;
            return startEngineTests(engineName);
        })
    });
}

const startEngineTests = engineName => (
    new Promise( (resolve, reject) => {
        const test = ENGS[engineName].testsQueue.pop();
        processes.push( 
            createProcess( 
                engineName, 
                test,
                resolve
            )
        )
    })
);

const interval = setInterval(() => {
    processes.forEach(cp => {
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

function handleExecFileResult (engineName, script, err, stdout, stderr, callback) {
    const process = processes.pop();
    const [cpus, mems] = [process.cpuVals, process.memVals];
    if(!err && checkIfProcessFinishedCorrectly(process.childProcess)) {
        ENGS[engineName].testsPassed.push({
            script,
            stdout: parseTestOutput(engineName, script, stdout),
            stderr,
            status: 'success',
            extime: performance.now() - process.startTime,
            cpus, mems,
        });
    } else {
        ENGS[engineName].testsFailed.push({
            script,
            stdout: stdout.replace(/\n/g, ' '),
            stderr,
            status: process.isTimedOut 
                ? `timeout`
                : `error ${process.childProcess.exitCode || process.childProcess.signalCode}`,
            extime: performance.now() - process.startTime,
            cpus, mems,
        });    
    }
    if(ENGS[engineName].testsQueue.length == 0) {
        callback(ENGS[engineName]);
    } else {
        processes.push(createProcess(engineName, ENGS[engineName].testsQueue.pop(), callback));
    }
}

function createProcess(engineName, script, callback) {
    const childProcess = execFile(
        ENGS[engineName].path, 
        [script], 
        {}, 
        (err, stdout, stderr) => handleExecFileResult(engineName, script, err, stdout, stderr, callback)
    );
    return  {
        script: path.basename(script),
        engine: engineName,
        childProcess,
        startTime: performance.now(),
        cpuVals: [],
        memVals: [],
    }
}

const pidUsageCallback = (err, stats, p) => {
    if( !checkIfProcessExists(p.childProcess) ) {
        return;
    } else if(err) {
        console.error(err);
        killProcess(p.childProcess);
        const idx = cPs.findIndex(cp => cp.childProcess.pid === p.childProcess.pid);
        cPs.splice(idx, 1);
        return;
    }
    false && console.log(stats);
    const memOverhead = ENGS[p.engine].memOverhead
    const [cpu, mem] = processPidusageStats(stats, memOverhead)
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

testEngines([SM, V8, JSC]).then(()=> clearInterval(interval));