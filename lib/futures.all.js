/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  var window = {}, exports = {}, module = {}, global = {};
*/
// Implementation of require(), modules, exports, and provide to the browser
"use strict";
(function () {
    if ('undefined' !== typeof window && 'undefined' !== typeof alert) {
      (function () {
        var global = window;
        function resetModule() {
          global.module = {};
          global.exports = {};
          global.module.exports = exports;
        }
        global._PLUGIN_EXPORTS = global._PLUGIN_EXPORTS || {};
        global.require = function (name) {
          var plugin = global._PLUGIN_EXPORTS[name] || global[name],
            msg = "One of the included scripts requires '" + 
              name + "', which is not loaded. " +
              "\nTry including '<script src=\"" + name + ".js\"></script>'.\n";
          if ('undefined' === typeof plugin) {
            alert(msg);
            throw new Error(msg);
          }
          return plugin;
        };
        global.provide = function (name) {
          global._PLUGIN_EXPORTS[name] = module.exports;
          resetModule();
        };
        resetModule();
      }());
    } else {
      global.provide = function () {};
    }
}());
/*jslint browser: true, debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  module = {},
  provide = {},
*/
"use strict";
(function (undefined) {
  // logger utility
  function log(e) {
    var args = Array.prototype.slice.call(arguments);
    if ('undefined' !== typeof console && 'undefined' !== console.log) {
      try { // Firefox
        console.log.apply(console.log, args);
      }
      catch (ignore) {
        try { // WebKit Quirk/BUG fix
          console.log.apply(console, args);
        }
        catch (ignore_again) {
          console.log(e);
        }
      }
    }
  }

  // Exception Class
  function exception(msg) {
    this.name = "FuturesException";
    this.message = msg;
  }

  // error utility
  function error(e) {
    /* TODO if browser *** alert(e); *** */
    log(e);
    if (typeof console !== 'undefined') {
      debugger;
    }
    throw new exception(e);
  }
  module.exports = {
    log: log,
    error: error,
    exception: exception,
    extend: function (over, from) {
      Object.keys(from).forEach(function (key) {
        over[key] = from[key];
      });
      return over;
    }
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/private');
}());
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

  /**
   * Do asynchronous things synchronously
   */
  function make_sequence(head) {
    var funcs = [undefined],
      lastResult = [],
      index = 0,
      next,
      then,
      begin,
      update_result;

    next = function () {
      if (!funcs[index]) {
        return;
      }
      var p = Futures.promise(),
        f = funcs[index];
      funcs[index] = undefined;
      p.when(update_result);
      lastResult.unshift(p.fulfill);
      f.apply(null, lastResult);
    };

    update_result = function () {
      var args = Array.prototype.slice.call(arguments);
      lastResult = args;
      index += 1; // in case this is a synchronous call
      next();
    };

    then = function (func) {
      funcs.push(func); // It's possible that a then is added after the others have all returned.
      // That's why we need to tick to see if this should run itself now.
      next();
      return {
        then: then
      };
    };

    begin = function (head) {
      funcs[0] = head; // we ensure that this is async
      //setTimeout(next,0,['nada']);
      next();
      return {
        then: then
      };
    };
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
          sequence.then(function(fulfill) {
            var priorResults = Array.prototype.slice.call(arguments),
              result;
            priorResults.shift(); // get rid of `fulfill`

            args.unshift(priorResults);
            result = consumer.apply(context || provider, args);
            if ('undefined' !== typeof(result)) {
              if (result.when) {
                result.when(fulfill);
              } else {
                fulfill(result);
              }
            } else {
              // is this a convenience or a hangman's noose?
              fulfill.apply(null, priorResults);
              // better to do this instead?
              // throw new FuturesException('"' + key + '" does not return a result. All consumers must return a result');
            }
          });
          return methods;
        };
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
        if ('function' !== typeof(result.when)) {
          throw new Futures.exception('"chainify" provider "' + key + '" isn\'t promisable');
        }
        sequence(function (fulfill) {
          result.when(fulfill);
        });
        return methodify(providers[key], sequence);
      };
    }

    for (key in providers) {
      if (providers.hasOwnProperty(key)) {
        Model[key] = modelify(key);
      }
    }
    return Model;
  }


  module.exports = {
    chainify: chainify,
    sequence: make_sequence
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/chainify');
}());
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
  Futures.extend(Futures, require('futures/chainify'));

  /**
   * Anonymous (event) triggers
   */
  function trigger(ignore) {
    var s = Futures.subscription();
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
   * Force a function to be asynchronous (and promisable, of course)
   */
  function asyncify(synchronous, timeout, context) {
    var p = Futures.promise(),
      promisable;
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
    };
    promisable.fail = function () {
      var args = Array.prototype.slice.call(arguments);
      p.fail(args);
      return this;
    };
    */
    return promisable;
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
    p = Futures.promise();

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
      then: Futures.sequence(function (fulfill) {
        p.when(fulfill);

        return this;
      }).then,
      when: function (func) {
        p.when(func);
        return this;
      }
    };
  }

  module.exports = {
    trigger: trigger,
    asyncify: asyncify,
    whilst: whilst,
    loop: whilst
  };
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/util');
}());
/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
// Node.js and Browsers include these. They're available in Rhino with env.js
var console = {},
  setTimeout = function () {},
  setInterval = function () {},
  clearTimeout = function () {},
  clearInterval = function () {};
*/
"use strict";
var Futures;
(function () {     
  Futures = require('futures/private');
  Futures.extend(Futures, require('futures/promise'));
  Futures.extend(Futures, require('futures/subscription'));
  Futures.extend(Futures, require('futures/chainify'));
  Futures.extend(Futures, require('futures/util'));
  Futures.extend(Futures, require('futures/deprecated'));

  /**
   * Public Promise and Subscription Methods
   */
  public_methods = {
    promise: Futures.promise,
    subscription: Futures.subscription,
    subscription2promise: Futures.subscription2promise,
    join: Futures.join,
    synchronize: Futures.synchronize,
    sequence: Futures.sequence,
    chainify: Futures.chainify,
    futurify: Futures.chainify,
    sleep: function() { error('Not Implemented Yet'); },
    wait: function() { error('Not Implemented Yet'); },
    watchdog: function() { error('Not Implemented Yet'); },
    log: Futures.log,
    error: Futures.error,

    // Slated for removal
    promisify: Futures.promisify,
    subscribify: Futures.subscribify
  };
  
  module.exports = Futures;
  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures');
}());
