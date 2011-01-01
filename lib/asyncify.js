(function () {
  "use strict";

  if ('undefined' === typeof __dirname) {
    __dirname = '';
  }

  var Subscription = require((__dirname ? __dirname + '/../lib' : 'futures') + '/subscription');

  function asyncify(doStuffSync, context) {
    var future = Subscription(),
      passenger = future.passable();

    future.setAsap(false);

    function doStuff() {
      var self = ('undefined' !== typeof context ? context : this),
        err,
        data;

      future.setContext(self);

      try {
        data = doStuffSync.apply(self, arguments);
      } catch(e) {
        err = e;
      }

      future.deliver(err, data);

      return passenger;
    }

    console.log(passenger.when, passenger.whenever);
    doStuff.when = passenger.when;
    doStuff.whenever = passenger.whenever;

    return doStuff;
  }

  module.exports = asyncify;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/asyncify');
}());
