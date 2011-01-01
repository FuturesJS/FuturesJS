(function () {
  "use strict";

  console.log("This is a visual test.");

  var Promise = require(__dirname + "/../lib/future"),
    promise = Promise();

  console.log(Promise);

  promise.when(function (err, data) {
    console.log(data);
  });
  promise.fulfill(undefined, "hello world");
  promise.when(function (err, data) {
    console.log(data);
  });
  try {
    promise.fulfill(undefined, "end-of-the-world");
    console.log("Fail");
  } catch(e) {
    console.log("Pass if hello world is displayed twice");
  }
}());
