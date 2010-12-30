(function () {
  "use strict";

  var Futures = require('futures'),
    promise = Futures.promise();

  promise.fulfill(undefined, "Hello World");

  promise.when(console.log);
}());
