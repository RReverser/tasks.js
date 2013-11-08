tasks.js
========

Convenient task scheduler for JavaScript using Web Workers.

Supposed usage (not working, TBD in this branch):

```javascript
// sets thread count (each thread object
// accessible via threads[i])
parallel.threads.length = 4;

var a = new Array(n), m = 0;

function currentSum() {
  return a.reduce(function (x, y) {
    return x + y;
  }, 0);
}

// frequently modified variable
setInterval(function () {
  m++;
}, 100);

// executes inner code in web worker
// with passed `i` value
for (var i = 0; i < n; i++) parallel:{
  // in-thread calculation
  var fact = 1;
  for (var j = 2; j < i; j++) fact *= j;
  
  // modifying external variable
  // => push changes to main thread
  // w/o stopping thread
  a[i] = j;
  
  setTimeout(function () {
    var temp = m;
    /* temp === 0 since using value
    from the moment of spawn */
  }, 1000);
  
  setTimeout(function () {
    var temp = unparallel(m);
    /* temp contains latest `m` value;
    stops thread until current value is fetched */
  }, 1000);
  
  // calls external function;
  // stops thread until result is fetched
  var sum = currentSum();
}
```
