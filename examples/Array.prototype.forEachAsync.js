// Extending Array.prototype.forEachAsync
(function () {
  "use strict";

  var Sequence = require('futures/sequence');

  Array.prototype.forEachAsync = function (callback) {
    var self = this,
      sequence = Sequence();

    function handleItem(item, i, arr) {
      sequence.then(function (next) {
        callback(next, item, i, arr);
      });
    }

    this.forEach(handleItem);

    return sequence;
  };
}());

// Testing functionality
(function () {
  "use strict";

  var count = 0,
    timers = [
      101,
      502,
      203,
      604,
      105
    ],
    sequence;

  sequence = timers.forEachAsync(function (next, time) {
    console.log(count += 1, time);
    setTimeout(next, time);
  });

  sequence.then(function (next) {
    console.log("All Done");
  });
}());
