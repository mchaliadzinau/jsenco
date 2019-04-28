const path = require('path');
const ENG_V8 = path.resolve(process.env.HOME,'.jsvu/engines/v8/v8');
const ENG_JSC = path.resolve(process.env.HOME,'.jsvu/engines/javascriptcore/jsc');
const ENG_SM = path.resolve(process.env.HOME,'.jsvu/engines/spidermonkey/spidermonkey');
const ENG_CHAKRA = path.resolve(process.env.HOME,'.jsvu/engines/chakra/chakra');

const { execFile }  = require('child_process');
const pidusageTree = require('pidusage-tree');

const command = 'let i = 0; let str = "string"; while(i < 99999999999999) { i++;  str += i*i*i;} print(1)';
console.log(ENG_V8);
const childProcess = execFile(ENG_V8, ['-e', command],{}, (err, stdout, stderr)=>console.log(err, stdout, stderr));

console.log(process.memoryUsage());
setInterval(()=>
pidusageTree(childProcess.pid, function (err, stats) {
  err && console.error(err)
  err && process.abort();
  false && console.log(stats);
  const keys = Object.keys(stats);
  const s = keys.reduce( (acc,key)=> {
      acc.mem += stats[key].memory;
      acc.cpu += stats[key].cpu;
      return acc;
    },
    {mem: 0, cpu: 0}
                       );
  console.log(s);
  // => {
  //   cpu: 10.0,            // percentage (from 0 to 100*vcore)
  //   memory: 357306368,    // bytes
  //   ppid: 312,            // PPID
  //   pid: 727,             // PID
  //   ctime: 867000,        // ms user + system time
  //   elapsed: 6650000,     // ms since the start of the process
  //   timestamp: 864000000  // ms since epoch
      // 
}), 
2000);
