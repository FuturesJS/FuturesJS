(function () {
  "use strict";

  var Sequence = require('futures/sequence'),
    count = 0;

  Array.prototype.forEachAsync = function (callback) {
    var self = this,
      sequence = Sequence();

    function handleItem(item, i, arr) {
      sequence.then(function (next) {
        callback(next, item, i, arr);
      });
    }

    this.forEach(handleItem);
  };


  [101,502,203,604,105].forEachAsync(function (next, time) {
    console.log(count += 1, time);
    setTimeout(next, time);
  });
}());
