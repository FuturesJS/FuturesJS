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
