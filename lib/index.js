/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
(function () {     
  "use strict";

  var Emitter, ___dirname;

  if (!__dirname) {
    ___dirname = 'futures';
  } else {
    ___dirname = __dirname;
  }

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
    future: require(___dirname + '/future'),
    sequence: require(___dirname + '/sequence'),
    join: require(___dirname + '/join'),
    emitter: require(___dirname + '/emitter'),
    asyncify: require(___dirname + '/asyncify'),
    loop: require(___dirname + '/loop'),
    chainify: require(___dirname + '/chainify')
  };

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
