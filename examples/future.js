/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Future = require("../future")
    , s1 = Future()
    , s2 = Future()
    , s3 = Future.create()
    ;

  s1.deliver(undefined, "Hello");
  s2.deliver(undefined, "World");

  function logWhen(a, b) {
    console.log('[when]', !a, b);
  }
  s1.when(logWhen);
  s2.when(logWhen);
  s3.when(logWhen);

  s3.deliver(undefined, "!");

  function logWhenever(a, b) {
    console.log('[whenever]', !a, b);
  }
  s1.whenever(logWhenever);
  s2.whenever(logWhenever);
  s3.whenever(logWhenever);

  s1.deliver(undefined, "Goodbye");
  s2.deliver(undefined, "Cruel");
  s3.deliver(undefined, "World!");
}());
