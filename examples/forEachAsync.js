/*jshint laxcomma:true node:true*/
// Testing functionality
(function () {
  "use strict";

  var forEachAsync = require('../forEachAsync')
    , sequence = require('../sequence').create()
    , count = 0
    , timers = [
        101,
        502,
        203,
        604,
        105
      ]
    ;

  sequence.then(function (next) {
    forEachAsync(timers, function (next, time) {
      console.log(count += 1, time);
      this[count] = time;
      setTimeout(next, time);
    }, { 'answer': 42 }).then(function () {
      console.log("First Done: shoud have printed 5 times for ", this);
      next();
    });
  });

  sequence.then(function (next) {
    forEachAsync(timers, function (next, time) {
      console.log('brake check:', time);
      next(forEachAsync.BREAK);
    }).then(function () {
      console.log('Second Done: should have printed 1 time');
      next();
    });
  });
}());
