import {ChildProcess} from 'child_process';

export interface TestResult {
    script: string,
    stdout: string,
    stderr: string,
    status: string,
    extime: number,
    stats: {
        cpus: number[], 
        mems: number[], 
        maxCPU: number,
        minCPU: number,
        maxMem: number,
        minMem: number,
    }
}

export interface EngineInfo {
    name: string,
    memOverhead: number,
    timeOverhead: number,
    path: string,
    testsQueue: string[],
    testsPassed: TestResult[],
    testsFailed: TestResult[]
}

export interface EnginesSetup {
    list: string[], 
    V8: EngineInfo,
    JSC: EngineInfo,
    SM: EngineInfo,
    CHAKRA: EngineInfo,
}

export interface Process {
    script: string,
    engine: string,
    childProcess: ChildProcess,
    startTime: number,
    cpuVals: number[],
    memVals: number[],
    isTimedOut? : boolean
}

export as namespace EnTest;