(function () {
  "use strict";

  console.log("This is a visual test.");

  var Loop = require(__dirname + "/../lib/loop"),
    loop = Loop();

  console.log(Loop);

  loop.setTimeout(400);
  loop.setWait(100);
  loop.setMaxLoop(3);
  loop.run(function (next, err, data) {
    if (data > 5) {
      next("break", err, data);
    }
    console.log(data);
    next(err, data + 1);
  }, 0).when(function (err, data) {
    console.log("loop ended", err, data);
  });
  
}());
