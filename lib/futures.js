/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
// Node.js and Browsers include these. They're available in Rhino with env.js
var console = {},
  setTimeout = function () {},
  setInterval = function () {},
  clearTimeout = function () {},
  clearInterval = function () {};
*/
"use strict";
var Futures;
(function () {     
  Futures = require('futures/private');
  Futures.extend(Futures, require('futures/promise'));
  Futures.extend(Futures, require('futures/subscription'));
  Futures.extend(Futures, require('futures/chainify'));
  Futures.extend(Futures, require('futures/util'));
  Futures.extend(Futures, require('futures/deprecated'));

  /**
   * Public Promise and Subscription Methods
   */
  public_methods = {
    promise: Futures.promise,
    subscription: Futures.subscription,
    subscription2promise: Futures.subscription2promise,
    join: Futures.join,
    synchronize: Futures.synchronize,
    sequence: Futures.sequence,
    chainify: Futures.chainify,
    futurify: Futures.chainify,
    sleep: function() { error('Not Implemented Yet'); },
    wait: function() { error('Not Implemented Yet'); },
    watchdog: function() { error('Not Implemented Yet'); },
    log: Futures.log,
    error: Futures.error,

    // Slated for removal
    promisify: Futures.promisify,
    subscribify: Futures.subscribify
  };
  
  module.exports = Futures;
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
