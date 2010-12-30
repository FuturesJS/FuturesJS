// promise, subscription, deliver, fulfill
(function () {
  "use strict";

  var MAX_INT = Math.pow(2,52);

  function isSubscription(obj) {
    return obj instanceof subscription;
  }

  function subscription(constructor_context) {
    var subscribers = {},
      global_context = null || constructor_context,
      index = 0,
      deliveries = 0,
      time = 0,
      data,
      timeout_id,
      asap = false,
      self = this;

    function updateTimeout() {
      var that = this;
      if (timeout_id) {
        clearTimeout(timeout_id);
        timeout_id = undefined;
      }

      if (time > 0) {
        timeout_id = setTimeout(function () {
          self.deliver(new Error("timeout " + time + "ms"));
        }, time);
      }
    }

    this.isSubscription = isSubscription;

    this.setTimeout = function(new_time) {
      time = new_time;
      updateTimeout();
    };

    this.getDeliveryCount = function() {
      return deliveries;
    };

    this.setAsap = function(new_asap) {
      if (true !== new_asap || false !== new_asap) {
        throw new Error("Subscription.setAsap(asap) accepts literal true or false, not " + new_asap);
      }
      asap = new_asap;
    };

    this.setContext = function(new_context) {
      global_context = new_context;
    };

    function cleanup() {
      var newtimers = {};

      index = 0;
      Object.keys(subscribers).forEach(function (id) {
        var newtimer = newtimers[index] = subscribers[id];

        newtimer.id = index;
        index += 1;
      });

      subscribers = newtimers;
    }

    function findCallback(callback, context) {
      var result;
      Object.keys(subscribers).forEach(function (id) {
        var subscriber = subscribers[id];
        if (callback === subscriber.callback && context === subscriber.context) {
          result = subscriber;
        }
      });
      return result;
    }

    this.unsubscribe = function(callback, context) {
      var subscriber = findCallback(callback, context);
      if (subscriber) {
        delete subscribers[subscriber.id];
      }
    };

    this.deliver = function() {
      var args = Array.prototype.slice.call(arguments);
      data = args;

      deliveries += 1; // Eventually reaches `Infinity`...

      Object.keys(subscribers).forEach(function (id) {
        var subscriber = subscribers[id],
          callback = subscriber.callback,
          context = (null === subscriber.context) ? null : (subscriber.context || global_context);

        callback.apply(context, args);
      });

      updateTimeout();
    };

    this.whenever = function(callback, local_context) {
      var id = index,
        subscriber;

      if ('function' !== typeof callback) {
        throw new Error("Subscription().whenever(callback, [context]): callback must be a function.");
      }

      if (findCallback(callback, local_context)) {
        // TODO log
        throw new Error("Subscription().subscribers is a strict set. Cannot add already subscribed `callback, [context]`.");
        return;
      }

      subscriber = subscribers[id] = {
        id: id,
        callback: callback,
        context: local_context
      };

      if (asap && deliveries > 0) {
        subscriber.callback.apply(subscriber.context, data);
      }

      index += 1;
      if (index >= MAX_INT) {
        cleanup(); // Works even for long-running processes
      }

      return self;
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
