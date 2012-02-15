Join
===

Joins asynchronous calls together similar to how `pthread_join` works for threads.

Installation
---

Node.JS (Server):

    npm install join

Ender.JS (Browser):

    ender build join

Standalone Usage
---

    var Join = require('join')
      , join = Join()
      , callbackA = join.add()
      , callbackB = join.add()
      , callbackC = join.add()
      ;

    function abcComplete(aArgs, bArgs, cArgs) {
      console.log(aArgs[1] + bArgs[1] + cArgs[1]);
    }

    setTimeout(function () {
      callbackA(null, 'Hello');
    }, 300);

    setTimeout(function () {
      callbackB(null, 'World');
    }, 500);

    setTimeout(function () {
      callbackC(null, '!');
    }, 400);


    // this must be called after all 
    join.when(abcComplete);

Usage with FuturesJS
---

    var Futures = require('futures')
      , join = Futures.join()
      , fArray = [
            Futures.future()
          , Futures.future()
          , Futures.future()
        ]
      , e
      ;

    setTimeout(function () { fArr[1].deliver(e, "World"); }, 100);
    setTimeout(function () { fArr[0].deliver(e, "Hi"); }, 300);
    setTimeout(function () { fArr[0].deliver(e, "Hello"); }, 500);
    setTimeout(function () { fArr[2].deliver(e, "!", "!"); }, 700);

    // * join.add() -- creates a callback that you can pass in to another function
    //
    //    $.get('/xyz.json', join.add());

    // * join.add(<future>) -- adds a single future
    //
    //    var f1 = Futures.future()
    //      , f2 = Futures.future()
    //      ;
    //    join.add(f1, f2); // or join.add(f1).add(f2);

    // * join.add([<future>, ...]) -- adds an array of futures
    //
    //   join.add(fArr);

    join.add(fArr);
    join.when(function (f0Args, f1Args, f2Args) {
      console.log(f1Args[1], f2Args[1], f3Args[1], f2Args[2]);
    });

API
---

Creates a Future-ish object for the purpose of synchronizing other Futures.

**Core**

  * `join = Futures.join(globalContext=null)` - create a Future and modifies it
  * `join.add()` - creates a joinable callback that you can throw around
  * `join.add(future0, future1, ...)` - add one or more `Future`s which to join
  * `join.add([future0, future2, ...])` - add an array of `Future`s
  * `join.when(finalCallback)`
    * Fires `finalCallback` when all joined callbacks have completed
    * Must be called after the last `add()`
    * See `Future.future().when`
  * `join.whenever(eventCallback)`
    * Fires `eventCallback` each time all callbacks have completed at least once
    * Must be called after the last `add()`
    * see `Future.future().whenever`
  * `join.isJoin` - a best-effort guess as to whether or not an object is a Join

**Inherited-ish**

  * `when` - see `Future.future().when`
  * `whenever` - see `Future.future().whenever`

Note: All `add(future)`s must be done before calling `when` or `whenever` on the join object.
