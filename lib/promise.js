(function () {
  "use strict";

  if ('undefined' === typeof __dirname) {
    __dirname = '';
  }

  var Future = require((__dirname ? __dirname + '/../lib' : 'futures') + '/future');

  function isPromise(obj) {
    return obj instanceof promise;
  }

  function promise(constructor_context) {
    var self = this,
      future = Future(constructor_context || null),
      status;

    future.setAsap(true);

    self.isPromise = isPromise;

    self.fulfill = function () {
      if (status) {
        throw new Error("`Promise().fulfill()` may only be used once per promise. This promise is already `fulfill`ed as '" + status + "'");
      }
      status = "fulfilled";
      future.deliver.apply(future, arguments);

      return self;
    };

    self.getStatus = function () {
      return status;
    };

    self.setTimeout = function (time) {
      future.setTimeout(time);

      return self;
    };

    self.when = function (callback, local_context) {
      future.whenever(function () {
        var bound_context = this;
        if (arguments[0] && "FutureTimeout" === arguments[0].name) {
          status = "timeout";
          future.setTimeout(0);
        }
        callback.apply(bound_context, arguments);
      }, local_context);

      return self;
    };
  }

  function Promise(context) {
    // TODO use prototype instead of new
    return (new promise(context));
  }
  Promise.isPromise = isPromise;
  module.exports = Promise;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/promise');
}());
