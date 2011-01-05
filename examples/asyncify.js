(function () {
  "use strict";

  console.log("This is a visual test.");

  var Asyncify = require(__dirname + "/../lib/asyncify"),
    onceOnlySync,
    onceOnly,
    future;

  console.log(Asyncify);


  // Don't even bother looking at this mess.
  //
  // Let this explanation suffice:
  // A function that replaces itself with an error once called
  onceOnlySync = (function (func) {
    return function () {
      var f = func;
      func = function () {
        throw new Error("[Pass: not actually an error] Don't call me no more: I'm dead");
      };
      return f.apply(this, arguments);
    };
  }(function () {
    return "I'm dying!"
  }));




  onceOnly = Asyncify(onceOnlySync);

  onceOnly.whenever(function (err, data) {
    console.log("[whenever] " + (err || data));
  });

  onceOnly().when(function (err, data) {
    console.log("[when[0]]  " + (err || data));
  });

  onceOnly();

  // Asap is turned off for asyncify, so this doesn't run immediately
  onceOnly.when(function (err, data) {
    console.log("[when[1]   " + (err || data));
  });
  
}());
