/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
var provide = provide || function () {},
   __dirname = __dirname || '';

(function () {
  "use strict";

  var modulepath;

  if (!__dirname) {
    modulepath = 'futures';
  } else {
    modulepath = __dirname;
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
    future: require(modulepath + '/future'),
    forEachAsync: require(modulepath + '/forEachAsync-standalone'),
    sequence: require(modulepath + '/sequence'),
    join: require(modulepath + '/join'),
    asyncify: require(modulepath + '/asyncify'),
    loop: require(modulepath + '/loop'),
    chainify: require(modulepath + '/chainify')
  };

  provide('futures');
}());
