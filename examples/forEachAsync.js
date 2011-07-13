// Testing functionality
(function () {
  "use strict";

  var forEachAsync = require('forEachAsync')
    , count = 0
    , timers = [
        101,
        502,
        203,
        604,
        105
      ];

  forEachAsync(timers, function (next, time) {
    console.log(count += 1, time);
    setTimeout(next, time);
  }).then(function () {
    console.log("All Done");
  });
}());
