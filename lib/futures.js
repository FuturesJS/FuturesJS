(function () {

  /**
   * Create a chainable promise
   */
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
        timeout,
        retval,
        result;

        if ("custom" === params) {
          func = func(p.fulfill, p.smash);
        } else if (params) {

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

        retval = func.apply(func, args);
        result = p.passable();
        result.withResult = function(func) {
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
      // Four modes
      //    Order doesn't matter and fire all
      //    Order doesn't matter and wait for failure / timeout before firing again
      //    Order matters and drop stale
      //    Order matters and wait
      var callbacks = {},
      errbacks = {},
      s = make_subscription();


      // Assume that it is promisable unless params say otherwise
      if (undefined !== params) {
        promisable = promisify(promisable, params);
      }

      // Each time this function is called it uses the same
      // a new promise with the same subscription
      function subscribable() {
        var args = Array.prototype.slice.call(arguments);
        // TODO "this" needs to be the same as the original
        // maybe add it as a property?
        promisable.apply(promisable, args)
          .when(s.deliver)
          .fail(s.hold);
        return {
          when: function(func) {
            promisable.when(func);
            return this;
          },
          fail: function(func) {
            promisable.fail(func);
            return this;
          }
        }
      }
      subscribable.subscribe = function(func) {
            return s.subscribe(func);
      };
      return subscribable;


      function subscribe(callback, errback) {
        var token = '' + (new Date()).valueOf() + '' + randomString();
        if (callback) {
          callbacks[token] = callback;
        }
        if (errback) {
          errbacks[token] = errback;
        }
        return function unsubscribe() {
          // TODO Once-ify this function
          try {
            delete callbacks[token];
          } catch(ignore) {}
          try {
            delete errbacks[token];
          } catch(ignore) {}
        };
      }

      function update(deed, value) {
        outcome = value;
        (deed == 'update' ? callbacks : errbacks).forEach(function (func) {
          try {
            func(outcome);
          } catch (ignore) {}
        });
      };

      function wrapped_promisable() {
        var args = Array.prototype.slice.call(arguments),
        p;
        p = promisable.apply(orig, args);
        if (undefined === p.when || undefined === p.fail) {
          throw new Error('You passed a non-promisable to subscribify!');
        }
        p.when(function(data) {
            update('update',data);
          })
          .fail(function(msg) {
            update('fail',msg);
          })
          ;
        return {
          when: function(f) {
            p.when(f);
            return this;
          },
          fail: function(f) {
            p.fail(f);
            return this;
          },
          subscribe: function(f) {
            subscribe(f);
            return this;
          },
          unsubscribe: function(t) {
            unsubscribe(t);
            return this;
          }
        };
      }

      return {
        subscribee: wrapped_promisable,
        subscribe: function(f) {
          subscribe(f);
          return this;
        },
        unsubscribe: function(t) {
          unsubscribe(t);
          return this;
        }
      };
    }









  /*
   * Make Subscription
   * This varies from a promise in that it can be 'fulfilled' multiple times
   */
  function make_subscription() {
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
      //if (status !== 'unresolved') {
        // TODO respond immediately instead
      //  throw new Error('The promise has already been resolved:' + status);
      //}
      status = deed;
      outcome = value;
      (deed == 'fulfilled' ? waiting : dreading).forEach(function (func) {
        try {
          func(outcome);
        } catch (ignore) {}
      });
      //waiting = [];
      //dreading = [];
    };

    result = {
      subscribe: function (func) {
        vouch('fulfilled', func);
      }, 
      fail: function (func) {
        vouch('smashed', func);
      },
      deliver: function (value) {
        resolve('fulfilled', value);
      },
      hold: function (string) {
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


  function join_issues() {
  }


  /*
   * Public Promise and Subscription Methods
   */
  window.Futures = {
    promise: make_promise,
    join: join_promises,
    promisify: promisify,
    subscription: make_subscription,
    subscribify: subscribify
  };













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
  function randomString(len, base) {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
    string_length = len && parseInt(len) || 8,
    string_base = base && parseInt(base) || 64,
    token = '',
    i, 
    x;

    if (1 > base || 64 < base) {
      throw new Error("'base' must be an integer 1-64");
    }
    if (1 > len) {
      throw new Error("'len' must be an integer 1+");
    }

    for (i = 0; i < string_length; i++) {
      x = Math.floor(Math.random() * chars.length);
      token += chars.substring(x, x+1);
    }
    return token;
  }

}());
