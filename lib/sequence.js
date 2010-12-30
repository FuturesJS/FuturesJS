(function () {
  "use strict";

  function isSequence(obj) {
    return obj instanceof subscription;
  }

  function sequence(global_context) {
    var self = this,
      data,
      stack = [],
      begun = false;
    
    global_context = global_context || null;

    function fulfill() {
      data = arguments;
      var args = Array.prototype.slice.call(arguments),
        seq = stack.shift();

      args.unshift(fulfill);
      if (!seq) {
        // the chain has ended (for now)
        return;
      }

      seq.callback.apply(seq.context, args);
    }

    function next() {
      if (!begun) {
        return;
      }

      fulfill.apply(self, data);
    };

    self.then = function (callback, context) {
      if ('function' !== typeof callback) {
        throw new Error("`Sequence().then(callback [context])` requires that `callback` be a function and that `context` be `null`, an object, or a function");
      }
      stack.push({
        callback: callback,
        context: (null === context ? null : context || global_context)
      });

      // if the chain has stopped, start it back up
      if (1 === stack.length) {
        next();
      }

      return self;
    };

    self.begin = function () {
      data = arguments;
      if (begun) {
        throw new Error("`Sequence().begin()` must be called exactly once");
        return;
      }
      begun = true;

      next();

      return self;
    };
  }

  function Sequence(context) {
    // TODO use prototype instead of new
    return (new sequence(context));
  }
  Sequence.isSequence = isSequence;
  module.exports = Sequence;

  provide = ('undefined' !== typeof provide) ? provide : function () {};
  provide('futures/sequence');
}());
