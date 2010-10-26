/*jslint browser: true, debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  require = {},
  module = {},
  provide = {},
*/
"use strict";
(function (undefined) {
  var Futures = require('futures/private');

  Futures.extend(Futures, require('futures/promise'));

  /**
   * Make Subscription
   * This varies from a promise in that it can be 'fulfilled' multiple times
   * 
   */
  function make_subscription(params) {
    var status = 'unresolved',
      outcome, waiting = {},
      dreading = {},
      subscription,
      resubscriber,
      unsubscriber,
      enroll,
      issue,
      subscribe,
      token = -9999.9999;

    // Create a function that resubscribes the subcriber when called
    resubscriber = function (subscribers, token, callback) {
      return function () {
        subscribers[token] = callback;
        return unsubscriber(subscribers, token);
      };
    };

    // Create a function that unsubscribes the subcriber when called
    unsubscriber = function (subscribers, token) {
      return function () {
        var callback = subscribers[token];
        subscribers[token] = undefined;
        return resubscriber(subscribers, token, callback);
      };
    };

    // Always push the new subscriber onto the list
    // TODO deliver an issue immediately when enrolling
    enroll = function (deed, callback) {
      var subscribers;
      token += 0.0001;
      subscribers = (deed === 'issued' ? waiting : dreading);
      if (subscribers[token]) {
        throw new Futures.exception('Impossible Error: Duplicate token!');
      }
      return (resubscriber(subscribers, token, callback)());
      //subscribers[token] = callback;
      //return unsubscriber(subscribers, token);
    };

    // Push the issue to all subscribers
    issue = function (deed, value) {
      var subscribers;
      status = deed;
      outcome = value;
      subscribers = (deed === 'issued' ? waiting : dreading);
      Object.keys(subscribers).forEach(function (key) {
        try {
          subscribers[key].apply(subscribers[key], outcome);
        }
        catch (e) {
          // TODO Do we really want 3rd parties ruining the game for everyone?
          if (!(e instanceof Futures.exception)) {
            throw e;
          }
        }
      });
    };

    // Handle subscribing both callback and errback in one go - and providing the unsubscriber
    subscribe = function (callback, errback) { // TODO create global-ish no-op
      var unsub = function () {},
        unmis = function () {};
      if (!callback && !errback) { // TODO should be leneint and just ignore? Nah... the user should check
        // that he has an actual function to pass in. Silent errors are bad.
        throw new Futures.exception('Must subscribe with either callback or errback');
      }
      if (callback) {
        unsub = enroll('issued', callback);
      }
      if (errback) {
        unmis = enroll('withheld', errback);
      }
      // The case of both
      if (callback && errback) {
        return {
          unsubscribe: function (onSuccess, onError) {
            if ('undefined' === typeof onSuccess || true === onSuccess) {
              unsub();
            }
            if ('undefined' === typeof onError || true === onError) {
              unmis();
            }
          },
          unmisscribe: unmis
        };
      }
      // The case of either one
      return callback ? unsub : unmis;
    };

    subscription = {
      subscribe: subscribe,
      miss: function (errback) {
        return subscribe(undefined, errback);
      },
      deliver: function () {
        var args = Array.prototype.slice.call(arguments);

        issue('issued', args);
      },
      hold: function () {
        var args = Array.prototype.slice.call(arguments);

        Futures.log("`hold` is deprecated, please use `deliver(err, data)` instead");
        issue('withheld', args);
      },
      status: function () {
        return status;
      }
    }; // passable strips the more private methods
    subscription.passable = function () {
      return {
        subscribe: function (f) {
          return subscription.subscribe(f);
        },
        miss: function (f) {
          Futures.log("`miss` is deprecated, please use `subscribe(err, data)` instead");
          return subscription.miss(f);
        }
      };
    };
    return subscription;
  }

  /*
   * Synchronize subscriptions such that when all have updated the delivery fires.
   *
   * TODO should each failure trigger as it currently does?
   *  it may be easier for the user to watch each subscription
   *  for a failure individually.
   * TODO if the user doesn't use an array, still grab params
   */
  function synchronize(subscriptions, params) {
    var s = make_subscription(),
      wait_for = 0,
      deliveries = [],
      ready = [],
      last_arg,
      use_array = false;

    if (Array.isArray(subscriptions)) { // [subs1, subs2, subs3, ...]
      use_array = true;
    } else { // or the user may pass in arguments
      subscriptions = Array.prototype.slice.call(arguments); // subs1, subs2, subs3, ...
      last_arg = subscriptions.pop();
      if (subscriptions.length && !last_arg.when && !last_arg.subscribe) {
        params = last_arg;
      } else {
        subscriptions.push(last_arg);
      }
    }
    wait_for = subscriptions.length;

    function partial(args, i, status) {
      deliveries[i] = args;
      if (false === status) {
        if (use_array) {
          s.hold.call(null, deliveries);
        } else {
          s.hold.apply(null, deliveries);
        }
        return;
      }
      if (undefined === ready[i]) {
        wait_for -= 1;
      }      ready[i] = (new Date()).valueOf();
      if (0 === wait_for) {
        ready.forEach(function (item, i, arr) {
          ready[i] = undefined;
          wait_for = subscriptions.length;
        });
        if (use_array) {
          s.deliver.call(null, deliveries);
        } else {
          s.deliver.apply(null, deliveries);
        }
      }
    }
    // i substitutes as a unique token to identify
    // the subscription
    subscriptions.forEach(function (el, i, arr) { // increase the array to the appropriate size
      // for use in partial above
      deliveries.push([undefined]);
      ready.push(undefined);
      el.subscribe(function (data) {
        partial(Array.prototype.slice.call(arguments), i, true);
      }); // Hmm... difficult to say how to
      // handle a failure case such as this
      el.miss(function () {
        partial(Array.prototype.slice.call(arguments), i, false);
      });
    });
    return s;
  }


  module.exports = {
    subscription: make_subscription,
    synchronize: synchronize
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/subscription');
}());
