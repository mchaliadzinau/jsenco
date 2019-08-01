const path = require('path');
const {getOsDependantFullPath} = require('./utils');

const [V8, JSC, SM, CHAKRA] = ['V8','JSC','SM','CHAKRA'];

/**
 * @param {string[]} tests
 * @return {EnTest.EnginesSetup} name getEnginesSetup.
 */
const getEnginesSetup = tests => ({
    list: [V8, JSC, SM, CHAKRA],
    V8: {
        name: 'V8',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/v8') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    JSC: {
        name: 'JSC',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/jsc') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    SM: {
        name: 'SM',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/sm') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    CHAKRA: {
        name: 'CHAKRA',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,'.jsvu/chakra') ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    }
});

module.exports = {
    V8, JSC, SM, CHAKRA,
    getEnginesSetup
}