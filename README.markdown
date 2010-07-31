FuturesJS
=========

FuturesJS is a JavaScript library which (when used as directed) simplifies handling Callbacks, Errbacks, Promises, Subscriptions, Joins, Synchronization of asynchronous data, and Eventually Consistent data.

The long story: After watching the [Crockford lecture series](http://yuiblog.com/crockford) a few times some of the ideas started to sink in and I took a fresh new look at JavaScript. My immediate leap was to begin on [TriforceJS](http://github.com/coolaj86/triforce), but it was too much to bite off and chew all at once so I scrapped it temporarily and created Futures as a stepping-stone.

Getting Started
---------------

See the [Getting Started](http://coolaj86.github.com/futures/) GitHub page. 

Additionally test.html contains a number of (obviously) working examples. These can also be accessed live from the [computer in my closet](http://coolaj86.info/futuresjs/) - when it's on that is. If the tests ever aren't passing it's because I'm adding new features at that exact moment - I always pass before commit/push-ing. =8^D

Post questions, bugs, and stuff you want to share on the [(Google Groups) Mailing List](http://groups.google.com/group/futures-javascript)

Near-future TODOs
-----------------
  * Goal: Thu Jul 22nd - Copy `arguceptor()` from CopyCatJS for better subscribify directives.
  * Goal: Mon Jul 26th - Implement [**asynchronous method queue chaining**](http://www.dustindiaz.com/async-method-queues/) (aka Twitter Anywhere API underpinnings)
  * Goal: Thu Jul 29th - Document concrete **Use Cases** with Jekyll
  * Goal: Tue Aug 3rd - Implement function **currying / partials**
  * Please mail [the list](http://groups.google.com/group/futures-javascript) with feature requests.
  * I'll also be getting back to work on CopyCat, PURE in Reverse (ERUP), and finally tying it all together with Triforce

Loading FuturesJS
=================

Download the file `lib/futures.js` and include it in your application.

In a browser:
    <script src='lib/futures.js'></script>

In Node.js:
    node> var Futures = require('./lib/futures');

For Rhino you will need `env.js` as Futures utilizes `setTimeout` and its friends.

FYI: FuturesJS does pass JSLint regularly (but not every single commit)

API
=====

Futures.promise() -- create a chainable promise object
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

    var myFunc = function (url, data, callback, params) {},
    directive = [true, undefined, 'callback', { onError: 'errback', timeout: 'timeout'};
    // In this case `url` is always required, `data` is optional and may be omitted
    // `callback` must be the name of the placeholder for the callback
    // onError is the name of the param used as by the function and `errback` must be the name
    // timeout is similar

This is a quick'n'dirty convenience method for creating a promisable from an existing function.

    var myFunc = function (url, data, callback, errback) {
    //                      0,    1,      2,      3
    //                      let promisify know the index
    //
        callback("Number five is alive!");
    },
    directive = ['', {}, 'callback', 'errback']; // like {"when":2, "fail":3} in old api;
    myFunc = Futures.promisify(myFunc, directive);

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

Futures.subscription()(*unsubscribe*)()(*resubscribe*)()...
-----------------------------------------------------

It is possible to put a single subscription "on hold" by calling the anonymous `unsubscribe()` function which is returned.
The same subscription can be resumed by calling its return function. The cycle continues indefinitely.

    var s,
    unsubscribe,
    resubscribe;

    s = Futures.subscription();
    unsubcribe = s.subscribe(callback);
    resubscribe = unsubscribe();
    unsubscribe = resubscribe();


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

    // params is optional
    params = { 
      timeout : undefined // time in ms, undefined by default
    }

    Futures.join(promise1, promise2, subscription3, ..., params);
        .when(function (result1, result2, result3) {
            // results returned in order
         });
    Futures.join([p1, p2, p3, ...], params);
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

PROPOSED CHANGE: Is there a good use case for tracking the previousResults as an array? 
I think this should be simplified to

    .then(function(prevResult) {
        this.fulfill;
    });


Futures.whilst() -- begin a "safe" loop with timeout, sleep, and max loop options
----------------

A breakable, timeoutable, asynchronous non-blocking while loop. 

Warning: this is too slow for long running loops (4ms+ intervals minimum)

Note: The next loop iteration will not occur until `this.breakIf()` has been called.

    Futures.whilst(function (previousResult) {
            // breakIf *MUST* be called once per loop. It may be called asynchronously.
            // expression may be something such as (i < 100)
            // letFinish = true will allow this iteration of the loop to finish 
            this.breakIf(expression, letFinish);
        }, {
            // You may control the length of runtime as well as the pause between loops here
            interval : 1, // how long to wait before executing the next loop. Due to "clamping" this is always >= 4ms,
            timeout : undefined, // forcefully break the loop after N ms (cumulative; not per-loop)
            maxLoops : undefined // forcefully break the loop after N iterations
        })
        .then(function (callback, previousResult, index, [result0, result1, ...]))
        .when(function (data) {})
        .breakNow(); // forcefully break the loop immediately

Example: This loop will try to interate every 1ms, but it will return early (without incrementing the loop count) nearly 200 times before `this.breakIf()` is called. It will timeout after 1 second, before the break condition is true.

    var i = 0;
    Futures.whilst(function (previousResult) {
      var that = this;
      setTimeout(function () {
        i += 1;
        that.breakIf(5 < i);
      }, 200);
    }, {interval:1, timeout: 1000, maxLoops: 10});


TODO: consider iteration timeout vs cumulative timeout

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

Futures.asyncify() -- create an asynchronous function from a synchronous one
------------------

Given a syncback, returns a promisable - for all those times when you're depending on the order being unpredictable!

    // Given a syncback, returns a promisable function
    // `wait` is the number of ms before execution. If `true` it will be random between 1 - 1000ms
    // `context` is the object which should be `this`
    var async = Futures.asyncify(function (param1, param2, param3, ...) {
      return "Look how synchronous I am!";
    }, wait, context)

    // The returned function returns the `when` and `fail` methods after each call.
    async
      .when(callback)
      .fail(errback);


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
  * [MSDN Promise](http://blogs.msdn.com/b/rbuckton/archive/2010/01/29/promises-and-futures-in-javascript.aspx) - this was a direct influence for some of the features (immediates) I've added. The major drawback to this library is the licensing issue.


Suggested Reading
=================

  * [Async Method Queues](http://www.dustindiaz.com/async-method-queues/)


Long Term TODO
==============

API additions / fixes / changes that *will* happen
------------------------

  * Create tests for subscriptions which now accept subscribe(callback, errback) and update API
    * if(true === errback) {// subscribe callback as errback; set unsubscribe to unsubscribe both }
  * Implement subscription.stopUntilNextIssue(); subscription.stop(); subscription.resume();
    * This is for the case that the old issue is too out-of-date to deliver to new subscribers
  * Create an 'Interceptor' which uses a hash to determine how to promisify a function
  * Handle asynchronous calls in `whilst()`
    * return early from the iteration when breakIf() has not yet ping() / keepAlive()
    * set a default timout on each loop
  * Clean `sequence()`
    * use this.fulfill(returnVal) instead of passing in callback
    * simplify func(result, i, array) to func(result)

Ideas for the future...
-----------------------

  * Once CommonJS gets things figured out, become CommonJS compatible
  * Encourage users to post use cases on the wiki
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

Thoughts
========

I've seen a lot of libraries that use strings to name things.

    Model.extend('methodName', function () {
      return "immediate";
    });


    Event.add('eventName', function () {
      alert('Hoo-hoo! That tickles');
    });
    document.getElementById('poke_me').onClick = Event.fire('eventName');

Personally, I don't care much for it. For some reason it just seems bleh to me.
I'll probably add this sort of thing to Futures eventually, but I'm staying away from it for as long as I can.
Strings are inherently global. They can be accessed from any score.
I feel that using strings will eventually violate privacy and may shortcut / defeat sound architecture, which is something I see as a great advantage to this sort of functional design pattern.

