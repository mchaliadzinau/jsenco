load('benchmark.js');

new BenchmarkSuite('Dry Loop', 100, [
    new Benchmark("While(1)", () => {
        while(1){}
    })
]);