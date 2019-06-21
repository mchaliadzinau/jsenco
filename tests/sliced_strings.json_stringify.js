load('benchmark.js');
load('tests/modules/sliced_strings.setup.js')


new BenchmarkSuite('SlicedStrings Memory Overhead', 100, [
    new Benchmark("Clear with JSON.stringify", () => {
      Test(test_arr, (str) => {
        return JSON.parse(JSON.stringify(str));
      })
    })
]);

