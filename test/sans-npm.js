(function () {
  "use strict";

  var Futures = require(__dirname + '/../../futures/lib/promise'),
    promise = Futures.promise();

  promise.fulfill(undefined, "Hello World");

  promise.when(console.log);
}());
