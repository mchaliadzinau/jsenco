// @ts-nocheck
load('benchmark.js');
load('tests/modules/sliced_strings.setup.js')


new BenchmarkSuite('SlicedStrings Memory Overhead', 100, [
    new Benchmark("Clear with JSON.stringify", () => {
      Test(test_arr, (str) => {
        return JSON.parse(JSON.stringify(str));
      })
    }),
    new Benchmark("Clear with slice(1) with length check", () => {
      Test(test_arr, (str) => {
          return str.length < 12 ? str : (' ' + str).slice(1);
      })
    }),
    new Benchmark("Clear with slice(1)", () => {
      Test(test_arr, (str) => {
          //Но остаётся ссылка на строку ' ' + str
          //То есть в итоге строка занимает чуть больше
          return (' ' + str).slice(1);
      })
    }),
    new Benchmark("Clear with split.join", () => {
      Test(test_arr, (str) => {
        return str.split('').join('');
      })
    })
]);

