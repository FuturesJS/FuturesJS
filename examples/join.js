/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Join = require("../join")
    , Future = require("../future")
    , synchronize = Join()
    , s1 = Future()
    , s2 = Future()
    , s3 = Future()
    ;

  console.log(Join);

  s1.deliver(undefined, "Hello");
  s3.deliver(undefined, "!");
  s2.deliver(undefined, "World");

  synchronize.add(s1, s2, s3);

  synchronize.when(function (args1, args2, args3) {
    console.log('[when]', args1[1], args2[1], args3[1]);
  });

  /*
  s2.deliver(undefined, "Amazing");
  */

  synchronize.whenever(function (args1, args2, args3) {
    console.log('[whenever]', args1[1], args2[1], args3[1]);
  });

  s2.deliver(undefined, "Cruel");
  s3.deliver(undefined, "World!");
  s1.deliver(undefined, "Goodbye");

}());
