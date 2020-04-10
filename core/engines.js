const path = require('path');
const {getOsDependantFullPath} = require('./utils');

const [V8, JSC, SM, CHAKRA] = ['V8','JSC','SM','CHAKRA'];
const JSVU_V8 = '.jsvu/v8';
const JSVU_JSC = '.jsvu/jsc'
const JSVU_SM = '.jsvu/sm'
const JSVU_CHAKRA = '.jsvu/chakra'
/**
 * @param {EnTest.ParsedTest[]} tests
 * @return {EnTest.EnginesSetup} EnginesSetup.
 */
const getEnginesSetup = tests => {
    let idx = 0;
    const suits = tests.reduce((acc, suit)=> {
        const flattenSuits = suit.benchmarks.map(b => Object.assign({id: idx++, suitName: suit.name}, b) )
        return acc.concat(flattenSuits);
    }, []);
    return {
        list: [V8, JSC, SM, CHAKRA],
        V8: {
            name: 'V8',
            memOverhead: 0, timeOverhead: 0,
            path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_V8) ),
            testsQueue: [...suits], testsPassed: [], testsFailed: []
        },
        JSC: {
            name: 'JSC',
            memOverhead: 0, timeOverhead: 0,
            path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_JSC) ),
            testsQueue: [...suits], testsPassed: [], testsFailed: []
        },
        SM: {
            name: 'SM',
            memOverhead: 0, timeOverhead: 0,
            path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_SM) ),
            testsQueue: [...suits], testsPassed: [], testsFailed: []
        },
        CHAKRA: {
            name: 'CHAKRA',
            memOverhead: 0, timeOverhead: 0,
            path: getOsDependantFullPath( path.resolve(process.env.HOME,JSVU_CHAKRA) ),
            testsQueue: [...suits], testsPassed: [], testsFailed: []
        }
    };
};

module.exports = {
    V8, JSC, SM, CHAKRA,
    getEnginesSetup
}