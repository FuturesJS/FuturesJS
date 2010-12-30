(function () {
  "use strict";

  var Futures = require(__dirname + '/../../futures/lib');

  if (!Futures.subscription) {
    console.log("Fail: no subscriptions");
  } else {
    console.log("Pass: `Subscriptions`");
  }
}());
