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
var process,
  provide = provide || function () {};
/* browser boiler-plate */
(function () {
  "use strict";

  var emitter, EventEmitter;

  function E() {}

  if ('undefined' === typeof process) {
    EventEmitter = E;
  } else {
    EventEmitter = process.EventEmitter;
  }
/* End browser boiler-plate */

//var EventEmitter = exports.EventEmitter = process.EventEmitter;

var isArray = Array.isArray;

EventEmitter.prototype.emit = function (type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1];
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    if (arguments.length <= 3) {
      // fast case
      handler.call(this, arguments[1], arguments[2]);
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit("newListener", type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {
    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
/*
exports.Promise = function removed () {
  throw new Error(
    'Promise has been removed. See '+
    'http://groups.google.com/group/nodejs/msg/0c483b891c56fea2 for more information.');
}
process.Promise = exports.Promise;
*/

/* browser boiler-plate */

  emitter = EventEmitter;
  function Emitter(context) {
    // TODO use prototype instead of new
    return (new emitter(context));
  }
  Emitter.isEmitter = function (obj) {
    return obj instanceof emitter;
  };

  module.exports = Emitter;
  provide('futures/emitter');
}());
/* End browser boiler-plate */
var provide = provide || function () {};
(function () {
  "use strict";

  if ('undefined' === typeof __dirname) {
    __dirname = '';
  }

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

  provide('futures/asyncify');
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
            var args = Array.prototype.slice.call(arguments),
              args_params = [];
              next = args.shift();

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



  function BreakAsyncLoop() {
      this.name = "BreakAsyncLoop";
      this.message = "Normal";
  }



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
          if (e instanceof BreakAsyncLoop) {
            future.deliver.apply(future, data);
            return;
          }
          throw e;
        }
      }, wait);
    }



    function next() {
      data = Array.prototype.slice.call(arguments);
      if ("break" === data[0]) {
        data.shift();
        throw new BreakAsyncLoop();
      }
      runAgain();
    }



    self.run = function (doStuff) {
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
    sequence: require(modulepath + '/sequence'),
    join: require(modulepath + '/join'),
    emitter: require(modulepath + '/emitter'),
    asyncify: require(modulepath + '/asyncify'),
    loop: require(modulepath + '/loop'),
    chainify: require(modulepath + '/chainify')
  };

  provide('futures');
}());
