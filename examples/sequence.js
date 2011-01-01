(function () {
  "use strict";

  console.log("This is a visual test.");

  var Sequence  = require(__dirname + "/../lib/sequence"),
    sequence = Sequence();

  sequence
    .then(function (next, err, a, b, c) {
      console.log(a, b, c);
      next(undefined, "d", "e", "f");
    })
    .then(function (next, err, d, e, f) {
      console.log(d, e, f);
      next(undefined, "g", "h", "i");
    })
    .begin(undefined, "a", "b", "c");

  sequence
    .then(function (next, err, g, h, i) {
      console.log(g, h, i);
      next(undefined, "j", "k", "l");
    }).then(function (next, err, j, k, l) {
      console.log(j, k, l);
      next(undefined, "m", "n", "o");
    });

}());
