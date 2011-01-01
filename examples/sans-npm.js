(function () {
  "use strict";

  var Futures = require(__dirname + '/../lib'),
    promise = Futures.future();

  promise.fulfill(undefined, "Hello World");

  promise.when(console.log);
}());
