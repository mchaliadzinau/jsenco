load('benchmark.js');

const COUNT =  1024 * 1024 * 10;
var arrayNumbers = new BenchmarkSuite('ArrayNumbers', 100, [
    new Benchmark("Ones", () => {
        const a = [];
        for (var i=0; i < COUNT ; i++) {
            // a.push(0.1);             // 50MB
            a.push(1);                  // 50Mb
            // a.push(0);               // 50Mb
            // a.push(null);            // 50Mb
            // a.push(undefined);       // 50Mb
            // a.push(Math.random());   // 45Mb
            // a.push({});              // 126MB / 118MB
        }
    })
]);

BenchmarkSuite.RunSuites({ NotifyResult: PrintResult,
    NotifyError: PrintError,
    NotifyScore: PrintScore });

print(COUNT);