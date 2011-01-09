(function () {
  "use strict";

  console.log("This is a visual test.");

  var Sequence  = require(__dirname + "/../lib/sequence"),
    sequence = Sequence(),
    err = undefined;

  sequence
    .then(function (next) {
      setTimeout(function () {
        next(err, "a", "b", "c");
      }, 100);
    })
    .then(function (next, err, a, b, c) {
      setTimeout(function () {
        console.log(a, b, c);
        next(err, "d", "e", "f");
      }, 200);
    })
    .then(function (next, err, d, e, f) {
      setTimeout(function () {
        console.log(d, e, f);
        next(err, "g", "h", "i");
      }, 500);
    });

  sequence
    .then(function (next, err, g, h, i) {
      console.log(g, h, i);
      next(err, "j", "k", "l");
    }).then(function (next, err, j, k, l) {
      console.log(j, k, l);
      next(err, "m", "n", "o");
    });

}());
