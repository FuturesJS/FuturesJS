(function () {
  "use strict";

  // TODO factor out parallel code into module
  var Sequence = require('sequence')
    , Join = require('join')
    ;

  // should be more like sequence than join
  function Parallel(_fn, _nThreads) {
    var nThreads = _nThreads || 4
      , fn = _fn
      , mod = 0
      , sequences = []
      , parallel
      ;

    parallel = {
        setThreads: function (_nThreads) {
          var i
            ;

          nThreads = _nThreads;
          
          sequences = [];
          for (i = 0; i < nThreads; i += 1) {
            sequences.push(Sequence());
          }

        }
      , add: function (arr) {
          var join
            ;

          // TODO instantiate the functions lazily
          // rather than all-at-once and conserve memory
          arr.forEach(function (item, i) {
            mod = (mod % sequences.length);
            sequences[mod].then(function (next) {
              fn(next, item, i);
            });
            mod += 1;
          });

          join = Join();

          sequences.forEach(function (seq) {
            var j = join.add();
            seq.then(function (next) {
              j();
              next();
            });
          });

          return join;
        }
    };

    parallel.setThreads(nThreads);
    
    return parallel;
  }

  Parallel.create = Parallel;

  module.exports = Parallel;
}());
