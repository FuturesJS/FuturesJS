/*jslint browser: true, debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  require = {},
  module = {},
  provide = {},
*/
"use strict";
(function (undefined) {
  var Futures = require('futures/private');
  /**
   * Create a chainable promise
   */
  function promise(guarantee) {
    var status = 'unresolved',
      outcome, waiting = [],
      dreading = [],
      passable, result;

    function vouch(deed, callback) {
      switch (status) {
      case 'unresolved':
        (deed === 'fulfilled' ? waiting : dreading).push(callback);
        break;
      case deed:
        callback.apply(callback, outcome);
        break;
      }
    }

    function resolve(deed, value) {
      if (status !== 'unresolved') {
        throw new Futures.exception('The promise has already been resolved:' + status);
      }
      status = deed;
      outcome = value;
      (deed === 'fulfilled' ? waiting : dreading).forEach(function (func) {
        try {
          func.apply(func, outcome);
        } catch (e) {
          // TODO do we really want 3rd parties ruining it for everyone?
          if (!(e instanceof Futures.exception)) {
            throw e;
          }
        }
      });
      waiting = null;
      dreading = null;
    }
    passable = {
      when: function (f) {
        result.when(f);

        return this;
      },
      fail: function (f) {
        result.fail(f);
        return this;
      }
    };
    result = {
      when: function (func) {
        vouch('fulfilled', func);

        return this;
      },
      fail: function (func) {
        vouch('smashed', func);

        Futures.log("'fail' is deprecated, please use `when(err, data)` instead");
        return this;
      },
      fulfill: function () {
        var args = Array.prototype.slice.call(arguments);
        resolve('fulfilled', args);

        return passable;
      },
      smash: function () {
        var args = Array.prototype.slice.call(arguments);
        resolve('smashed', args);

        Futures.log("'smash' is deprecated, please use `fulfill(err, data)` instead");
        return passable;
      },
      status: function () {
        return status;
      },
      passable: function () {
        return passable;
      }
    };
    if (undefined !== guarantee) {
      return result.fulfill(guarantee);
    }
    return result;
  }

  function subscription2promise(s) {
    if (!s || !s.subscribe) {
      throw new Futures.exception("Not a subscription");
    }
    if (s.when) {
      return s;
    }
    var p = promise(),
      unsubscribe, unmisscribe;

    unsubscribe = s.subscribe(p.fulfill);
    unmisscribe = s.miss(p.smash);
    p.when(function () {
      unsubscribe();
      unmisscribe();
    });
    p.fail(function () {
      unsubscribe();
      unmisscribe();
    });
    return p; // check unmisscribe because I'm not sure it's there at all
    // increase the array to the appropriate size
  }

  /**
   * Join any number of promises and return the results in the order they were passed in.
   *
   * p_all = join_promises([p1, p2, p3], params);
   * // or
   * // p_all = join_promises(p1, p2, p3, ..., params);
   * p_all.when(function(d_arr){
   *   var d1 = d_arr[0],
   *     d2 = d_arr[1],
   *     d3 = d_arr[2];
   * });
   *
   * TODO add options, such as timeout 
   * TODO notify the user which promise failed when smashed?
   *
   * @param promises - an Array of Promises
   * @param params - an Object hash
   * @param args - any number of Promises, and perhaps an object hash
   * @return A promise which is fulfilled only if and when all other parameter promises are fulfilled.
   */
  function pjoin(promises, params) {
    var p = promise(),
    num = 0,
    ps = [],
    success = true,
    last_arg,
    timeout,
    use_array,
    notify_all;

    notify_all = function(success) {
      var cb = (success) ? p.fulfill : p.smash;
      if (use_array) {
        cb.call(null, ps);
      } else {
        cb.apply(null, ps);
      }
    };

    if (Array.isArray(promises)) {
      use_array = true;
    } else { // or the user may pass in arguments
      promises = Array.prototype.slice.call(arguments); // TODO what if the last argument is params? 
      last_arg = promises.pop();
      if (promises.length && !last_arg.when && !last_arg.subscribe) {
        params = last_arg;
      } else {
        promises.push(last_arg);
      }
    }
    params = params || {};
    num = promises.length;

    if (0 <= params.timeout) {
      timeout = setTimeout(notify_all, params.timeout, false);
    }

    function partial(args, i, status) {
      success = success && status;
      ps[i] = args;
      num -= 1;
      // only execute this when all have return, or timed out
      if (0 === num) {
        clearTimeout(timeout);
        notify_all(success);
      }
    }
    promises.forEach(function (p, i, arr) { // handle subscriptions
      if (p && p.subscribe && !p.when) { // Do I even need to pass this back?
        // How mutable are objects?
        p = subscription2promise(p);
      }
      // increase the array to the appropriate size
      ps.push(['join_error_or_timeout']);
      p.when(function () {
        partial(Array.prototype.slice.call(arguments), i, true);
      });
      p.fail(function () {
        partial(Array.prototype.slice.call(arguments), i, false);
      });
    });
    return p;
  }

  module.exports = {
    promise: promise,
    join: pjoin,
    subscription2promise: subscription2promise
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/promise');
}());
