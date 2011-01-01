(function () {
  "use strict";

  var Futures = require(__dirname + '/../lib');

  if (!Futures.future) {
    console.log("Fail: no futures");
  } else {
    console.log("Pass: `Futures`");
  }
}());
