(function () {
  "use strict";

  var Futures = require('futures');

  if (!Futures.future) {
    console.log("Fail: no futures");
  } else {
    console.log("Pass: `Futures`");
  }
}());
