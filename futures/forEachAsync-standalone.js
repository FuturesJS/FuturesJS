var __dirname = __dirname || '',
    provide = provide || function () {};
(function () {
  "use strict";

  var Sequence = require((__dirname ? __dirname + '/' : 'futures') + '/sequence');

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

  provide('futures/forEachAsync-standalone', module.exports);
}());
