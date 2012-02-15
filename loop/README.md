loop()
----

Creates a "safe" asynchronous loop.

**core**

  * `Futures.loop(context=null)` - creates a loop object
  * `run(function (next), seed [, ...])` - Start the loop
    * `next = function (err, data [, ...]) {}`
      * `next("break")` will break the loop
    * `seed` - the data to start with

  * `setTimeout(ms)` - Kill the loop if it runs for `ms`
  * `setMaxLoop(count)` - Kill the loop if it continues `count+1` times
  * `setWait(ms)` - Wait at least `ms` before looping again (Browser minimum is 4ms, even if 0 is set)

Note: In a browser each loop will be at least 4ms apart.

**Example:**

    var loop = Futures.loop();

    loop.setTimeout(1000);
    loop.setMaxLoop(20);

    loop.run(function (next, err, data) {
      if (data == 4) {
        next("break");
      }
      data += 1;
      next(undefined, data);
    }, 0);
