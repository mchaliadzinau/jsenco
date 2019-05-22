const path = require('path');
const fs = require('fs');
const { execFile }  = require('child_process');

const ENGS = {
    V8: path.resolve(process.env.HOME,'.jsvu/engines/v8/v8'),
    JSC: path.resolve(process.env.HOME,'.jsvu/engines/javascriptcore/jsc'),
    SM: path.resolve(process.env.HOME,'.jsvu/engines/spidermonkey/spidermonkey'),
    CHAKRA: path.resolve(process.env.HOME,'.jsvu/engines/chakra/chakra'),
    _DATA: {
        V8: {memOverhead: 0}
    }
}
const PATH_TESTS = path.resolve(process.cwd(), 'tests');

const pidusageTree = require('pidusage-tree');

// const command = 'let i = 0; let str = "string"; while(i < 99999999999999) { i++;  str += i*i*i;} print(1)';
// const childProcessV8 = execFile(ENG_V8, ['-e', command],{}, (err, stdout, stderr)=>console.log(err, stdout, stderr)); 

const testScripts = fs.readdirSync(PATH_TESTS, {withFileTypes: true}).filter(file => path.extname(file.name) === '.js').map(file=> path.resolve(PATH_TESTS,file.name) );

const cPs = createProcesses('V8', testScripts);

console.log('testScripts:', testScripts);
// process.platform.indexOf('win') === 0 && console.log('\t Results may be not accurate on ', process.platform)

const intId = setInterval(() => {
    cPs.forEach(cp => {
        printProcessInfo(cp);
    });
},
2000);

function handleExecFileResult (engineName, script, err, stdout, stderr) {
    console.log(engineName, script, err, stdout.replace(/\n/g, ' '), stderr);
}

function createProcesses(engineName, scriptsList) {
    return scriptsList.map(script => {
        const childProcess = execFile(ENGS[engineName], [script], {}, (err, stdout, stderr) => handleExecFileResult(engineName, script, err, stdout, stderr));
        return  {
            script: path.basename(script),
            engine: engineName,
            childProcess,
         }
    });
}

function printProcessInfo(p) {
    if ( checkIfProcessExists(p.childProcess) ) 
        pidusageTree(p.childProcess.pid, function(err, stats) {
            if( !checkIfProcessExists(p.childProcess) ) {
                return;
            } else if(err) {
                console.error(err);
                p.childProcess.kill();
                const idx = cPs.findIndex(cp => cp.childProcess.pid === p.childProcess.pid);
                cPs.splice(idx, 1);
                return;
            }
            false && console.log(stats);
            const keys = Object.keys(stats);
            const s = keys.reduce((acc, key) => {
                acc.mem += stats[key].memory;
                acc.cpu += stats[key].cpu;
                return acc;
            }, {
                mem: 0,
                cpu: 0
            });
            const [cpu, mem] = [ Math.round(s.cpu), Math.round( s.mem / 1024 / 1024 ) ]
            console.log(p.script, '\t', cpu, '\t', mem );
            if(p.script === 'dryrun.js') {
                p.childProcess.kill();
                ENGS._DATA[p.engine].memOverhead = mem;
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
        });
}

const checkIfProcessExists = cp => !(cp.exitCode === 0 || cp.killed);
