// Testing functionality
(function () {
  "use strict";

  var forEachAsync = require('futures').forEachAsync,
      count = 0,
      timers = [
        101,
        502,
        203,
        604,
        105
      ],
      sequence;

  forEachAsync(timers, function (next, time) {
    console.log(count += 1, time);
    setTimeout(next, time);
  }).then(function (next) {
    console.log("All Done");
  });
}());
