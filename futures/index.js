/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
(function () {
  "use strict";

  var modulepath;

  function upgradeMessage() {
    var msg = "You have upgraded to Futures 2.x. See http://github.com/coolaj86/futures for details.";
    console.log(msg);
    throw new Error(msg);
  }

  module.exports = {
    promise: upgradeMessage,
    subscription: upgradeMessage,
    synchronize: upgradeMessage,
    whilst: upgradeMessage,
    future: require('future'),
    forEachAsync: require('forEachAsync'),
    sequence: require('sequence'),
    join: require('join'),
    asyncify: require('asyncify'),
    loop: require('loop'),
    chainify: require('chainify')
  };
}());
