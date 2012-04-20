Lateral
===

Basically a thread pool for asynchronous calls. The number of calls is limited to n.

Installation
---

Node.JS (Server):

    npm install lateral

Browser:

    pakmanager build lateral
    #or ender build lateral

Standalone Usage
---

    var Lateral = require('lateral')
      , maxCallsAtOnce = 4 // default
      , lateral
      ;

    lateral = Lateral.create(function (complete, item, i) {
      setTimeout(function () {
        console.log(item);
        complete();
      }, 500);
    }, maxCallsAtOnce);

    lateral.add(['a', 'b', 'c', 'd']).when(function () {
      console.log('did all the things');
    });
    
    lateral.add(['d', 'e', 'f', 'g']).when(function () {
      console.log('did all the things');
    });
    
API
---

Creates a Sequence-ish object for the purpose of synchronizing other Futures.

**Core**

  * `lateral = Lateral.create(handler, n)`
    * create a Lateral that will execute `fn` on each item to do at most `n` things at once

  * `lateral.add(arr)` - adds `arr` to be handled by `fn`

  * `lateral.add(arr).when(callback)` 
    * Fires `callback` when all items in the `arr` batch have been handled
