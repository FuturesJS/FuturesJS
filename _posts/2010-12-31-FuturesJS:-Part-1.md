---
layout: post
title: FuturesJS - Part 1
category: quickstart
updated_at: 'July 5th 2010'
---
Promises, Immediates, and Joins
============


What is a Promise?
-----------------

A promise (as per [Douglas Crockford](http://www.google.com/search?client=ubuntu&channel=fs&q=yuiblog.com%2Fcrockford&ie=utf-8&oe=utf-8)) is (essentially) a chainable callback object with the following methods:

  - Futures.promise(_[guarantee]_) - returns a promise object
    - `when()` - pass in a function which accepts a data parameter
    - `fulfill()` - pass in a single data parameter which will be sent to all `when`ers once
    - `fail()` - pass in a function which accepts an error parameter
    - `smash()` - pass in a single error parameter which will be sent to all `fail`ers once


Chainable means that the object returns itself so these methods can be called in sequence. A normal callback function might look like this:

    var xhr = getAsyncData(arg1, arg2, callback, {onError : errback, setTimeout : 5000});

To use a promise with such a function you would do something like this:

    var p = Futures.promise(),
    xhr = getAsyncData(arg1, arg2, p.fulfill, {onError : p.fail, setTimeout : 5000});
    p.when(callback1)
     .when(callback2)
     .when(callback3)
     .fail(callback4);

What are Immediates (Guarantees)?
---------------------------------

Immediates (guarantees) are promises which are guaranteed to be fulfilled because they are immediately fulfilled. FuturesJS provides a shortcut method for just this case.

    var p = promise('pass in the data');

Or if you prefer the "long" way:

    var p = promise().fulfill('pass in the data').passable();


How do I Promisify my existing functions?
-----------------------------------------

  For simple cases you can just use "promisify":

    // this is the quick'n'dirty convenience method
    var myFunc = function (url, data, callback, errback) {
                        //  0,    1,      2,      3
                        //  let promisify know the index
    };
    myFunc = Futures.promisify(myFunc, { "when": 2, "fail": 3 });
    myFunc(url, data) // now promisified
      .when(callback)
      .fail(errback);

>    TODO allow a nested map of attributes as well
>    something like
>     ["true", "optional", "when", {"timeout":"fail", "error":"fail"}]

 But if you're a little more do-it-yourself-y, you can promisify a function in a number of ways:

  A) return an object with the `when()` and `fail()` methods

    function getAsyncData(param1, param2) {
        var p = Futures.promise(),
        result = oldGetAsyncData(arg1, arg2, p.fulfill, {onError : p.smash, setTimeout : 5000});
        // Implements a synchronous callback to hand back the original data
        p.withResult = function(func) {
            func(result); // XMLHTTPRequest object is the result in this case
        }
        return p;
    }
    var xhr;
    getAsyncData(param1, param2)
        .withResult(function (r) {
            xhr = r;
        })
        .when(doStuff)
        .when(doMoreStuff)
        .fail(undoStuff);
    if (i_change_my_mind) {
        xhr.abort();
    }

  B) allow a promise to be passed instead of a callback or returned with a synchronous callback.

    function getAsyncData(param1, param2, p) {
        return oldGetAsyncData(arg1, arg2, p.fulfill, {onError : p.smash, setTimeout : 5000});
    }
    var promise = Futures.promise(),
    xhr;
    xhr = getAsyncData(param1, param2, promise);
    promise
        .when(doStuff)
        .when(doMoreStuff)
        .fail(undoStuff);
    if (i_change_my_mind) {
        xhr.abort();
    }

  C) pass back a promise as a synchronous callback

    function getAsyncData(param1, param2, promiseback) {
        var p = Futures.promise();
        return oldGetAsyncData(arg1, arg2, p.fulfill, {onError : p.smash, setTimeout : 5000});
    }
    var promise,
    xhr;
    xhr = getAsyncData(param1, param2, function (p) {
        promise = p;
    });
    promise
        .when(doStuff)
        .when(doMoreStuff)
        .fail(undoStuff);
    if (i_change_my_mind) {
        xhr.abort();
    }

  Where many functions allow only one callback, a promise allows you to enlist multiple callbacks before and after the target function has been called. FuturesJS provides convenience functions for you to wrap existing functions via `promisify()` (method A) and `noConflict()` (method C).

What are Joins?
---------------

  A join is a special type of promise which allows you to get the results of multiple promises once all of them have completed or failed.

    // Futures.join(p1, p2, p3, ..., pN)
    Futures.join(p1, p2, p3) // There is no limit to how many promises you pass in
        .when(function (p_arr) {
            // p_arr[0] is the result of p1
            // p_arr[N-1] is the result of pN
        })
        .fail(function (p_arr) {
            // at least one of the promises was smashed
            // you'll have to discover which on your own
        });

>    TODO: allow a join to also accept a subscription
>    In writing jaysyncunit I realized that this is useful to do

Recap: Why is this useful?
--------------------------

  I have two main use cases:

  * Client-side Caching in Memory - you may be using some sort of eventual consistency already have the data the user wants (fresh), you may have an older version of the data (stale), or the data you have is too old or non-existant (useless). Using a promise you can always promise that the data will be available, without worrying about when it will be available. If it's available now it is essentially a synchronous callback. If it's available later, it may take time.
  * Mashups - You need to get datasets from multiple sources (facebook, twitter, flickr, amazon, google maps, etc) and run sort of transformation on the combination of that data before presenting it to the user.

If you're lucky I'll write some psuedo-code for these examples in Part 2.

Hang around and I'll explain more about subscriptions and other fun stuff. 
