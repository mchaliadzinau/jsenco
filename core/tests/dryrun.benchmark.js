load('benchmark.js');

new BenchmarkSuite('Dry Run', 100, [
    new Benchmark("Do nothing", () => {
        // do nothing
    })
]);