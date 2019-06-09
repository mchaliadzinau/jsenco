/**
 * 
 * @param {*} str 
 * SOURCE: https://habr.com/ru/post/449368
 */

  const COUNT = 1024 * 1024 * 10;

  function clearString(str) {
    return str.split('').join('');
  }
  function clearString2(str) {
    return JSON.parse(JSON.stringify(str));
  }
  function clearString3(str) {
    //Но остаётся ссылка на строку ' ' + str
    //То есть в итоге строка занимает чуть больше
    return (' ' + str).slice(1);
  }
  function clearStringFast(str) {
    return str.length < 12 ? str : (' ' + str).slice(1);
  }
  
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
  
  print(COUNT);
  // print(Test(test_arr,clearString2));
  // print(Test(test_arr,clearString3));
  // print(Test(test_arr,clearStringFast));
