(function () {
  "use strict";

  var Futures = require('futures'),
    promise = Futures.future();

  promise.fulfill(null, "Hello World");

  promise.when(console.log);
}());
