// Extending Array.prototype.forEachAsync
(function () {
  "use strict";

  var forEachAsync = require('forEachAsync');

  Array.prototype.forEachAsync = function (callback) {
    return forEachAsync(this, callback);
  };
}());
