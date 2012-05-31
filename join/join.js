/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  var Future = require('future');

  function isJoin(obj) {
    return obj instanceof Join;
  }

  function Join(global_context) {
    var self = this
      , data = []
      , ready = []
      , subs = []
      , promise_only = false
      , begun = false
      , updated = 0
      , join_future = Future.create(global_context)
      ;

    global_context = global_context || null;

    if (!isJoin(this)) {
      return new Join(global_context);
    }

    function relay() {
      var i;
      if (!begun || updated !== data.length) {
        return;
      }
      updated = 0;
      join_future.deliver.apply(join_future, data);
      data = new Array(data.length);
      ready = new Array(ready.length);
      //for (i = 0; i < data.length; i += 1) {
      //  data[i] = undefined;
      //}
    }

    function init() {
      var type = (promise_only ? "when" : "whenever");

      begun = true;
      data = new Array(subs.length);
      ready = new Array(ready.length);

      subs.forEach(function (sub, id) {
        sub[type](function () {
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

    self.deliverer = function () {
      var future = Future.create();
      self.add(future);
      return future.deliver;
    };
    self.newCallback = self.deliverer;

    // fn, ctx
    self.when = function () {
      if (!begun) {
        init();
      }
      join_future.when.apply(join_future, arguments);
    };

    // fn, ctx
    self.whenever = function () {
      if (!begun) {
        init();
      }
      join_future.whenever.apply(join_future, arguments);
    };

    self.add = function () {
      if (begun) {
        throw new Error("`Join().add(Array<future> | subs1, [subs2, ...])` requires that all additions be completed before the first `when()` or `whenever()`");
      }
      var args = Array.prototype.slice.call(arguments);
      if (0 === args.length) {
        return self.newCallback();
      }
      args = Array.isArray(args[0]) ? args[0] : args;
      args.forEach(function (sub) {
        if (!sub.whenever) {
          promise_only = true;
        }
        if (!sub.when) {
          throw new Error("`Join().add(future)` requires either a promise or future");
        }
        subs.push(sub);
      });
    };
  }

  function createJoin(context) {
    // TODO use prototype instead of new
    return (new Join(context));
  }

  Join.create = createJoin;
  Join.isJoin = isJoin;
  module.exports = Join;
}());
