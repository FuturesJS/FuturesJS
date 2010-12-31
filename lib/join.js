(function () {
  "use strict";

  if ('undefined' === typeof __dirname) {
    __dirname = '';
  }

  var Subscription = require((__dirname ? __dirname + '/../lib' : 'futures') + '/subscription');

  function isJoin(obj) {
    return obj instanceof subscription;
  }

  function join(global_context) {
    var self = this,
      data = [],
      ready = [],
      subs = [],
      promise_only = false,
      begun = false,
      updated = 0,
      join_subscription = Subscription(global_context);
    
    global_context = global_context || null;

    function relay() {
      var i;
      if (!begun || updated !== data.length) {
        return;
      }
      updated = 0;
      join_subscription.deliver.apply(join_subscription, data);
      data = Array(data.length);
      ready = Array(ready.length);
      //for (i = 0; i < data.length; i += 1) {
      //  data[i] = undefined;
      //}
    }

    function init() {
      var type = (promise_only ? "when" : "whenever");

      begun = true;
      data = Array(subs.length);
      ready = Array(subs.length);

      subs.forEach(function (sub, id) {
        sub.whenever(function () {
          var args = Array.prototype.slice.call(arguments);
          data[id] = args;
          if (!ready[id]) {
            ready[id] = true;
            updated += 1;
          }
          relay();
        });
      });
    }

    self.when = function () {
      if (!begun) {
        init();
      }
      join_subscription.when.apply(join_subscription, arguments);
    };

    self.whenever = function () {
      if (!begun) {
        init();
      }
      join_subscription.whenever.apply(join_subscription, arguments);
    };

    self.add = function () {
      if (begun) {
        throw new Error("`Join().add(Array<subscription> | subs1, [subs2, ...])` requires that all additions be completed before the first `when()` or `whenever()`");
      }
      var args = Array.prototype.slice.call(arguments);
      args = Array.isArray(args[0]) ? args[0] : args;
      args.forEach(function (sub) {
        if (!sub.whenever) {
          promise_only = true;
        }
        if (!sub.when) {
          throw new Error("`Join().add(subscription)` requires either a promise or subscription");
        }
        subs.push(sub);
      });
    };
  }

  function Join(context) {
    // TODO use prototype instead of new
    return (new join(context));
  }
  Join.isJoin = isJoin;
  module.exports = Join;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/join');
}());
