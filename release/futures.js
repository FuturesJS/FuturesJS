// promise, future, deliver, fulfill
var provide = provide || function () {};
(function () {
  "use strict";

  var MAX_INT = Math.pow(2,52);

  function isFuture(obj) {
    return obj instanceof future;
  }

  function futureTimeout(time) {
    this.name = "FutureTimeout";
    this.message = "timeout " + time + "ms";
  }



  function future(global_context) {
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
          self.deliver(new futureTimeout(time));
          timeout_id = undefined;
        }, time);
      }
    }



    self.isFuture = isFuture;

    self.setContext = function (context) {
      global_context = context;
    };

    self.setTimeout = function (new_time) {
      time = new_time;
      resetTimeout();
    };



    self.errback = function () {
      if (arguments.length < 2) {
        self.deliver.call(self, arguments[0] || new Error("`errback` called without Error"));
      } else {
        self.deliver.apply(self, arguments);
      }
    };



    self.callback = function () {
      var args = Array.prototype.slice.call(arguments);

      args.unshift(undefined);
      self.deliver.apply(self, args);
    };



    self.callbackCount = function() {
      return Object.keys(everytimers).length;
    };



    self.deliveryCount = function() {
      return deliveries;
    };



    self.setAsap = function(new_asap) {
      if (undefined === new_asap) {
        new_asap = true;
      }
      if (true !== new_asap && false !== new_asap) {
        throw new Error("Future.setAsap(asap) accepts literal true or false, not " + new_asap);
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
      return !!findCallback.apply(self, arguments);
    };



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
        throw new Error("`Future().fulfill(err, data, ...)` renders future deliveries useless");
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

        // TODO
        callback.apply(context, args);
        /*
        callback.apply(('undefined' !== context ? context : newme), args);
        context = newme;
        context = ('undefined' !== global_context ? global_context : context)
        context = ('undefined' !== local_context ? local_context : context)
        */
      });

      if (args[0] && "FutureTimeout" !== args[0].name) {
        resetTimeout();
      }

      return self;
    };



    self.fulfill = function () {
      if (arguments.length) {
        self.deliver.apply(self, arguments);
      } else {
        self.deliver();
      }
      fulfilled = true;
    };



    self.whenever = function (callback, local_context) {
      var id = index,
        everytimer;

      if ('function' !== typeof callback) {
        throw new Error("Future().whenever(callback, [context]): callback must be a function.");
      }

      if (findCallback(callback, local_context)) {
        // TODO log
        throw new Error("Future().everytimers is a strict set. Cannot add already subscribed `callback, [context]`.");
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

  function Future(context) {
    // TODO use prototype instead of new
    return (new future(context));
  }
  Future.isFuture = isFuture;
  module.exports = Future;

  provide('futures/future');
}());
var provide = provide || function () {},
  __dirname = __dirname || '';
(function () {
  "use strict";

  var Future = require((__dirname ? __dirname + '/' : 'futures') + '/future');

  function isJoin(obj) {
    return obj instanceof join;
  }

  function join(global_context) {
    var self = this,
      data = [],
      ready = [],
      subs = [],
      promise_only = false,
      begun = false,
      updated = 0,
      join_future = Future(global_context);

    global_context = global_context || null;

    function relay() {
      var i;
      if (!begun || updated !== data.length) {
        return;
      }
      updated = 0;
      join_future.deliver.apply(join_future, data);
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

    self.deliverer = function () {
      var future = Future();
      self.add(future);
      return future.deliver;
    };

    self.when = function () {
      if (!begun) {
        init();
      }
      join_future.when.apply(join_future, arguments);
    };

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

  function Join(context) {
    // TODO use prototype instead of new
    return (new join(context));
  }
  Join.isJoin = isJoin;
  module.exports = Join;

  provide('futures/join');
}());var provide = provide || function () {};
(function () {
  "use strict";

  function isSequence(obj) {
    return obj instanceof sequence;
  }

  function sequence(global_context) {
    var self = this,
      waiting = true,
      data,
      stack = [];

    global_context = global_context || null;

    function next() {
      var args = Array.prototype.slice.call(arguments),
        seq = stack.shift(); // BUG this will eventually leak

      data = arguments;

      if (!seq) {
        // the chain has ended (for now)
        waiting = true;
        return;
      }

      args.unshift(next);
      seq.callback.apply(seq.context, args);
    }

    self.then = function (callback, context) {
      if ('function' !== typeof callback) {
        throw new Error("`Sequence().then(callback [context])` requires that `callback` be a function and that `context` be `null`, an object, or a function");
      }
      stack.push({
        callback: callback,
        context: (null === context ? null : context || global_context),
        index: stack.length
      });

      // if the chain has stopped, start it back up
      if (waiting) {
        waiting = false;
        next.apply(null, data);
      }

      return self;
    };
  }

  function Sequence(context) {
    // TODO use prototype instead of new
    return (new sequence(context));
  }
  Sequence.isSequence = isSequence;
  module.exports = Sequence;

  provide('futures/sequence');
}());
var __dirname = __dirname || '',
    provide = provide || function () {};
(function () {
  "use strict";

  var Sequence = require((__dirname ? __dirname + '/' : 'futures') + '/sequence');

  function forEachAsync(arr, callback) {
    var sequence = Sequence();

    function handleItem(item, i, arr) {
      sequence.then(function (next) {
        callback(next, item, i, arr);
      });
    }

    arr.forEach(handleItem);

    return sequence;
  }

  module.exports = forEachAsync;

  provide('futures/forEachAsync-standalone', module.exports);
}());
(function () {
  "use strict";

  require('require-kiss');

  var Future = require((__dirname ? __dirname + '/' : 'futures') + '/future');

  function asyncify(doStuffSync, context) {
    var future = Future(),
      passenger = future.passable();

    future.setAsap(false);

    function doStuff() {
      var self = ('undefined' !== typeof context ? context : this),
        err,
        data;

      future.setContext(self);

      try {
        data = doStuffSync.apply(self, arguments);
      } catch(e) {
        err = e;
      }

      future.deliver(err, data);

      return passenger;
    }

    doStuff.when = passenger.when;
    doStuff.whenever = passenger.whenever;

    return doStuff;
  }

  module.exports = asyncify;
  provide('futures/asyncify', module.exports);
}());
var provide = provide || function () {},
  __dirname = __dirname || '';
(function () {
  "use strict";

  var Future = require((__dirname ? __dirname + '/' : 'futures') + '/future'),
    Sequence = require((__dirname ? __dirname + '/' : 'futures') + '/sequence');


  // This is being saved in case I later decide to require future-functions
  // rather than always passing `next`
  function handleResult(next, result) {
    // Do wait up; assume that any return value has a callback
    if ('undefined' !== typeof result) {
      if ('function' === typeof result.when) {
        result.when(next);
      } else if ('function' === typeof result) {
        result(next);
      } else {
        next(result);
      }
    }
  }

  /**
   * Async Method Queing
   */
  function Chainify(providers, modifiers, consumers, context, params) {
    var Model = {};

    if ('undefined' === typeof context) {
      context = null;
    }

    /**
     * Create a method from a consumer
     * These may be promisable (validate e-mail addresses by sending an e-mail)
     * or return synchronously (selecting a random number of friends from contacts)
     */
    function methodify(provider, sequence) {
      var methods = {};

      function chainify_one(callback, is_consumer) {
        return function () {
          var params = Array.prototype.slice.call(arguments);

          sequence.then(function() {
            var args = Array.prototype.slice.call(arguments)
              , args_params = []
              , next = args.shift();

            args.forEach(function (arg) {
              args_params.push(arg);
            });
            params.forEach(function (param) {
              args_params.push(param);
            });
            params = undefined;

            if (is_consumer) {
              // Don't wait up, just keep on truckin'
              callback.apply(context, args_params);
              next.apply(null, args);
            } else {
              // Do wait up
              args_params.unshift(next);
              callback.apply(context, args_params);
            }

            // or
            // handleResult(next, result)
          });
          return methods;
        };
      }

      Object.keys(modifiers).forEach(function (key) {
        methods[key] = chainify_one(modifiers[key]);
      });

      Object.keys(consumers).forEach(function (key) {
        methods[key] = chainify_one(consumers[key], true);
      });

      return methods;
    }

    /**
     * A model might be something such as Contacts
     * The providers might be methods such as:
     * all(), one(id), some(ids), search(key, params), search(func), scrape(template)
     */
    function chainify(provider, key) {
      return function () {
        var args = Array.prototype.slice.call(arguments),
          future = Future(),
          sequence = Sequence();

        // provide a `next`
        args.unshift(future.deliver);
        provider.apply(context, args);

        sequence.then(future.when);

        return methodify(providers[key], sequence);
      };
    }

    Object.keys(providers).forEach(function (key) {
      Model[key] = chainify(providers[key], key);
    });

    return Model;
  }

  module.exports = Chainify;

  provide('futures/chainify');
}());
var provide = provide || function () {},
  __dirname = __dirname || '';

(function () {
  "use strict";

  var Future = require((__dirname ? __dirname + '/' : 'futures') + '/future');



  function MaxCountReached(max_loops) {
      this.name = "MaxCountReached";
      this.message = "Loop looped " + max_loops + " times";
  }



  function timestamp() {
    return (new Date()).valueOf();
  }



  function loop(context) {
    var self = this,
      future = Future(),
      min_wait = 0,
      count = 0,
      max_loops = 0,
      latest,
      time,
      timed_out,
      timeout_id,
      data,
      callback;

    self.setMaxLoop = function (new_max) {
      max_loops = new_max;
      return self;
    };



    self.setWait = function (new_wait) {
      min_wait = new_wait;
      return self;
    };



    self.setTimeout = function (new_time) {
      if (time) {
        throw new Error("Can't set timeout, the loop has already begun!");
      }
      time = new_time;
      var timeout_id = setTimeout(function () {
        timed_out = true;
        future.deliver(new Error("LoopTimeout"));
      }, time);

      future.when(function () {
        clearTimeout(timeout_id);
      });
      return self;
    };



    function runAgain() {
      var wait = Math.max(min_wait - (timestamp() - latest), 0);
      if (isNaN(wait)) {
        wait = min_wait;
      }

      if (timed_out) {
        return;
      }
      if (max_loops && count >= max_loops) {
        future.deliver(new MaxCountReached(max_loops));
        return;
      }

      data.unshift(next);
      setTimeout(function () {
        latest = timestamp();
        try {
          callback.apply(context, data);
          count += 1;
        } catch(e) {
          console.log('I\'m an error');
          throw e;
        }
      }, wait);
    }



    function next() {
      // dirty hack to turn arguments object into an array
      data = Array.prototype.slice.call(arguments);
      if ("break" === data[0]) {
        data.shift();
        future.deliver.apply(future, data);
        return;
      }
      runAgain();
    }



    self.run = function (doStuff) {
      // dirty hack to turn arguments object into an array
      data = Array.prototype.slice.call(arguments);
      callback = doStuff;
      data[0] = undefined;
      next.apply(self, data);
      return self;
    };



    self.when = future.when;
    self.whenever = future.whenever;

  }




  function Loop(context) {
    // TODO use prototype instead of new
    return (new loop(context));
  }
  module.exports = Loop;

  provide('futures/loop');
}());
/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
var provide = provide || function () {},
   __dirname = __dirname || '';

(function () {
  "use strict";

  var modulepath;

  if (!__dirname) {
    modulepath = 'futures';
  } else {
    modulepath = __dirname;
  }

  function upgradeMessage() {
    var msg = "You have upgraded to Futures 2.x. See http://github.com/coolaj86/futures for details.";
    console.log(msg);
    throw new Error(msg);
  }

  module.exports = {
    promise: upgradeMessage,
    subscription: upgradeMessage,
    synchronize: upgradeMessage,
    whilst: upgradeMessage,
    future: require(modulepath + '/future'),
    forEachAsync: require(modulepath + '/forEachAsync-standalone'),
    sequence: require(modulepath + '/sequence'),
    join: require(modulepath + '/join'),
    asyncify: require(modulepath + '/asyncify'),
    loop: require(modulepath + '/loop'),
    chainify: require(modulepath + '/chainify')
  };

  provide('futures');
}());
