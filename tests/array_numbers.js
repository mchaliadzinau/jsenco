const COUNT =  1024 * 1024;
const a = [];
for (var i=0; i < COUNT ; i++) {
    // a.push(0.1);             // 50MB
    a.push(1);               // 50Mb
    // a.push(0);               // 50Mb
    // a.push(null);            // 50Mb
    // a.push(undefined);       // 50Mb
    // a.push(Math.random());   // 45Mb
    // a.push({});              // 126MB / 118MB
}

print(COUNT);