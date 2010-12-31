(function () {
  "use strict";

  console.log("This is a visual test.");

  var Emitter = require(__dirname + "/../lib/emitter"),
    emitter = Emitter();

  console.log(Emitter);

  console.log(emitter);

  emitter.on("foo", function (data) {
    console.log(data);
  });

  emitter.emit("foo", "bar");
}());
