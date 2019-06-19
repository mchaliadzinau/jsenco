load('benchmark.js');
load('tests/modules/sliced_strings.setup.js')

  function clearString3(str) {
    //Но остаётся ссылка на строку ' ' + str
    //То есть в итоге строка занимает чуть больше
    return (' ' + str).slice(1);
  }
  function clearStringFast(str) {
    return str.length < 12 ? str : (' ' + str).slice(1);
  }

var arrayNumbers = new BenchmarkSuite('SlicedStrings Memory Overhead', 100, [
    new Benchmark("Clear with JSON.stringify", () => {
      Test(test_arr, (str) => {
        return JSON.parse(JSON.stringify(str));
      })
    })
]);

BenchmarkSuite.RunSuites({ NotifyResult: PrintResult,
    NotifyError: PrintError,
    NotifyScore: PrintScore });
