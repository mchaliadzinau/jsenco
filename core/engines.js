const path = require('path');
const {getOsDependantFullPath} = require('./utils');

const [V8, JSC, SM, CHAKRA] = ['V8','JSC','SM','CHAKRA'];
const JSVU_V8 = '.jsvu/v8';
const JSVU_JSC = '.jsvu/jsc'
const JSVU_SM = '.jsvu/sm'
const JSVU_CHAKRA = '.jsvu/chakra'
/**
 * @param {string[]} tests
 * @return {EnTest.EnginesSetup} EnginesSetup.
 */
const getEnginesSetup = tests => ({
    list: [V8, JSC, SM, CHAKRA],
    V8: {
        name: 'V8',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_V8) ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    JSC: {
        name: 'JSC',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_JSC) ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    SM: {
        name: 'SM',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_SM) ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    },
    CHAKRA: {
        name: 'CHAKRA',
        memOverhead: 0, timeOverhead: 0,
        path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_CHAKRA) ),
        testsQueue: [...tests], testsPassed: [], testsFailed: []
    }
});

module.exports = {
    V8, JSC, SM, CHAKRA,
    getEnginesSetup
}