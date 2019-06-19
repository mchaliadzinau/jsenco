/**
 * 
 * @param {*} str 
 * SOURCE: https://habr.com/ru/post/449368
 */

const COUNT = 1024 * 1024 * 10;

function Test(test_arr,fn) {
  let check1 = Date.now();
  let a = []; //Мешаем оптимизатору.
  for(let i=0; i < COUNT;i++){
    a.push(fn(test_arr[i]));
  }
  let check2 = Date.now();
  return check2-check1 || a.length;
}

var huge = "x".repeat(15).repeat(1024).repeat(1024); // 15Mb string
var test_arr = [];
for(let i=0;i < COUNT;i++) {
  test_arr.push(huge.substr(i,25)); //Мешаем оптимизатору.
}