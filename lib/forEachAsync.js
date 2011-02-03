// Extending Array.prototype.forEachAsync
(function () {
  "use strict";

  if ('undefined' === typeof __dirname) {
    __dirname = '';
  }

  var Sequence = require((__dirname ? __dirname + '/' : 'futures') + '/sequence');

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
