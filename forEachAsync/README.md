Array.forEachAsync()
----

Another reincarnation of `sequence` that makes sense for the use case of arrays.

**Warning:** [Poorly written code](https://gist.github.com/941362) may have really strange errors when `Array.prototype` is extended.
If you run into such problems please contact the author of the code (I'm also willing to help if they are unavailable).
Libraries such as `jQuery` or `MooTools` will accept bug reports for such failures.

**Example:**

    var count = 0
      , timers = [
          101,
          502,
          203,
          604,
          105
        ];

    function hello(next, time) {
      console.log(count += 1, time);
      setTimeout(next, time);
    }

    function goodbye() {
      console.log("All Done");
    }


    // Array.protoype.forEachAsync
    require('Array.prototype.forEachAsync');
    timers.forEachAsync(hello).then(goodbye);


    // Futures.forEachAsync
    var forEachAsync = require('futures').forEachAsync;
    forEachAsync(timers, hello).then(goodbye);

Note: Run one example or the other... not both
