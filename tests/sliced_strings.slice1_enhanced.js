load('benchmark.js');
load('tests/modules/sliced_strings.setup.js')

var arrayNumbers = new BenchmarkSuite('SlicedStrings Memory Overhead', 100, [
    new Benchmark("Clear with slice(1) with length check", () => {
        Test(test_arr, (str) => {
            return str.length < 12 ? str : (' ' + str).slice(1);
      })
    })
]);

BenchmarkSuite.RunSuites({ NotifyResult: PrintResult,
    NotifyError: PrintError,
    NotifyScore: PrintScore });
