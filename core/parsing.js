const PATH = require('path');
const FS = require('fs');
const ACORN = require("acorn");
const { generate } = require('astring');

// const { generate } = require('astring');

const ERR_SUITE_NOT_ALLOWED = "Multiple BenchmarkSuites are not allowed!";
const ERR_SUITE_NOT_FOUND = "BenchmarkSuite is not found!";

const PATH_TESTS = PATH.resolve(process.cwd(), 'tests');
const PATH_TEST_CHAMBER = PATH.resolve(process.cwd(), 'test_chamber');

/** @type {string[]} */
const tests = FS.readdirSync(PATH_TESTS, {withFileTypes: true})
    .filter(file => PATH.extname(file.name) === '.js')
    .map(file=> PATH.resolve(PATH_TESTS,file.name) );

const suits = tests.map(test=> {
    const ast = ACORN.parse(FS.readFileSync(test).toString(), {});

    const BenchmarkSuiteAST = findBenchmarkSuiteDeclaration(ast);
    const index = ast.body.indexOf(BenchmarkSuiteAST);

    const BenchmarkSuite = getBenchmarkSuite(BenchmarkSuiteAST);
    const benchmarks = getBenchmarks(BenchmarkSuite);

    const testFileName = PATH.basename(test,'.js');
    return benchmarks.map(benchmark => {
        const name = benchmark.name.toLowerCase().replace(/[^A-Za-z0-9]*/g, '');
        const astCopy = Object.assign({},ast); 

        astCopy.body = ast.body.slice(0, index)
            .concat(benchmark.functionAST.body)
            .concat(ast.body.slice(index+1, ast.body.length));

        benchmark.functionAST;
        return {
            name: `${testFileName}.${name}.js`,
            code: generate(astCopy),
            source: testFileName
        }
    });
});

suits.forEach(suit=> {
    suit.forEach(benchmark=> {
        FS.writeFileSync(PATH.resolve(PATH_TEST_CHAMBER, benchmark.name), benchmark.code);
    });
})

// BenchmarkSuite 
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

function getBenchmarkSuite(ast) {
    let arguments = undefined;
    if(ast.type === "ExpressionStatement") {
        arguments = ast.expression.arguments;
    } else if(ast.type === "VariableDeclaration") {
        arguments = findVariableDeclaratorOfBenchmarkSuite(ast).init.arguments;
    } else {
        throw new Error("BenchmarkSuite is not found!")
    }
    return {
        name: arguments[0], 
        reference: arguments[1], 
        benchmarks: arguments[2]
    };

}

function transformBenchmarkSuite(ast) {
    return ast;
}

// Benchmark
/**
 * Process BenchmarkSuite AST arguments containing benchmarks
 * @param {*} suite 
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
            functionAST:  entry.arguments[1]
        }
    })
}
