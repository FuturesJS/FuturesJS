asyncify()
----

  * `doStuff = Futures.asyncify(doStuffSync)` - returns a fuction with the same signature which catches errors and returns a future rather than the synchronous data.

**Example:**

    function doStuffSync = function (params) {
      throw new Error("Error of some sort");
      return "Hello";
    }

    var doStuff = Futures.asyncify(doStuffSync);

    doStuff.whenever(function (err, data) {
      console.log(err, data);
    });

    doStuff();
    doStuff();
    doStuff().when(function (err, data) {
      if (err) {
        throw err;
      }
      console.log(data);
    });
