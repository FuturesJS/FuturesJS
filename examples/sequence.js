(function () {
  "use strict";

  console.log("This is a visual test.");

  var Sequence  = require(__dirname + "/../lib/sequence"),
    sequence = Sequence(),
    err = undefined;

  sequence
    .then(function (next) {
      next(err, "a", "b", "c");
    })
    .then(function (next, err, a, b, c) {
      setTimeout(function () {
        console.log(a, b, c);
        next(err, "d", "e", "f");
      }, 1000);
    })
    .then(function (next, err, d, e, f) {
      setTimeout(function () {
        console.log(d, e, f);
        next(err, "g", "h", "i");
      }, 500);
    });

  sequence
    .then(function (next, err, g, h, i) {
      setTimeout(function () {
        console.log(g, h, i);
        next(err, "j", "k", "l");
      }, 100);
    }).then(function (next, err, j, k, l) {
      console.log(j, k, l);
      next(err, "m", "n", "o");
    });

}());
