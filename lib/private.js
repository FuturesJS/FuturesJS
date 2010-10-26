/*jslint browser: true, debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  module = {},
  provide = {},
*/
"use strict";
(function (undefined) {
  // logger utility
  function log(e) {
    var args = Array.prototype.slice.call(arguments);
    if ('undefined' !== typeof console && 'undefined' !== console.log) {
      try { // Firefox
        console.log.apply(console.log, args);
      }
      catch (ignore) {
        try { // WebKit Quirk/BUG fix
          console.log.apply(console, args);
        }
        catch (ignore_again) {
          console.log(e);
        }
      }
    }
  }

  // Exception Class
  function exception(msg) {
    this.name = "FuturesException";
    this.message = msg;
  }

  // error utility
  function error(e) {
    /* TODO if browser *** alert(e); *** */
    log(e);
    if (typeof console !== 'undefined') {
      debugger;
    }
    throw new exception(e);
  }
  module.exports = {
    log: log,
    error: error,
    exception: exception,
    extend: function (over, from) {
      Object.keys(from).forEach(function (key) {
        over[key] = from[key];
      });
      return over;
    }
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/private');
}());
