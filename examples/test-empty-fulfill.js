var Future = require('../lib/future')
  , future = Future();

future.fulfill();
future.when(function () {
  console.log("hello");
});
