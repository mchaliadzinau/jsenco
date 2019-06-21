load('benchmark.js');

const COUNT =  1024 * 1024 * 10;
new BenchmarkSuite('StringsConcat', 100, [
    new Benchmark("Strings", () => {
        let i = 0;
        let str = "string";
        while(i < COUNT) {
            i++;
            str += i;
        }
    })
]);
