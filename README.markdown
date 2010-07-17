FuturesJS
=========

FuturesJS is a JavaScript library which (when used as directed) simplifies handling Callbacks, Errbacks, Promises, Subscriptions, Joins, Synchronization of asynchronous data, and Eventually Consistent data. It is akin to this well documented this MSDN library, but with a liberal MIT license.

Getting Started
---------------

See the [Getting Started](http://coolaj86.github.com/futures/) GitHub page. 

Additionally test.html contains a number of (obviously) working examples. These can also be accessed live from the [computer in my closet](http://coolaj86.info/futuresjs/) - when it's on that is.

Post questions, bugs, and stuff you want to share on the [(Google Groups) Mailing List](http://groups.google.com/group/futures-javascript)

Near-future TODOs
----
  * Allow a promise join to accept a subscription (and unsubscribe on completion)
  * Document the API in this readme and move remaining useful examples to the getting started
  * Create an 'Interceptor' which uses a hash to determine how to promisify a function
  * Once CommonJS gets things figured out, become CommonJS compatible
  * Encourage users to post use cases on the wiki

API
=====

New
-----

    // Instead of nesting callbacks 10 levels deep, pass the provided callback instead
    // Each next function receives the previous result and an array of all previous results
    Futures.sequence(function (callback) {})
        .then(function (callback, previousResult, index, [result0, result1, ...]) {})


    // A breakable, timeoutable, asynchronous while loop. 
    // Warning: this is too slow for long running loops (4ms+ intervals minimum)
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


    // A breakable, timeoutable, asynchronous while loop. 
    // Warning: this is too slow for long running loops (4ms+ intervals minimum)
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
  
Not as New
----------

    // Creates a promise object
    // If guarantee (optional) is passed, an immediate (an already fulfilled promise) is returned instead
    Futures.promise(var guarantee)
        // Call all callbacks passed into `when` in the order they were received and pass result
        .fulfill(var result)
        // Returns immediately if the result is available, or as soon as it becomes available
        .when(function (result) {})
        // Call all errbacks passed into `fail` in the order they were received and pass error
        .smash(var error)
        //
        .fail(function (error) {})


    // Subscriptions may be delivered or held multiple times
    Futures.subscription()
        // delivers `data` to all subscribers
        .deliver(data) 
        // receives `data` each time deliver is called
        // returns unsubscribe(); 
        .subscribe(func);
        // notifies that the subscription is "on hold"
        .hold(error)
        // receives notification on failure
        .miss(func)


    // Joins return a promise which triggers when all joined promises have been fulfilled or smashed
    Futures.join(p1, p2, p3);
        .when(function (r1, r2, r3) {
            // results returned in order
         });
    Futures.join([p1, p2, p3]);
        .when(function (p_arr) {
            // p_arr holds the results of [p1, p2, p3] in order
         });


    // Synchronizations trigger each time all of the subscriptions have delivered or held at least one new subscription
    // If s1 were to deliver 4 times before s2 and s3 deliver once, the 4th delivery is used
    var s = Futures.synchronize(s1, s2, s3, ...);
    s.subscribe(function (r1,r2,r3) {
        // most recent results returned in order
    });
    s = Futures.synchronize([s1, s2, s3, ...]);
    s.subscribe(function (s_arr) {
        // s_arr holds the most recent results of [s1, s2, s3, ...]
    });

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