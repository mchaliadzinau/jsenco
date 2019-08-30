const PATH = require('path');
const FS = require('fs');
const ACORN = require("acorn");
const { generate } = require('astring');

const {cleanupTestChamber} = require('./utils');

const ERR_SUITE_NOT_ALLOWED = "Multiple BenchmarkSuites are not allowed!";
const ERR_SUITE_NOT_FOUND = "BenchmarkSuite is not found!";

const PATH_TESTS = PATH.resolve(process.cwd(), 'tests');
const PATH_TEST_CHAMBER = PATH.resolve(process.cwd(), 'test_chamber');

/** @type {string[]} */
const tests = FS.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => PATH.extname(file.name) === '.js')
    .map(file=> PATH.resolve(PATH_TESTS,file.name) );

cleanupTestChamber(PATH_TEST_CHAMBER);
const suits = tests.map(test=> {
    /** @type {AST.Node} */
    const ast = ACORN.parse(FS.readFileSync(test).toString(), {});

    const declarationAST = findBenchmarkSuiteDeclaration(ast);
    const index = ast.body.indexOf(declarationAST);

    const suite = getBenchmarkSuite(declarationAST);
    const benchmarks = getBenchmarks(suite);

    const testFileName = PATH.basename(test,'.js');
    return benchmarks.map(benchmark => {
        const name = benchmark.name.toLowerCase().replace(/ /g, '_').replace(/[^A-Za-z0-9_]*/g, '');

        return {
            name: `${testFileName}.${name}`,
            testCode: generate( createTestProgramAST(ast, index, benchmark) ),
            benchmarkCode: generate( createBenchmarkProgramAST(ast, index, suite, benchmark) ),
            sourceFile: testFileName
        }
    });
});

suits.forEach(suit=> {
    suit.forEach(benchmark=> {
        FS.writeFileSync(PATH.resolve(PATH_TEST_CHAMBER, benchmark.name + '.js'), benchmark.testCode);
        FS.writeFileSync(PATH.resolve(PATH_TEST_CHAMBER, benchmark.name + '.becnhmark.js'), benchmark.benchmarkCode);
    });
})

// BenchmarkSuite 
/**
 * @param {AST.BenchmarkSuite} variableDeclarationAST 
 * @return {AST.VariableDeclarator}
 */
function findVariableDeclaratorOfBenchmarkSuite(variableDeclarationAST) {
    if(variableDeclarationAST.type !== "VariableDeclaration") {
        throw new Error("INTERNAL ERROR: expected VariableDeclaration");
    }
    return variableDeclarationAST.declarations.find(declaration => (
        declaration.type === "VariableDeclarator"
        && declaration.init.type === "NewExpression"
        && declaration.init.callee.type === "Identifier"
        && declaration.init.callee.name === "BenchmarkSuite"
    ));
}

/**
 * 
 * @param {AST.Node} ast 
 * @return {AST.BenchmarkSuite}
 */
function findBenchmarkSuiteDeclaration(ast) {
    const BenchmarkSuiteDeclarationAST = ast.body.filter(entry => (
            entry.type === "ExpressionStatement"
            && entry.expression.type === "NewExpression"
            && entry.expression.callee.type === "Identifier"
            && entry.expression.callee.name === "BenchmarkSuite"
        ) || (
            entry.type === "VariableDeclaration"
            && findVariableDeclaratorOfBenchmarkSuite(entry)
        )
    );

    if(BenchmarkSuiteDeclarationAST.length === 1) {
        return BenchmarkSuiteDeclarationAST[0];
    } else {
        throw new Error(BenchmarkSuiteDeclarationAST.length > 1 
            ? ERR_SUITE_NOT_ALLOWED
            : ERR_SUITE_NOT_FOUND
        );
    }
}
/**
 * Gets BenchmarkSuite
 * @param {AST.BenchmarkSuite} ast 
 * @return {AST.BenchmarkSuiteInstantiation}
 */
function getBenchmarkSuite(ast) {
    let arguments = undefined;
    let suiteAST = undefined;
    if(ast.type === "ExpressionStatement") {
        suiteAST = ast.expression;
        arguments = ast.expression.arguments;
    } else if(ast.type === "VariableDeclaration") {
        suiteAST = findVariableDeclaratorOfBenchmarkSuite(ast).init;
        arguments = ast.arguments;
    } else {
        throw new Error("BenchmarkSuite is not found!")
    }
    return {
        name: arguments[0], 
        reference: arguments[1], 
        benchmarks: arguments[2],
        ast: suiteAST
    };

}

function transformBenchmarkSuite(ast) {
    return ast;
}

// Benchmark
/**
 * Process BenchmarkSuite AST arguments containing benchmarks
 * @param {AST.BenchmarkSuiteInstantiation} suite 
 */
function getBenchmarks(suite) {
    if(suite.benchmarks.type !== "ArrayExpression") {
        throw new Error("Third argument of BenchmarkSuite should be array.")

    }
    return suite.benchmarks.elements.map((entry, idx) => {
        if(entry.type !== "NewExpression" || entry.callee.name !== "Benchmark") {
            throw new Error("Third parameter of BenchmarkSuite should only contain array of Benchmark instances");
        }
        if(entry.arguments[0].type !== "Literal" || !entry.arguments[0].value) {
            throw new Error(`Benchmark №${idx} should have name.`);
        }
        if(["FunctionExpression", "ArrowFunctionExpression"].indexOf(entry.arguments[1].type) === -1) {
            throw new Error(`Benchmark №${idx} should have function as second parameter.`);
        }
        return {
            name: entry.arguments[0].value,
            functionAST:  entry.arguments[1],
            benchmarkAST: entry
        }
    })
}

/**
 * 
 * @param {AST.Node} source 
 * @param {number} index 
 * @param {*} benchmark 
 */
function createTestProgramAST(source, index, benchmark) {
    const testProgramAST = JSON.parse( JSON.stringify(source) );
    testProgramAST.body = testProgramAST.body.slice(0, index)
        .concat(benchmark.functionAST.body)
        .concat(testProgramAST.body.slice(index+1, testProgramAST.body.length));

    const loadBenchmarkJsAST = testProgramAST.body.find(entry => {
        return entry.type === "ExpressionStatement" 
        && entry.expression.callee.type === "Identifier" 
        && entry.expression.callee.name === "load"
        && entry.expression.arguments.find(argument => argument.type === "Literal" && argument.value === "benchmark.js");
    });
    testProgramAST.body.splice( testProgramAST.body.indexOf(loadBenchmarkJsAST) , 1); // Get rid of "load('benchmark.js');"
    return testProgramAST;
}

function createBenchmarkProgramAST(source, index, benchmarkSuite, benchmark) {
    const ast = JSON.parse( JSON.stringify(source) );
    const suiteClone = JSON.parse( JSON.stringify(benchmarkSuite.ast) );
    Object.assign(suiteClone, {arguments: [ suiteClone.arguments[0], suiteClone.arguments[1], benchmark.functionAST ]})
    ast.body = source.body.slice(0, index)
        .concat(suiteClone)
        .concat(source.body.slice(index+1, source.body.length));
    return ast;
}