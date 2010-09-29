FuturesJS
=========

FuturesJS is a JavaScript library which (when used as directed) simplifies handling Callbacks, Errbacks, Promises, Subscriptions, Joins, Chains, Sequences, Asynchronous Method Queues, Synchronization of asynchronous data, and Eventually Consistent data.

The long story: After watching the [Crockford lecture series](http://yuiblog.com/crockford) a few times some of the ideas started to sink in and I took a fresh new look at JavaScript. My immediate leap was to begin on [TriforceJS](http://github.com/coolaj86/triforce), but it was too much to bite off and chew all at once so I scrapped it temporarily and created Futures as a stepping-stone.

Getting Started
---------------

See the [Getting Started](http://coolaj86.github.com/futures/) GitHub page. 

Additionally test.html contains a number of (obviously) working examples. These can also be accessed live from the [computer in my closet](http://coolaj86.info/futuresjs/) - when it's on that is. If the tests ever aren't passing it's because I'm adding new features at that exact moment - I always pass before commit/push-ing. =8^D

Post questions, bugs, and stuff you want to share on the [(Google Groups) Mailing List](http://groups.google.com/group/futures-javascript)

Updates
-------

  * Aug 21st: Non-backwards-compatible API change to join() and synchronize() to work better with Node.js and other frameworks.

Near-future TODOs
-----------------
Due to some deadlines at my day job through september I won't work much on Futures.

  * Goal: November 1st - Document concrete **Use Cases** with Jekyll
  * Goal: November 15th - Implement function **currying / partials**
  * Please mail [the list](http://groups.google.com/group/futures-javascript) with feature requests.
  * I'll also be getting back to work on [CopyCat](http://github.com/coolaj86/copycat), PURE in Reverse (ERUP), and finally tying it all together with Triforce

Loading FuturesJS
=================

Download the file `lib/futures.js` and include it in your application.

In a browser:

    <script src='lib/futures.js'></script>

In Node.js:

    npm install futures@0.9.0
    node> var Futures = require('./lib/futures');

For Rhino you will need `env.js` as Futures utilizes `setTimeout` and its friends.

FYI: FuturesJS does pass JSLint regularly (but not every single commit)

API
=====

Overview
--------

`asyncify`, `chainify`, `join`, `loop`, `promise`, `promisify`, `sequence`, `subscription`, `subscription2promise`, `subscribify`, `synchronize`, `trigger`, `whilst`

Futures.chainify(providers, consumers, context, params) / Futures.futurify()
---------------

Asynchronous method queueing allows you to chain actions on data which may or may not be readily available.
This is how Twitter's @Anywhere api works.

You might want a model which remotely fetches data in this fashion:

    Contacts.all(params).randomize().limit(10).display();
    Contacts.one(id, params).display();

Which could be implemented like so:

    var Contacts = Futures.chainify({
      // Providers must be promisables
      all: function(params) {
        var p = Futures.promise();
        $.ajaxSetup({ error: p.smash });
        $.getJSON('http://graph.facebook.com/me/friends', params, p.fulfill);
        $.ajaxSetup({ error: undefined });
        return p.passable();
      },
      one: function(id, params) {
        var p = Futures.promise();
        $.ajaxSetup({ error: p.smash });
        $.getJSON('http://graph.facebook.com/' + id, params, p.fulfill);
        $.ajaxSetup({ error: undefined });
        return p.passable();
      }
    },{
      // Consumers will be called in synchronous order
      // with the `lastResult` of the previous provider or consumer.
      // They should return either lastResult or a promise
      randomize: function(data, params) {
        data.sort(function(){ return Math.round(Math.random())-0.5); // Underscore.js
        return Futures.promise(data); // Promise rename to `immediate`
      },
      limit: function(results, n, params) {
        var data = results[0]; // array of args
        
        data = data.first(n); // underscore's limit function
        return Futures.promise(data);
      },
      display: function(data, params) {
        var data = results[0];

        $('#friend-area').render(directive, data); // jQuery+PURE
        // always return the data, even if you don't modify it!
        // otherwise your results could be unexpected

        return data;
      }
    });

Things to know:

  * `providers` - promisables which return data
  * `consumers` - functions which use and or change data
    * the first argument must be `data`
    * when returning a promisable the next method in the chain will not execute until the promise is fulfilled
    * when returning a "literal object" the next method in the chain will use that object
    * when returning `undefined` (or not returning anything) the next method in the chain will use the defined object
  * `context` - `apply()`d to each provider and consumer, thus becoming the `this` object
  * `params` - reserved for future use

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


Futures.promisify(func, directive, params) -- wrap a function with a promisable
-------------------

`promisify()` uses [CopyCatJS](http://github.com/coolaj86/copycat)'s `arguceptor()` to  wrap `func` according to the `directive`.
The directive tells promisify enough about `func` to swap out `callback` for `when` and `errback` for `fail`

Example:

    var myFunc = function (url, data, callback, params) {},
    directive = [true, {}, 'callback', { onError: 'errback', timeout: 'timeout' };
    var pFunc = Futures.promisify(myFunc, directive);
    pFunc('myblag.com', {post_id: 5}, undefined, { retry: '5'  } )
      .when(callback)
      .fail(errback);

In this case:

  * `url` is always required
  * `data` is optional and will be omitted if arguments[1] isn't type 'object'
  * `callback` is the name required by Futures to assign to `when`
  * `onError` is the arbitrary name of the param used as by `myFunc`
  * `'errback'` is the name used by Futures to assign to `fail` if present
  * `timeout` is the arbitrary name as used by `myFunc`
  * `'timeout'` is the name used by Futures to assign to the internal `timeout` if present

The full set of directives operate as follows:

  * Specific to FuturesJS
    * `'callback'` - this argument must always be given and represents `when`
    * `'errback'` - this argument may will be assumed to always be present if given
    * `'timeout'` - overrides the default timeout given in params

  * [CopyCatJS](http://github.com/coolaj86/copycat) directives which specify that an argument will not be optional
    * `true` - an argument with this substitute will always be required and ignored
    * `'arbitrary_name_here'` - ignored by FuturesJS, excepting the 3 above

  * [CopyCatJS](http://github.com/coolaj86/copycat) directives which specifiy that an agument will be optional
    * false - an optional boolean argument
    * 0 - an optional int argument
    * '' - an optional string argument
    * [] - an optional array argument
    * {} - an optional params argument
    * `function(){}` - an optional function argument
    * `undefined` - an optional wildcard argument (checked by position rather than type)
    * `null` - same as undefined

**Deprecated:**

This is a quick'n'dirty convenience method for creating a promisable from an existing function.

    var myFunc = function (url, data, callback, errback) {
    //                      0,    1,      2,      3
    //                      let promisify know the index
    //
        callback("Number five is alive!");
    },
    directive = {"when":2, "fail":3};
    myFunc = Futures.promisify(myFunc, directive, params);

    myFunc(url, data) // now promisified
      .when(callback)
      .fail(errback);

TODO update the Getting Started.


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
            var arg0, arg1, arg2;
            arg0 = result1[0];
            arg1 = result1[1];
            arg2 = result1[2];
            // Each result is the arguments array of the results of the promise
         });
    Futures.join([p1, p2, p3, ...], params);
        .when(function (result_array) {
            // result_array holds an array of argument arrays for [p1, p2, p3] in order
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

Instead of nesting callbacks 10 levels deep, pass `fulfill` instead.

Each next function receives the previous result and an array of all previous results

    Futures.sequence(function (fulfill) {
          // fulfill is Futures.promise().fulfill

          fulfill("I'm ready.");
        })
        .then(function (fulfill, ready) {
          // ready === "I'm ready."

          fulfill(ready, "... and waiting");
        })
        .then(function (fulfill, ready, waiting) {
          // ready === "I'm ready."
          // waiting === "... and waiting"
        
          // this being the last in the sequence, `fulfill` is optional
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

  * [Narwal Promises](http://github.com/kriskowal/narwhal-lib/blob/master/lib/narwhal/promise-util.js)
  * [MSDN Promise](http://blogs.msdn.com/b/rbuckton/archive/2010/01/29/promises-and-futures-in-javascript.aspx)
    * The major drawback to this library is the licensing issue.
  * [Dojo Promises](http://docs.dojocampus.org/dojo/Deferred)
  * [Strands](http://ajaxian.com/archives/javascript-strands-adding-futures-to-javascript)
  * [JavaScript API for E-based promises](http://waterken.sourceforge.net)
  * [E promises](http://www.skyhunter.com/marcs/ewalnut.html#SEC20)


Suggested Reading
=================

  * [CommonJS Promises](http://wiki.commonjs.org/wiki/Promises)
  * [Async Method Queues (Twitter Anywhere API)](http://www.dustindiaz.com/async-method-queues/)


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

