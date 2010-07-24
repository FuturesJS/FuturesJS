---
layout: post
title: FuturesJS - Part 2
category: quickstart
updated_at: 'July 8th 2010'
---
Subscrptions, Triggers, and Synchroniztions
==============

[Last time](http://blog.coolaj86.info/2010/07/05/FuturesJS:-Promises,-Subscriptions,-Joins,-etc-for-JavaScript-Part-1) I explained promises and hopefully you saw how they can be instrumental for creating more dynamic ajax-ical magic while avoiding some of the lexical ugliness that often occurs with callback chaining.

What is a subscription?
-----------------------

Whereas *promises* may only be `fulfill()`ed once, subscriptions may be `deliver()`ed any number of times. FuturesJS implements the following methods for a subscription:

  - `Futures.subscription()` - returns a new subscription
    - `subscribe(func)` - accepts a callback which will be executed on each `deliver`y, **returns** unsubscribe. **Not chainable**
    - `deliver(data)` - accepts an *issue* of the data to pass to all `subscribe`rs
    - `miss(func)` - accepts an errback to be called at each `hold`
    - `hold(data)` - pass in the error data to be sent to all `miss`ers
    - `unsubscribe()` - returned by `subscribe(func)`, call this function to cancel the subscription


  Subscriptions are very similar to promises; here's a quick look:

    var myFuturific;

    (function () {
      var s = Futures.subscription();
      myFuturific = function (arg1, arg2) {
        var p = Futures.promise();
        var xhr = getAsyncData(arg1, arg2, s.deliver, {onError : s.hold, setTimeout : 5000});
        s.subscribe(p.fulfill);
        s.hold(p.smash);
        return p.passable();
      };
      myFuturific.subscribe = s.subscribe;
    }());

    // the same subscription is used for all calls of the function
    var unsubscribe = myFuturific.subscribe(callback1)
    myFuturific.hold(errback1);

    // a new promise belongs to each instance
    myFuturific()
      .when(callback2)
      .fail(errback2);

  Notice that the same subsciption will fire each time the function is called and that and the promises are only for specific instance:

Triggers anyone?
--------------

Words like `trigger`, `fire`, and `notify` are being thrown all over the place these days. If you're not familiar with those terms... I don't know why you're reading this blog... but just in case you're a little behind the times; JavaScript is event-driven and that means that instead of *polling* (yuck!) to know what's going on in your application you can *listen*.

For the DOM, [jQuery](http://jquery.com)'s `delegate()` is my favorite way handle events (I would also recommend looking into [JavaScriptMVC](http://javascriptmvc.com/)'s controller module).

The subscriptions in FuturesJS work decently as a poor-man's event trigger system - just `deliver()` without actually passing any data and she-bam, you've got an event trigger.  

    // Anonymous triggers - Ready, Aim... Fire!
    // TODO - commit this change to the repo on github
    Futures.trigger = function(ignore) {
      var s = subscription();
      return {
        listen: function(func) {
          return s.subscribe(func); // returns `unsubscribe()`
        }
        fire: function(ignore) {
          s.deliver();
          return this;
        },
      }
    }
    var t = Futures.trigger();
    t.listen(func1).listen(func2);
    t.fire();

    // TODO why not throw in named triggers with messages too?
    

How do I Subscribify an existing function?
------------------------------------------

"There's a func for that"(TM). 

`Futures.subscribify(func, directive)` is a hybrid of `Futures.promisify(func, directive)` and the example given at the top of this page. 

    var subscribable = Futures.subscribify(myFunc, { "when": 2, "fail": 3 });

>    NOTE: It isn't necessary to specify the directive
>    if myFunc has the methods .when() and .fail()

    // Pass in a duck-typed promisable
    var subscribable = Futures.subscribify(myFunc);
    

Of course, you can still work your own fancy black magic too. For that I'll refer you to the example above and Part 1 (where I talk about remember good ol' methods A, B, and C).

Drop-in subscribables with noConflict()
-------------------------

  You can can transparently subscribify a function which accepts the same parameters and returns the same results by calling `noConflict(syncback)` on the result.

  Let's consider `$.getJSON()` from jQuery as an example:

    var subscription;
    $.getJSON = Futures.subscribify($.getJSON, {"when":2}).noConflict(function (s) {
      subscription = s; // This is a synchronous callback
    });
    var unsubscribe = subscription.subscribe(func1);
    subscription..when(one_time_func);

    var xhr = $.getJSON(url, data);

>    IN PROGRESS: I'm working on an interceptor that can handle hash maps, such as $.ajax

What are synchronizations?
--------------------------

Whereas *joins* fire only once, *synchronizations* trigger each time the *subscribees* make a full round of *deliveries*. If one subscription delivers multiple times before the others deliver once, only the most recent delivery will be used.

    var z,
      unsubscribe;

    z = Futures.synchronize(s1, s2, s3);
    unsubscribe = z.subscribe(func);

>    TODO: only the most recent *successful* delivery should be used

>    TODO: allow a join to also accept a subscription

>    TODO: handle misses better
