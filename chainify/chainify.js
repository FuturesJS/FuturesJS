(function () {
  "use strict";

  var Future = require('future'),
    Sequence = require('sequence');

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
}());
