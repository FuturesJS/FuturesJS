// Extending Array.prototype.forEachAsync
var __dirname = __dirname || '';
(function () {
  "use strict";

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
