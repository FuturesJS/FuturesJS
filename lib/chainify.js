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
