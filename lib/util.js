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
