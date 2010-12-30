/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
// Node.js and Browsers include these. They're available in Rhino with env.js
var console = {},
  setTimeout = function () {},
  setInterval = function () {},
  clearTimeout = function () {},
  clearInterval = function () {};
*/
(function () {     
  "use strict";

  var ___dirname;
  if ('undefined' === typeof __dirname || !__dirname) {
    ___dirname = 'futures';
  } else {
    ___dirname = __dirname;
  }

  module.exports = {
    subscription: require(___dirname + '/subscription'),
    promise: require(___dirname + '/promise')
  };

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
