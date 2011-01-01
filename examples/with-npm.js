(function () {
  "use strict";

  var Futures = require('futures'),
    promise = Futures.future();

  promise.fulfill(undefined, "Hello World");

  promise.when(console.log);
}());
