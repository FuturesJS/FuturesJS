// promise, subscription, deliver, fulfill
(function () {
  "use strict";

  var MAX_INT = Math.pow(2,52);

  function isSubscription(obj) {
    return obj instanceof subscription;
  }

  function subscriptionTimeout(time) {
    this.name = "SubscriptionTimeout";
    this.message = "timeout " + time + "ms";
  }



  function subscription(global_context) {
    var everytimers = {},
      onetimers = {},
      index = 0,
      deliveries = 0,
      time = 0,
      fulfilled,
      data,
      timeout_id,
      //asap = false,
      asap =  true,
      passenger,
      self = this;

    // TODO change `null` to `this`
    global_context = ('undefined' === typeof global_context ? null : global_context);


    function resetTimeout() {
      if (timeout_id) {
        clearTimeout(timeout_id);
        timeout_id = undefined;
      }

      if (time > 0) {
        timeout_id = setTimeout(function () {
          self.deliver(new subscriptionTimeout(time));
          timeout_id = undefined;
        }, time);
      }
    }



    self.isSubscription = isSubscription;

    self.setContext = function (context) {
      global_context = context;
    }

    self.setTimeout = function (new_time) {
      time = new_time;
      resetTimeout();
    };



    self.callbackCount = function() {
      return Object.keys(everytimers).length;
    };



    self.deliveryCount = function() {
      return deliveries;
    };



    self.setAsap = function(new_asap) {
      if (true !== new_asap && false !== new_asap) {
        throw new Error("Subscription.setAsap(asap) accepts literal true or false, not " + new_asap);
      }
      asap = new_asap;
    };



    // this will probably never get called and, hence, is not yet well tested
    function cleanup() {
      var new_everytimers = {},
        new_onetimers = {};

      index = 0;
      Object.keys(everytimers).forEach(function (id) {
        var newtimer = new_everytimers[index] = everytimers[id];

        if (onetimers[id]) {
          new_onetimers[index] = true;
        }

        newtimer.id = index;
        index += 1;
      });

      onetimers = new_onetimers;
      everytimers = new_everytimers;
    }



    function findCallback(callback, context) {
      var result;
      Object.keys(everytimers).forEach(function (id) {
        var everytimer = everytimers[id];
        if (callback === everytimer.callback) {
          if (context === everytimer.context || everytimer.context === global_context) {
            result = everytimer;
          }
        }
      });
      return result;
    }



    self.hasCallback = function () {
      return !!findCallback.apply(null, arguments);
    }



    self.removeCallback = function(callback, context) {
      var everytimer = findCallback(callback, context);
      if (everytimer) {
        delete everytimers[everytimer.id];
        onetimers[everytimer.id] = undefined;
        delete onetimers[everytimer.id];
      }

      return self;
    };



    self.deliver = function() {
      if (fulfilled) {
        throw new Error("`Subscription().fulfill(err, data, ...)` renders future deliveries useless");
      }
      var args = Array.prototype.slice.call(arguments);
      data = args;

      deliveries += 1; // Eventually reaches `Infinity`...

      Object.keys(everytimers).forEach(function (id) {
        var everytimer = everytimers[id],
          callback = everytimer.callback,
          context = everytimer.context;

        if (onetimers[id]) {
          delete everytimers[id];
          delete onetimers[id];
        }

        callback.apply(context, args);
      });

      if (args[0] && "SubscriptionTimeout" !== args[0].name) {
        resetTimeout();
      }

      return self;
    };



    self.fulfill = function () {
      fulfilled = true;
      self.deliver.apply(self, arguments);
    };



    self.whenever = function (callback, local_context) {
      var id = index,
        everytimer;

      if ('function' !== typeof callback) {
        throw new Error("Subscription().whenever(callback, [context]): callback must be a function.");
      }

      if (findCallback(callback, local_context)) {
        // TODO log
        throw new Error("Subscription().everytimers is a strict set. Cannot add already subscribed `callback, [context]`.");
        return;
      }

      everytimer = everytimers[id] = {
        id: id,
        callback: callback,
        context: (null === local_context) ? null : (local_context || global_context)
      };

      if (asap && deliveries > 0) {
        // doesn't raise deliver count on purpose
        everytimer.callback.apply(everytimer.context, data);
        if (onetimers[id]) {
          delete onetimers[id];
          delete everytimers[id];
        }
      }

      index += 1;
      if (index >= MAX_INT) {
        cleanup(); // Works even for long-running processes
      }

      return self;
    };



    self.when = function (callback, local_context) {
      // this index will be the id of the everytimer
      onetimers[index] = true;
      self.whenever(callback, local_context);

      return self;
    };

    
    // 
    function privatize(obj, pubs) {
      var result = {};
      pubs.forEach(function (pub) {
        result[pub] = function () {
          obj[pub].apply(obj, arguments);
          return result;
        };
      });
      return result;
    }

    passenger = privatize(self, [
      "when",
      "whenever"
    ]);

    self.passable = function () {
      return passenger;
    };

  }

  function Subscription(context) {
    // TODO use prototype instead of new
    return (new subscription(context));
  }
  Subscription.isSubscription = isSubscription;
  module.exports = Subscription;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/subscription');
}());
