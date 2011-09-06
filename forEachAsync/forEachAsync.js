(function () {
  "use strict";

  var Sequence = require('sequence');

  function forEachAsync(arr, callback) {
    var sequence = Sequence();

    function handleItem(item, i, arr) {
      sequence.then(function (next) {
        callback(next, item, i, arr);
      });
    }

    arr.forEach(handleItem);

    return sequence;
  }

  module.exports = forEachAsync;
}());
