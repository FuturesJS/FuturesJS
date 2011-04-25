// Extending Array.prototype.forEachAsync
var __dirname = __dirname || '';
(function () {
  "use strict";

  var forEachAsync = require((__dirname ? __dirname + '/' : 'futures') + '/forEachAsync-standalone');

  Array.prototype.forEachAsync = function (callback) {
    return forEachAsync(this, callback);
  };
}());
