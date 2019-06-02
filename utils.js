const { execFile }  = require('child_process');
const pidusageTree = require('pidusage-tree');
const { performance } = require('perf_hooks');

const checkIfProcessExists = cp => !(cp.exitCode === 0 || cp.killed);

const checkIfProcessFinishedCorrectly = cp => (cp.exitCode === 0 || !cp.killed);

/**
 * Print on Same Line (restricted to 80 chars line)
 * @param {*} text 
 */
const printOSL = text => {
    process.stdout.write('                                                                                \033[0G');
    process.stdout.write(text + '\033[0G');
}

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

const execDryRun = (enginePath, forever) => {
    return new Promise((resolve,reject) => {
        const startTime = performance.now();
        const command = forever ? 'while(1) {}' : 0;
        const dryRunProcess = execFile(enginePath, ['-e', command],{}, (err, stdout, stderr)=>{
            if(err || stderr) {
                reject({err, stderr});
            }
        });
        dryRunProcess.on('connection', (a) => {
            console.log(a);
        })
        if(forever && dryRunProcess.connected) {
            pidusageTree(dryRunProcess.pid, function(err, stats) {
                dryRunProcess.kill();
                const [cpu, mem] = processPidusageStats(stats)
                resolve(mem);
            });
        } else {
            resolve(performance.now() - startTime);
        }
    })
}

const getOsDependatnFullPath = path => ~process.platform.indexOf('win') ? `${path}.cmd` : path;

module.exports = {
    checkIfProcessExists,
    checkIfProcessFinishedCorrectly,
    printOSL,
    processPidusageStats,
    execDryRun,
    getOsDependatnFullPath
}