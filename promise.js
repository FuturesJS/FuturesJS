function make_promise() {
  var status = 'unresolved',
      outcome,
      waiting = [],
      dreading = [],
      result; 

  function vouch(deed, func) {
    switch (status) {
    case 'unresolved':
      (deed === 'fulfilled' ? waiting : dreading).push(func);
      break; 
    case deed:
      func(outcome);
      break;
    }
  };

  function resolve(deed, value) {
    //$.jGrowl(JSON.stringify(status) + " " + JSON.stringify((status === 'unresolved'))  );
    if (status !== 'unresolved') {
      // TODO respond immediately instead
      throw new Error('The promise has already been resolved:' + status);
    }
    status = deed;
    outcome = value;
    (deed == 'fulfilled' ? waiting : dreading).forEach(function (func) {
      try {
        func(outcome);
      } catch (ignore) {}
    });
    waiting = null;
    dreading = null;
  };

  result = {
    when: function (func) {
      vouch('fulfilled', func);
    }, 
    fail: function (func) {
      vouch('smashed', func);
    },
    fulfill: function (value) {
      resolve('fulfilled', value);
    },
    smash: function (string) {
      resolve('smashed', string);
    }, 
    status: function () {
      return status;
    }
  };

  result.passable = function () {
    return {
      when: function (f) {
        result.when(f);
        return this;
      },
      fail: function (f) {
        result.fail(f);
        return this;
      }
    };
  }

  return result;
};

/**
 * Join any number of promises and return the results in the order they were passed in.
 *
 * p_all = join_promises([p1, p2, p3]);
 * p_all.when(function(d_arr){
 *   var d1 = d_arr[0],
 *     d2 = d_arr[1],
 *     d3 = d_arr[2];
 * });
 *
 * TODO accept a hash as well
 * TODO use .apply to accept n params
 * TODO add timeout 
 * TODO notify the user which promise failed when smashed?
 *
 * @param Array of Promises
 * @return A promise which is fulfilled only if and when all other parameter promises are fulfilled.
 */
function join_promises (promises) {
  var p = make_promise(),
    num = 0,
    ps = [],
    success = true;

  // Developer Mode
  if (!Array.isArray(promises)) {
    var msg = "join_promises must pass receive an array of promises.";
    DBG(msg + "\n\n" + JSON.stringify(Array.isArray));
    throw msg;
  }

  num = promises.length;

  function partial(data, i, status) {
    success = success && status;
    ps[i] = data;
    num -= 1;
    if (0 === num) {
      // .apply doesn't seem to work :-(
      (success ? p.fulfill.call(p, ps) : p.smash.call(p, ps))
    }
  }

  promises.forEach(function (el, i, arr) {
    // increase the array to the appropriate size
    ps.push(undefined);
    el.when(function (data) {
      partial(data, i, true);
    });
    el.fail(function (data) {
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
  function promisify(func, params) {
    return function() {
      var args = Array.prototype.slice.call(arguments),
      //args = _.toArray(arguments).slice(0), // the underscore.js way
      p = make_promise(),
      timeout;

      if (params) {
        // If you provide a timeout, it will smash the promise
        if (undefined !== params.timeout) {
          timeout = setTimeout(function(){
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
            p.when(function(){
              clearTimeout(timeout)
            });
          }
        }
      }
      func.apply(func, args);
      return p.passable();
    };
  }

/*
  function subscription(promisable) {
    var args = Array.prototype.slice.call(arguments);
    promisable.apply(promisable, args);
  }
*/


/*
// TODO also inherit from Memoize with timestamp
Friends.get(id).doX();
var Friends = this;
this.get = function(id,onGo,onErr) {
  // A friend instance
  var friends = {} // TODO add a timestamp of Friends.timestamp
  if (friend[id] && friend[id].isObject) {
    return friend.listen(onGo,OnErr);
  }
  return new function() {
    this.listen = function(onGo,OnErr) {
      vouch();
    }
    this.show = 
  }
}
*/
