/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
(function () {     
  "use strict";

  var Emitter, ___dirname;

  if (!__dirname) {
    ___dirname = 'futures';
  } else {
    ___dirname = __dirname;
  }

  module.exports = {
    future: require(___dirname + '/future'),
    sequence: require(___dirname + '/sequence'),
    join: require(___dirname + '/join'),
    emitter: require(___dirname + '/emitter'),
    asyncify: require(___dirname + '/asyncify'),
    loop: require(___dirname + '/loop'),
    modelify: require(___dirname + '/modelify')
  };

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
