/*jslint debug: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
// G = (function () {return this;}());
"use strict";
// This snippet doesn't pass JSLint, but is necessary for CommonJS SSJS
var Futures = {};
try {
  // CommonJS
  Futures = exports;
} catch(ignore) {
  // Browsers
  Futures = window.Futures;
}
/*
// Node.js and Browsers include these. They're available in Rhino with env.js
var console = {},
  setTimeout = function () {},
  setInterval = function () {},
  clearTimeout = function () {},
  clearInterval = function () {};
*/
(function () {     
  // For my own shorthand of truth statments which doesn't pass JSLint
  var ignore_me;

  // logger utility
  function log(e) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof console !== 'undefined') {
      try { // Firefox
        ignore_me = console.log && console.log.apply(console.log, args);
      }
      catch (ignore) {
        try { // WebKit Quirk/BUG fix
          ignore_me = console.log && console.log.apply(console, args);
        }
        catch (ignore_again) {
          ignore_me = console.log && console.log(e);
        }
      }
    }
  }

  // error utility
  function error(e) {
    /* TODO if browser *** alert(e); *** */
    log(e);
    if (typeof console !== 'undefined') {
      debugger;
    }
    throw new FuturesException(e);
  }

  // Exception Class
  function FuturesException(msg) {
    this.name = "FuturesException";
    this.message = msg;
  }

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
   * Create a chainable promise
   */
  function make_promise(guarantee) {
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
        throw new FuturesException('The promise has already been resolved:' + status);
      }
      status = deed;
      outcome = value;
      (deed === 'fulfilled' ? waiting : dreading).forEach(function (func) {
        try {
          func.apply(func, outcome);
        } catch (e) {
          // TODO do we really want 3rd parties ruining it for everyone?
          if (!(e instanceof FuturesException)) {
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

  /**
   * Force a function to be asynchronous (and promisable, of course)
   */
  function asyncify(synchronous, timeout, context) {
    var p = make_promise();
    timeout = timeout || 1;
    context = context || synchronous;

    if (true === timeout) {
      timeout = Math.floor(Math.random()*1000+1);
    }

    promisable =  function() {
      setTimeout(function () {
        p.fulfill(synchronous.apply(context, arguments));
      }, timeout, arguments);
      return p.passable();
    };

    // TODO consider pre-promises
    /*
    promisable.when = function () {
      var args = Array.prototype.slice.call(arguments);
      p.when(args);
      return this;
    }
    promisable.fail = function () {
      var args = Array.prototype.slice.call(arguments);
      p.fail(args);
      return this;
    }
    */
    return promisable;
  }


  function promisify_subscription(s) {
    if (!s || !s.subscribe) {
      throw new FuturesException("Not a subscription");
    }
    if (s.when) {
      return s;
    }
    var p = make_promise(),
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
    };

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
        if ('undefined' === typeOf(a[key]) || 'null' === typeOf(a[key])) {
          // assume that it was on purpose as a placeholder
          continue;
        }

        // Case: we expected something
        if ('null' !== typeOf(d) && 'undefind' !== typeOf(d)) {
          // and got exactly what we expected
          if (typeOf(d) === typeOf(a[key])) {
            // then assume that this optional argument was not skipped
          } else {
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
  function join_promises(promises, params) {
    var p = make_promise(),
    num = 0,
    ps = [],
    success = true,
    last_arg,
    timeout,
    use_array;

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

    function notify_all(success) {
      if (use_array) {
        ignore_me = (success) ? p.fulfill.call(p.fulfill, ps) : p.smash.call(p.smash, ps);
      }
      else {
        ignore_me = (success) ? p.fulfill.apply(p.fulfill, ps) : p.smash.apply(p.smash, ps);
      }
    }

    function partial(data, i, status) {
      success = success && status;
      ps[i] = data;
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
        p = promisify_subscription(p);
      }
      // increase the array to the appropriate size
      ps.push('join_error_or_timeout');
      p.when(function (data) {
        partial(data, i, true);
      });
      p.fail(function (data) {
        partial(data, i, false);
      });
    });
    return p;
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
      p = make_promise(),
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
        throw new FuturesException("promisify directive must be an array not '" + typeOf(directive) +"'.");
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
   * Convert a function which a callback / errback to a promise
   *
   * func is function which accepts any number of arguments
   * params is a hash which describes which number argument
   *   maps to replacements for when and fail
   *
   *  func = function(arg1, arg2, callback, errback) { do_stuff() }
   * 
   *  params = {
   *    when : 2, // third argument
   *    fail : 3, // fourth argument
   *    timeout : 5000, // 5 seconds
   *    error : param // param to pass to fails
   *  };
   *
   */
  function promisify_old(func, params) {
    return function () {
      var args = Array.prototype.slice.call(arguments),
        //args = _.toArray(arguments).slice(0), // the underscore.js way
        p = make_promise(),
        timeout, retval, result;
      if ("custom" === params) { // TODO this was a dumb idea... remove it once I confirm that
        func = func(p.fulfill, p.smash); //func = func(p); // not as dumb
      }
      else if (params) { // If you provide a timeout, it will smash the promise
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
      token = -9999.9999;
      
    // Create a function that resubscribes the subcriber when called
    resubscriber = function (subscribers, token, callback) {
      return function () {
        subscribers[token] = callback;
        return unsubscriber(subscribers, token);
      };
    }

    // Create a function that unsubscribes the subcriber when called
    unsubscriber = function (subscribers, token) {
      return function () {
        var callback = subscribers[token];
        subscribers[token] = undefined;
        return resubscriber(subscribers, token, callback);
      };
    }

    // Always push the new subscriber onto the list
    // TODO deliver an issue immediately when enrolling
    function enroll(deed, callback) {
      var subscribers;
      token += 0.0001;
      subscribers = (deed === 'issued' ? waiting : dreading);
      if (subscribers[token]) {
        throw new FuturesException('Impossible Error: Duplicate token!');
      }
      return (resubscriber(subscribers, token, callback)());
      //subscribers[token] = callback;
      //return unsubscriber(subscribers, token);
    }

    // Push the issue to all subscribers
    function issue(deed, value) {
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
          if (!(e instanceof FuturesException)) {
            throw e;
          }
        }
      });
    }

    // Handle subscribing both callback and errback in one go - and providing the unsubscriber
    function subscribe(callback, errback) { // TODO create global-ish no-op
      var unsub = function () {},
        unmis = function () {};
      if (!callback && !errback) { // TODO should be leneint and just ignore? Nah... the user should check
        // that he has an actual function to pass in. Silent errors are bad.
        throw new FuturesException('Must subscribe with either callback or errback');
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
    }
    
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
          return subscription.miss(f);
        }
      };
    };
    return subscription;
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
    s = make_subscription();
      
    // Assume that it is promisable unless params say otherwise
    if ('function' !== typeof promisable.when) {
      if (undefined === params) {
        error("You tried to subscribify a non-promisable without parameters to tell how to promisifiy it.");
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
          throw new FuturesException('Not Implemented Yet');
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


/*
   * Synchronize subscriptions such that when all have updated the delivery fires.
   *
   * TODO should each failure trigger as it currently does?
   *  it may be easier for the user to watch each subscription
   *  for a failure individually.
   * TODO if the user doesn't use an array, still grab params
   */
  function join_subscriptions(subscriptions, params) {
    var s = make_subscription(),
      wait_for = 0,
      deliveries = [],
      ready = [],
      use_array = false;

    if (Array.isArray(subscriptions)) {
      use_array = true;
    }
    else {
      subscriptions = Array.prototype.slice.call(arguments);
    }
    wait_for = subscriptions.length;

    function partial(data, i, status) {
      deliveries[i] = data;
      if (false === status) {
        ignore_me = (use_array ? s.hold.call(s.hold, deliveries) : s.hold.apply(s.hold, deliveries));
        return;
      }
      if (undefined === ready[i]) {
        wait_for -= 1;
      }
      ready[i] = (new Date()).valueOf();
      if (0 === wait_for) {
        ready.forEach(function (item, i, arr) {
          ready[i] = undefined;
          wait_for = subscriptions.length;
        });
        ignore_me = (use_array ? s.deliver.call(s.hold, deliveries) : s.deliver.apply(s.hold, deliveries));
      }
    }
    // i substitutes as a unique token to identify
    // the subscription
    subscriptions.forEach(function (el, i, arr) { // increase the array to the appropriate size
      // for use in partial above
      deliveries.push(undefined);
      ready.push(undefined);
      el.subscribe(function (data) {
        partial(data, i, true);
      }); // Hmm... difficult to say how to
      // handle a failure case such as this
      el.miss(function (data) {
        partial(data, i, false);
      });
    });
    return s;
  }
  /**
   * Anonymous (event) triggers
   */

  function trigger(ignore) {
    var s = make_subscription();
    return {
      listen: function (func) {
        return s.subscribe(func); // returns `unsubscribe()`
      },
      fire: function (ignore) {
        s.deliver();
        return this;
      }
    };
  }

  /**
   * Do asynchronous things synchronously
   */
  function make_sequence(head) {
    var funcs = [undefined],
      lastResult, results = [],
      index = 0,
      next, update_result;

    next = function () {
      if (!funcs[index]) {
        return;
      }
      var p = make_promise(),
        f = funcs[index];
      funcs[index] = undefined;
      p.when(update_result);
      f(p.fulfill, lastResult, index - 1, results);
    };

    update_result = function (result) {
      lastResult = result;
      results.push(result);
      index += 1; // in case this is a synchronous call
      next();
    };

    function then(func) {
      funcs.push(func); // It's possible that a then is added after the others have all returned.
      // That's why we need to tick to see if this should run itself now.
      next();
      return {
        then: then
      };
    }

    function begin(head) {
      funcs[0] = head; // we ensure that this is async
      //setTimeout(next,0,['nada']);
      next();
      return {
        then: then
      };
    }
    begin.then = then;
    return head ? begin(head) : begin;
  }

  /**
   * Async Method Queing
   */
  function chainify(providers, consumers, context, params) {
    var Model = {},
    key;

    /**
     * Create a method from a consumer
     * These may be promisable (validate e-mail addresses by sending an e-mail)
     * or return synchronously (selecting a random number of friends from contacts)
     */
    function methodify(provider, sequence) {
      var methods = {},
      key;
      
      function chainify_one(key) {
        var consumer = consumers[key];
        return function () {
          var args = Array.prototype.slice.call(arguments);
          // TODO then(function(lastResult, args, params) {});
          sequence.then(function(fulfill, lastResult, index, resultArray) {
            var result;
            args.unshift(lastResult);
            result = consumer.apply(context || provider, args);
            if ('undefined' !== typeOf(result)) {
              if (result.when) {
                result.when(fulfill);
              } else {
                fulfill(result);
              }
            } else {
              // is this a convenience or a hangman's noose?
              fulfill(lastResult);
              // better to do this instead?
              // throw new FuturesException('"' + key + '" does not return a result. All consumers must return a result');
            }
          });
          return methods;
        }
      }

      for (key in consumers) {
        if (consumers.hasOwnProperty(key)) {
          methods[key] = chainify_one(key);
        }
      }
      //alert('methods:'+Object.keys(methods));
      return methods;
    }

    // TODO sequence should allow `return promisable` as well as `this.fulfill`
    // TODO sequence should accept function or promise
    /**
     * A model might be something such as Contacts
     * The providers might be methods such as:
     * all(), one(id), some(ids), search(key, params), search(func), scrape(template)
     */
    function modelify(key) {
      return function () {
        var args = Array.prototype.slice.call(arguments),
        result = providers[key].apply(context || providers[key], args),
        sequence = Futures.sequence();
        if ('function' !== typeOf(result.when)) {
          throw new FuturesException('"anywhere" provider "' + key + '" isn\'t promisable');
        }
        sequence(function (fulfill) {
          result.when(fulfill);
        });
        return methodify(providers[key], sequence);
      }
    }

    for (key in providers) {
      if (providers.hasOwnProperty(key)) {
        Model[key] = modelify(key);
      }
    }
    return Model;
  }

  /**
   * An asynchronous while loop
   */
  // TODO don't iterate again until
  // breakIf has been called;
  function whilst(func, options) {
    options = options || {};
    var interval, 
    timeout, 
    interval_ms = 1,
    timeout_ms, 
    num_loops = 0,
    max_loops, // Infinity
    lastResult, 
    ready_for_next_loop = true,
    p = make_promise();

    if ('undefined' !== typeof options.timeout) {
      timeout_ms = options.timeout;
    }
    if ('undefined' !== typeof options.interval) {
      interval_ms = options.interval;
    }
    if ('undefined' !== typeof options.maxLoops) {
      max_loops = options.maxLoops;
    }

    function BreakWhilst(msg) {
      this.name = "BreakWhilst";
      this.message = msg;
    }

    function stop() {
      clearTimeout(timeout);
      clearInterval(interval);
    }

    /**
     * loop watchdog and resolver
     *
     * Since a loop may contain asynchronous code,
     * this must be called once each loop
     */
    function break_if(result, let_finish) { // loose falsy values rather than strict !== false
      //alert('break called');
      ready_for_next_loop = true;
      // because this is how while behaves and the users
      // have the freedom to be stupid if they want to
      if (result) {
        stop();
        p.fulfill(lastResult);
        if (!let_finish) {
          // TODO rename BreakException?
          throw new BreakWhilst("This is caught by the parent - cool trick, huh?");
        }
      } else {
        ready_for_next_loop = true;
      }
    }
    interval = setInterval(function () {
      var new_result;
      if (ready_for_next_loop) {
        ready_for_next_loop = false;
      } else {
        return;
      }
      try {
        // lastResult should be an array
        // TODO crockfords typeOf()
        new_result = func.call({
          breakIf: break_if,
          until: break_if,
          whilst: function (result, let_finish) {
            break_if(!result, let_finish);
          }
        }, lastResult);
        lastResult = new_result;
        num_loops += 1;
        if (undefined !== max_loops && num_loops >= max_loops) {
          stop();
        }
      }
      catch (e) {
        if (!(e instanceof BreakWhilst)) {
          throw e;
        }
        stop();
      }
    }, interval_ms);
    if ('undefined' !== typeof timeout_ms) {
      // TODO throw if not number between 0 and infinity inclusive
      timeout = setTimeout(function () {
        clearInterval(interval);
      }, timeout_ms);
    }
    return {
      // I suppose I should pick just one... not sure which
      stop: stop,
      done: stop,
      finish: stop,
      cancel: stop,
      end: stop,
      breakNow: stop,
      breaketh: stop,
      // TODO: these return just lastResult. Is returning the full array feasible? desirable?
      // should it be dropped elsewhere?
      then: make_sequence(function (fulfill) {
        p.when(fulfill);

        return this;
      }).then,
      when: function (func) {
        p.when(func);
        return this;
      }
    };
  }
  
  /**
   * Public Promise and Subscription Methods
   */
  var publics = {
    promise: make_promise,
    promisify: promisify,
    subscription: make_subscription,
    subscribify: subscribify,
    subscription2promise: promisify_subscription,
    join: join_promises,
    synchronize: join_subscriptions,
    trigger: trigger,
    sequence: make_sequence,
    whilst: whilst,
    loop: whilst,
    asyncify: asyncify,
    chainify: chainify,
    futurify: chainify,
    sleep: function() { error('Not Implemented Yet'); },
    wait: function() { error('Not Implemented Yet'); },
    watchdog: function() { error('Not Implemented Yet'); },
    log: log,
    error: error
  };
  Object.keys(publics).forEach(function (key) {
    Futures[key] = publics[key];
  });
}());
