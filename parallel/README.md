Parallel
===

Basically a thread pool for asynchronous calls. The number of calls is limited to n.

Installation
---

Node.JS (Server):

    npm install parallel

Browser:

    pakmanager build parallel
    #or ender build parallel

Standalone Usage
---

    var Parallel = require('parallel')
      , maxCallsAtOnce = 4 // default
      , parallel
      ;

    parallel = Parallel.create(function (complete, item, i) {
      setTimeout(function () {
        console.log(item);
        complete();
      }, 500);
    }, maxCallsAtOnce);

    parallel.add(['a', 'b', 'c', 'd']).when(function () {
      console.log('did all the things');
    });
    
    parallel.add(['d', 'e', 'f', 'g']).when(function () {
      console.log('did all the things');
    });
    
API
---

Creates a Sequence-ish object for the purpose of synchronizing other Futures.

**Core**

  * `parallel = Parallel.create(handler, n)`
    * create a Parallel that will execute `fn` on each item to do at most `n` things at once

  * `parallel.add(arr)` - adds `arr` to be handled by `fn`

  * `parallel.add(arr).when(callback)` 
    * Fires `callback` when all items in the `arr` batch have been handled
