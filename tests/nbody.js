// @ts-nocheck
/* The Great Computer Language Shootout
   http://shootout.alioth.debian.org/
   contributed by Isaac Gouy */
load('benchmark.js');
load('tests/modules/nbody.setup.js');

new BenchmarkSuite('N-Body', 100, [
    new Benchmark("N-Body", () => {
        let ret;
        for ( let n = 3; n <= 6; n *= 2 ) {
            let bodies = new NBodySystem( Array(
               Sun(),Jupiter(),Saturn(),Uranus(),Neptune()
            ));
            let max = n * 100;
                
            ret = bodies.energy();
            for (let i=0; i<max; i++){
                bodies.advance(0.01);
            }
            ret = bodies.energy();
        }
    })
]);
