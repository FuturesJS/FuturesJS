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
  Futures.extend(Futures, require('futures/subscription'));

  // Crockford's typeOf
  function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
      if (value) {
        if (typeof value.length === 'number' &&
          !(value.propertyIsEnumerable('length')) &&
          typeof value.splice === 'function') {
          s = 'array';
        }
      } else {
        s = 'null';
      }
    }
    return s;
  }

  /**
   * Arguments Interceptor Stolen from CopyCatJS
   *
   * arguceptor is still pretty lame, but better than what there was
   * The idea is to have a directive-based approach to determine
   * how to intercept an arguments array
   */
  function arguceptor(args, directive, hash) {
  //function arguceptor(args, types, interests, hash) {
    //args = Array.prototype.slice.call(arguments),
    var i = 0,
    ii = Math.max(args.length, directive.length),
    d,
    swap,
    a;

    function isEmpty(obj) {
      var key;
      if ('array' === typeOf(obj) || 'string' === typeOf(obj)) {
        return obj.length === 0;
      }
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    }

    function get_or_swap(key) {
      Futures.log("key:" + key);
      swap = a[key];
      if ('null' !== typeOf(hash[key])) {
        a[key] = hash[d[key]];
      }
      hash[d[key]] = swap;
    }

    for(i = 0; i < ii; i += 1) {
      Futures.log('argument[' + i + '] of ' + args.length);
      d = directive[i];
      a = args[i];

      // For non-optional arguments, assume that
      // the argument is what it's supposed to be
      if (true === d) {
        Futures.log('directive is true');
        continue;
      }

      /**
       *  For optional directives, use type detection
       *
       * 0 for int
       * '' for string
       * [] for array
       * {} for object
       * function(){} for function
       * false for boolean
       *
       * undefined will discount the object if the length of parameters and directives mismatch by 1 or more
       * null will discount the object if the length of the parameters and directives differs by more than 1
       */
      if (isEmpty(d)) {
        Futures.log("directive is type detectable");
        // Case: the user explicitly passed in null or undefined
        // if ('undefined' === typeOf(a[key]) || 'null' === typeOf(a[key])) {
        // XXX fix issue with undefined (was 'key')
        if ('undefined' === typeOf(a[undefined]) || 'null' === typeOf(a[undefined])) {
          // assume that it was on purpose as a placeholder
          continue;
        }

        // Case: we expected something
        if ('null' !== typeOf(d) && 'undefind' !== typeOf(d)) {
          // and got exactly what we expected
          // XXX fix issue with undefined (was 'key')
          if (typeOf(d) !== typeOf(a[undefined])) {
            // then assume that this optional argument was skipped
            Futures.log("type mismatch, skipping");
            // we didn't get what we expected
            // assume this optional argument was skipped
            // regardless of the number of arguments passed in
            Futures.log('shifting...');
            directive.shift();
            i -= 1;
          }
        } else {
        // Case: we didn't expect anything in particular
          // and the number of arguments are off
          if (args.length < directive.length && 0 < directive.length) {
            Futures.log("type null and args differ, skipping");
            // assume this optional argument was skipped
            directive.shift();
            i -= 1;
          }
          // or assume it's still okay
        }
        Futures.log("directive is was detected");
        continue;
      }

      // if we have a name for the sorry sap
      // then grab or swap it from the hash
      if ('string' === typeOf(d)) {
        Futures.log('directive is an string');
        swap = a;
        if ('null' !== typeOf(hash[d])) {
          args[i] = hash[d];
        }
        hash[d] = swap;
        continue;
      }

      // If the directive is an object
      // get or swap each key
      if ('object' === typeOf(d)) {
        Futures.log('directive is an object');
        // but if the arg isn't an object, assume it to be optional
        if ('object' !== typeOf(a) && 0 < directive.length) {
          directive.shift();
          i -= 1;
          continue;
        }
        Object.keys(d).forEach(get_or_swap);
        continue;
      }
      Futures.log("directive didn't match any case - shouldn't be possible");
    }
    return hash;
  }

  

  /**
   * Convert a function which a callback / errback to a promise
   *
   * func is function which accepts any number of arguments
   * params is a hash which describes which number argument
   *   maps to replacements for when and fail
   *
   *  func = function(required_arg, optional_arg, callback, { onError: function() {}, timeout: 0 } ) { do_stuff() }
   * 
   *  var directive = [
   *    true,
   *    undefined,
   *    'callback',
   *    { 
   *      onError: 'errback',
   *      timeout: 'timeout'
   *    }
   *  ];
   *
   */
  function promisify(func, directive, params) {
    params = params || {};
    return function () {
      var args = Array.prototype.slice.call(arguments),
      p = Futures.promise(),
      timeout,
      retval,
      result,
      hash = {
        callback: p.fulfill,
        errback: p.smash,
        // TODO what if the timeout is already defined?
        // that should take preference
        // If you provide a timeout, it will smash the promise
        timeout: params.timeout
      };

      if ("custom" === directive) {
        func = func(p.fulfill, p.smash);
        //throw new FuturesException("Having 'custom' promises was a dumb idea and has been removed");
      } else if ('array' === typeOf(directive)) { 
        hash = arguceptor(args, directive, hash);
        if (hash.callback) {
          p.when(hash.callback);
        }
        if (hash.errback) {
          p.fail(hash.errback);
        }
        if ('undefined' !== typeof hash.timeout) {
          timeout = setTimeout(function () {
            p.smash(params.error || "Timed Out");
          }, hash.timeout);
          p.when(function () {
            clearTimeout(timeout);
          });
        }
      } else if ('object' === typeOf(directive)) {
        // backwards compat
        directive = params;
        if (undefined !== params.timeout) {
          timeout = setTimeout(function () {
            p.smash(params.error || "Timed Out");
          }, params.timeout);
        }
        // If the function has an errback, replace it with smash
        if (undefined !== params.fail) {
          if (args[params.fail]) {
            p.fail(args[params.fail]);
          }
          args[params.fail] = p.smash;
        }
        // If the function has a callback, replace it with when
        if (undefined !== params.when) {
          if (args[params.when]) {
            p.when(args[params.when]);
          }
          args[params.when] = p.fulfill;
          if (undefined !== params.timeout) {
            p.when(function () {
              clearTimeout(timeout);
            });
          }
        }
      } else {
        throw new Futures.exception("promisify directive must be an array not '" + typeOf(directive) +"'.");
      }
      retval = func.apply(func, args);

      result = p.passable();
      result.withResult = function (func) {
        return func(retval);
      };
      return result;
    };
  }

  /**
   * Wraps a promisable function such that each time it fires
   * 'fulfill', '.when'ers get it once and '.subscribe'rs get it each time 
   */
  function subscribify(promisable, params) {
    // TODO Four possible modes
    //    Order doesn't matter and fire all
    //    Order doesn't matter and wait for failure / timeout before firing again
    //    Order matters and drop stale
    //    Order matters and wait
    var live_promise, 
    no_conflict = false,
    noConflict, 
    s = Futures.subscription();
      
    // Assume that it is promisable unless params say otherwise
    if ('function' !== typeof promisable.when) {
      if (undefined === params) {
        Futures.error("You tried to subscribify a non-promisable without parameters to tell how to promisifiy it.");
      }
      promisable = promisify(promisable, params);
    }

    function subscribable() {
      var args = Array.prototype.slice.call(arguments),
        p, original_result, result; // TODO "this" needs to be the same as the original
      // maybe add it as a property?
      live_promise = promisable.apply(promisable, args);
      p = live_promise;
      p.withResult(function (r) {
        original_result = r;
      });
      p.when(s.deliver);
      p.fail(s.hold);
      result = {
        when: function (callback) {
          p.when(callback);
          return this;
        },
        fail: function (errback) {
          p.fail(errback);
          return this;
        },
        cancel: function () {
          throw new Futures.exception('Not Implemented Yet');
        }
      };
      return (no_conflict ? original_result : result);
    }

    // Passes back a promise that changes each
    // time the subscribable is called
    noConflict = function (pass_me_the_no_conflict_subscription) {
      no_conflict = true;
      pass_me_the_no_conflict_subscription({
        subscribe: s.subscribe,
        miss: s.miss,
        when: function (func) {
          live_promise.when(func);

          return this;
        },
        fail: function (func) {
          live_promise.fail(func);

          return this;
        },
        reConflict: function () {
          no_conflict = false;
        }
      });
      return subscribable;
    }; // Each time this function is called it uses the same
    // a new promise with the same subscription


    subscribable.subscribe = s.subscribe;
    subscribable.miss = s.miss;
    subscribable.noConflict = noConflict;
    return subscribable;
  }

  module.exports = {
    promisify: promisify,
    subscribify: subscribify
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/deprecated');
}());
