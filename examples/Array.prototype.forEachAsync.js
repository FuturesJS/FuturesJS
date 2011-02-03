// Testing functionality
(function () {
  "use strict";

  require('futures/forEachAsync');

  var count = 0,
    timers = [
      101,
      502,
      203,
      604,
      105
    ],
    sequence;

  timers.forEachAsync(function (next, time) {
    console.log(count += 1, time);
    setTimeout(next, time);
  })
  .then(function (next) {
    console.log("All Done");
  });
}());
