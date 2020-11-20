import {ChildProcess} from 'child_process';

export interface TestingState {
    isStarted: boolean,
}

export interface TestResult {
    id: number,
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
    testsQueue: ParsedBenchmark[],
    testsPassed: TestResult[],
    testsFailed: TestResult[],
    becnhmarkTimeOverhead?: number,
    becnhmarkMemOverhead?: number,
    errors?: any[],
}

export interface EnginesSetup {
    list: string[], 
    V8: EngineInfo,
    JSC: EngineInfo,
    SM: EngineInfo,
    CHAKRA: EngineInfo,
}

export interface Process {
    id: number,
    script: string,
    engine: string,
    childProcess: ChildProcess,
    startTime: number,
    cpuVals: number[],
    memVals: number[],
    isTimedOut? : boolean,
    finishedAt: number,
    isKilled: boolean,
    isTestCompleted: boolean,
}

export interface ProcessStats {
    cpu: number,        // percentage (from 0 to 100*vcore)
    memory: number,     // bytes
    ppid: number,       // PPID
    pid: number,        // PID
    ctime: number,      // ms user + system time
    elapsed: number,    // ms since the start of the process
    timestamp: number   // ms since epoch
}

export interface ProcessEndResult {
    code: number | null,
    signal?: string,
    error?: Error
}

export interface RunTestsOptions {
    TIMEOUT: number,
    RESULTS_LATEST: string,
    skipBenchmarks?: boolean,
    skipPlainRun?: boolean,
    getState: () => TestingState,
    callback?: () => void,
}

export interface ParsedBenchmark {
    name: string,
    plainTestPath: string,
    benchmarkTestPath: string,
}
export interface ParsedTest {
    name: string,
    benchmarks: ParsedBenchmark[],
}

export as namespace EnTest;