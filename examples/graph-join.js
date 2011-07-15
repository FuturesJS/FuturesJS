/*

      f1    f2
      |     |
      ---|--- 
         f3      f4
         |       |
          ---|---
             |
             |
            f5
             |
             |
            f6
 */
(function () {
  "use strict";

  var Futures = require('futures')
    , sequence = Futures.sequence()
    , waiterNum = 0
    ;

  function createWaiter() {
    var waiterCount = waiterNum + 1;
    waiterNum = waiterCount;
    return function (cb) {
      setTimeout(function () {
        cb(waiterCount);
      }, Math.floor(Math.random() * 1001));
    };
  }

  function showArgs(args) {
    console.log('arguments', Array.prototype.slice.call(args, 1));
  }

  sequence
    .then(function (next) {
      var f1 = createWaiter()
        , f2 = createWaiter()
        , j1 = Futures.join()
        ;

      // new in 2.3.0 -- adding nothing creates a callback
      f1(j1.add());
      f2(j1.add());

      showArgs(arguments);
      j1.when(next)
    })
    .then(function (next) {
      var f3 = createWaiter()
        , f4 = createWaiter()
        , j2 = Futures.join()
        ;

      f3(j2.add());
      f4(j2.add());

      showArgs(arguments);
      j2.when(next)
    })
    .then(function (next) {
      var f5 = createWaiter();

      showArgs(arguments);
      f5(next);
    })
    .then(function (next) {
      var f6 = createWaiter();

      showArgs(arguments);
      f6(next);
    }).then(function () {
      showArgs(arguments);
      console.log('all done');
    });
    ;
}());
