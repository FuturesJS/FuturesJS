// Extending Array.prototype.forEachAsync
var __dirname = __dirname || '';
(function () {
  "use strict";

  var forEachAsync = require('./forEachAsync-standalone');

  console.log(forEachAsync);

  Array.prototype.forEachAsync = function (callback) {
    return forEachAsync(this, callback);
  };
}());
