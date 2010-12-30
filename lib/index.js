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

  var Futures = require('futures/private');

  Futures.extend(Futures, require('futures/promise'));
  Futures.extend(Futures, require('futures/subscription'));
  Futures.extend(Futures, require('futures/chainify'));
  Futures.extend(Futures, require('futures/util'));

  module.exports = Futures;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
