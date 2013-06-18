tasks.js
========

Convenient task scheduler for JavaScript using Web Workers.

Usage (check index.html for demo):

```javascript
 // setting worker count to 4
 var scheduler = new Scheduler(4);

 // settings common global var for all workers
 scheduler.setVar('prefix', 'result-');

 // setting specific global variable in each worker
 scheduler.workers.forEach(function (worker, index) {
     scheduler.setVar('index', index, worker);
 });

 // importing external scripts
 scheduler.importScripts('test.js');

 // same task for everybody - just for demo purposes
 function workerTask() {
     var start = Date.now();
     while (Date.now() - start < 5000);
     return prefix + index + (arguments.length ? ' (' + Array.prototype.join.call(arguments) + ')' : '') + suffix;
 }

 console.time('tasks');
 scheduler.executeMany(
     {
         first: workerTask,
         second: workerTask,
         third: workerTask,
         fourth: workerTask
     },
     function (results) {
         console.timeEnd('tasks');
         console.log(results);
     }
 );

 console.time('args');
 scheduler.executeForMany(
     workerTask,
     {
         first: [1, 2, 3],
         second: [4, 5, 6],
         third: [7, 8, 9],
         fourth: [10, 11, 12]
     },
     function (results) {
         console.timeEnd('args');
         console.log(results);
     }
 );
```
