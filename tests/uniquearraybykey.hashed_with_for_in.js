/**
 * Test case created by Cak3
 * Source: http://jsperf.com/uniqueArrayByKey
 */
load('benchmark.js');
load('tests/modules/uniquearraybykey.setup.js');

new BenchmarkSuite('uniqueArrayByKey', 100, [
    new Benchmark("hashed with For in (slowest)", () => {
        const mergedArr = a1.concat(a2);
        const hashed = {};
        const uniqueArr = [];
        
        for (const item of mergedArr) {
            hashed[item.hid] = item;
        }
        
        for (const item in hashed) {
          uniqueArr.push(item)
        }
    }),
    new Benchmark("two loops (fastest)", () => {
        const mergedArr = a1.concat(a2);
        const uniqueArr = [];

        for (let i = 0; i < mergedArr.length; i++) {
            const item = mergedArr[i];
            let dubItem;

            for (let k = i + 1; k < mergedArr.length; k++) {
                if (item.hid === mergedArr[k].hid) {
                    dubItem = mergedArr[k];
                    break;
                }
            }

            if (!dubItem) {
                uniqueArr.push(item);
            }
        }
    })
]);