(function () {
  "use strict";

  console.log("This is a visual test.");

  var Loop = require(__dirname + "/../lib/loop")
    , loop = Loop()
    , maxLoop = 8
    , maxTimeout = 800;

  console.log(Loop);

  loop.setTimeout(maxTimeout);
  loop.setWait(100);
  loop.setMaxLoop(maxLoop);
  loop.run(function (next, err, data) {
    if (data > 5) {
      next("break", err, data);
    }
    console.log(data);
    next(err, data + 1);
  }, 0).when(function (err, data) {
    console.log("loop ended [Pass, ignore error, if any]", err, data);
  });
  
}());
