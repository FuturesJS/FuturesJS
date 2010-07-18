FuturesJS
=========

FuturesJS is a JavaScript library which (when used as directed) simplifies handling Callbacks, Errbacks, Promises, Subscriptions, Joins, Synchronization of asynchronous data, and Eventually Consistent data. It is akin to this well documented this MSDN library, but with a liberal MIT license.

Getting Started
---------------

See the [Getting Started](http://coolaj86.github.com/futures/) GitHub page. 

Additionally test.html contains a number of (obviously) working examples. These can also be accessed live from the [computer in my closet](http://coolaj86.info/futuresjs/) - when it's on that is.

Post questions, bugs, and stuff you want to share on the [(Google Groups) Mailing List](http://groups.google.com/group/futures-javascript)

Near-future TODOs
-----------------
  * Create tests for joins which now accept subscriptions
  * Update documentation about joins
  * Create tests for subscriptions which now accept subscribe(callback, errback)
  * Update docs, and do the same for promises
  * Document the API in this readme and move remaining useful examples to the getting started
  * Create an 'Interceptor' which uses a hash to determine how to promisify a function
  * Once CommonJS gets things figured out, become CommonJS compatible
  * Encourage users to post use cases on the wiki

Loading FuturesJS
=================

Download the file `lib/futures.js` and include it in your application.

In a browser:
    <script src='lib/futures.js'></script>

In Node.js:
    node> var Futures = require('./lib/futures');

For Rhino you will need `env.js` as Futures utilizes `setTimeout` and its friends.

API
=====

Futures.promise() -- create a promise object
-----------------

Creates a promise object

If guarantee (optional) is passed, an immediate (an already fulfilled promise) is returned instead

    Futures.promise(var guarantee)
        // Call all callbacks passed into `when` in the order they were received and pass result
        .fulfill(var result)
        // Returns immediately if the result is available, or as soon as it becomes available
        .when(function (result) {})
        // Call all errbacks passed into `fail` in the order they were received and pass error
        .smash(var error)
        //
        .fail(function (error) {})


Futures.promisify() -- wrap a function with a promisable
-------------------

This is a quick'n'dirty convenience method for creating a promisable from an existing function.

    var myFunc = function (url, data, callback, errback) {
    //                      0,    1,      2,      3
    //                      let promisify know the index
    //
        callback("Number five is alive!");
    };

    myFunc = Futures.promisify(myFunc, { "when": 2, "fail": 3 });

    myFunc(url, data) // now promisified
      .when(callback)
      .fail(errback);


See the getting started. TODO copy from Getting Started.


Futures.subscription() -- create a subscription object
----------------------

Subscriptions may be delivered or held multiple times

    Futures.subscription()
        // delivers `data` to all subscribers
        .deliver(data) 
        // receives `data` each time deliver is called
        // returns unsubscribe(); 
        .subscribe(callback);
        // notifies that the subscription is "on hold"
        .hold(error)
        // receives notification on failure
        .miss(errback)


Futures.subscribify() -- wrap a function with a subscribable
---------------------

    var myFunc = function (url, data, callback, errback) {
    //                      0,    1,      2,      3
    //                      let subscribify know the index
    //
        callback("Number five is alive!");
    };

    myFunc = Futures.subscribify(myFunc, { "when": 2, "fail": 3 });

    var unsubscribe = myFunc(url, data).subscribe(callback);
    var unmisscribe = myFunc(url, data).miss(errback);

** noConflict **

    var subscription;
    $.getJSON = Futures.subscribify($.getJSON, {"when":2}).noConflict(function (s) {
      subscription = s; // This is a synchronous callback
    });
    var unsubscribe = subscription.subscribe(func1);
    subscription..when(one_time_func);

    var xhr = $.getJSON(url, data);


Futures.subscrpition2promise() -- create a promise from a subscription
------------------------------

Pass in a subscription or subscribable and get back a promise. This is what Futures.join() uses internally to allow the joining of subscriptions.

    var promise = Futures.subscription2promise(subscription);


Futures.trigger() -- create an anonymous event listener / triggerer
-----------------

    var t = Futures.trigger();
    var mute = t.listen(callback1)
    var mute2 = t.listen(callback2);
    t.fire();

TODO chain mutes such that the last .listen returns all mutes?


Futures.join() -- create a promise joined from two or more promises / subscriptions
--------------

Joins return a promise which triggers when all joined promises (and subscriptions) have been fulfilled or smashed.

Join accepts both promises and subscriptions. One-time self-unsubscribing promises are generated automatically.

    Futures.join(promise1, promise2, subscription3);
        .when(function (result1, result2, result3) {
            // results returned in order
         });
    Futures.join([p1, p2, p3]);
        .when(function (p_arr) {
            // p_arr holds the results of [p1, p2, p3] in order
         });


Futures.synchronize() -- create a subscription synchronized with two or more subscriptions
---------------------

Synchronizations trigger each time all of the subscriptions have delivered or held at least one new subscription

If s1 were to deliver 4 times before s2 and s3 deliver once, the 4th delivery is used

    var s = Futures.synchronize(s1, s2, s3, ...);
    s.subscribe(function (r1,r2,r3) {
        // most recent results returned in order
    });
    s = Futures.synchronize([s1, s2, s3, ...]);
    s.subscribe(function (s_arr) {
        // s_arr holds the most recent results of [s1, s2, s3, ...]
    });


Futures.sequence() -- chain two or more asynchronous (and synchronous) functions
------------------

Instead of nesting callbacks 10 levels deep, pass callback instead.

Each next function receives the previous result and an array of all previous results

    Futures.sequence(function (callback) { callback("I'm ready."); })
        .then(function (callback, previousResult, index, [result0, result1, ...]) { callback("I'm here."); })


Futures.whilst() -- begin a "safe" loop with timeout, sleep, and max loop options
----------------

A breakable, timeoutable, asynchronous non-blocking while loop. 

Warning: this is too slow for long running loops (4ms+ intervals minimum)

    Futures.whilst(function (previousResult) {
            // expression may be something such as (i < 100)
            // letFinish = true will allow this iteration of the loop to finish 
            this.breakIf(expression, letFinish);
        }, {
            // You may control the length of runtime as well as the pause between loops here
            interval : 1, // how long to wait before executing the next loop. Due to "clamping" this is always >= 4ms,
            timeout : undefined, // forcefully break the loop after N ms
            maxLoops : undefined // forcefully break the loop after N iterations
        })
        .then(function (callback, previousResult, index, [result0, result1, ...]))
        .when(function (data) {})
        .breakNow(); // forcefully break the loop immediately

TODO allow asynchronous functions to exist in the loop

Futures.loop()
--------------

A breakable, timeoutable, asynchronous do loop. 

Warning: this is too slow for long running loops (4ms+ intervals minimum)
 
     Futures.whilst(function (previousResult) {
            // expression may be something such as (i < 100)
            // letFinish = true will allow this iteration of the loop to finish 
            this.until(expression, letFinish); // break when true
            this.whilst(expression, letFinish); // break when false
        }, {
            // You may control the length of runtime as well as the pause between loops here
            interval : 1, // how long to wait before executing the next loop. Due to "clamping" this is always >= 4ms,
            timeout : undefined, // forcefully break the loop after N ms
            maxLoops : undefined // forcefully break the loop after N iterations
        })
        .then(function (callback, previousResult, index, [result0, result1, ...])).then(...)
        .when(function (data) {}).when(...)
        .breakNow(); // forcefully break the loop immediately


Futures.sleep() -- Sleep for some number of ms
---------------

Not implemented yet


Futures.wait() -- Wait for some number of ms
--------------

Not implemented yet


Futures.watchdog() -- Create a watchdog which throws if not kept alive
------------------

Not implemented yet


Futures.log() -- log messages to the console
-------------

Uses console.log if available. does nothing otherwise.

    Futures.log("Info message.");


Futures.error() -- throw an error and log message
---------------

Throws an exception and uses console.log if available.

    Futures.error("Error Message");


Related Projects
================

  * [CommonJS Promises](http://wiki.commonjs.org/wiki/Promises)
  * [Strands](http://ajaxian.com/archives/javascript-strands-adding-futures-to-javascript)
  * [MSDN Promise](http://blogs.msdn.com/b/rbuckton/archive/2010/01/29/promises-and-futures-in-javascript.aspx)


Suggested Reading
=================

  * [Async Method Queues](http://www.dustindiaz.com/async-method-queues/)


Ideas for the future...
=======================

  * Futures.subscribe(func) should fire immediately if the data is available
  * A joiner that accepts multiple asyncs may be useful:


      // TODO create a joiner that accepts multiple asyncs and
      // (by params) either discards older data when it is received out of order
      // OR waits to deliver in order to keep order
      //
      // i.e. Futures.join(a1)
      //      // do stuff
      //      Futures.join(a2)
      //      // do stuff
      //      a2 comes back immediately. If it fires now, a1 is discarded.
      //      optionally it can wait for a1 and fire twice in the correct order.
      //      Futures.join(a3)
      //      a3 comes back and fires because a1 and a2 have already fired
      // the respond in the order 


  * Allow user to specify what to pass to a sequence rather than creating a function sequence(func, args_to_func, sequence_directive)
