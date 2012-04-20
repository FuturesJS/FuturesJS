(function () {
  "use strict";

  var Parallel = require('./parallel')
    , parallel
    ;

  parallel = Parallel.create(function (complete, item, i) {
    var timeout = Math.round(100 + (Math.random() * 1000));
    setTimeout(function () {
      console.log(item, i, timeout);
      complete();
    }, timeout);
  }, 4);

  parallel.add('abcdefghijklmnopqrstuvwxyz'.split('')).when(function () {
    console.log('finished lowercase batch');
  });

  parallel.add('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).when(function () {
    console.log('finished UPPERCASE batch');
  });
}());
