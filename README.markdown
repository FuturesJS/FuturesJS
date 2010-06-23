# FuturesJS

## About
FuturesJS is a colletion of tools for function-level Promises, Futures, Subscriptions, and the like.

Note: Due to the nature of Document-Driven Development this documentation is more up to date than some of the code.


## Single Promises
    var p = Futures.promise(),
    timeout = setTimeout(function() {
      p.smash("Suxorz!");
    }, 10000),
    passable_promise;

    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
      { tags: "kitten", tagmode: "any", format: "json" },
      function(data){
        p.fulfill(data);
    });
    p.when(function(data) {
      clearTimeout(timeout);
    });
    p.fail(function(data) {
      alert("Timed out after 10 seconds with message '" + data + "'");
    });

    passable_promise = p.passable(); // Hide 'smash' and 'fulfill' methods
    passable_promise
      .when(function(data) { 
        data.items.slice(0,4).forEach(function(item,i,arr){
          $("<img/>").attr("src", item.media.m).css("height", "150px").appendTo("body");
        });
      })
      .fail(function(data){ alert('Failure Message 2') })
    ;

## Multiple Promises
Sometimes you have multiple promises which you would like to process in a particular order. Here's a joiner

    var p1 = Futures.promise(),
    p2 = Futures.promise(),
    p3 = Futures.promise(),
    j;

    j = Futures.join([p1, p2, p3]);
    j.when(function(arr) {
      setTimeout(function() {
        if ("Hello, World!" === arr.join('')) {
          $("#info").html($("#info").html() + "<br/> Joiner Passes <br/>");
        } else {
          throw new Error("Joiner Fails");
        }
      }, 3000);
    });

    p3.fulfill("World!");
    p1.fulfill("Hello");
    p2.fulfill(", ");


## Wrapping existing functions as promisables and subscribables
FuturesJS can wrap your functions in order to provide Futures and Subscriptions.
Since Promise can't guess the semantics of the parameters passed into your function, 
nor its results we provide two basic ways to wrap your functions.

### Simple argument-indexed wrapper
If your function has predictable argument order you can tell Promise the order and get back a wrapped function.
    var myFunc = function(arg0, arg1, callback, errback) {
      // do_stuff
    };

    myFunc = Futures.promisify(myFunc, { "when": 2, "fail": 3 });
    // the old callback and errback are now optional and handled correctly if present
    myFunc(arg0, arg1, [optional_callback], [optional_errback])
      .when(function(data){
        // I can now issue multiple callbacks with .when()
      })
      .fail(function(data){
        // I can now issue multiple errbacks with .fail()
      })
      .withResult(function(result){
        // passes in whichever result myFunc originally handed back
      });

TODO: Allow a map

### Custom wrapping a function
The simple argument-index wrapper provided with FuturesJS isn't adequate for an implementation like this:
    var myFunc = function(params) {
      // do_stuff
    }

Instead of 'myFunc' let's consider jQuery.ajax as a concrete example, which is called like this:

    $.ajax(settings);

And settings param might look something more like this:
    settings = {
      async: true,
      dataType: "jsonp",
      data: { more : 'params' },
      error: errback_func,
      success: callback_func
    }

In this more "complex" case you'll need to write your own wrapper so Promise can understand it.

The bonus part of this is that while you're wrapping the function, you might as well prettify 
the abstracted interface to be whatever you prefer it to be:
    // callback === fulfill, errback === smash
    var promisifiable = function (callback, errback) {
      return function() {
        // This is your interface. You can leave arguments as is,
        // or you can make it whatever you like
        var args = Array.prototype.slice.call(arguments),
        timeout,
        xhr;

        // jQuery.ajax has a timeout abstraction, but we'll create our own for example's sake.
        timeout = setTimeout(function() {
          // Crockford's promise doesn't cater to late-comers.
          // Once the timeout the call should be aborted for safety's sake.
          // If it were to succeed soon after it would throw.
          xhr.abort();
          errback("Timeout Failure");
        }, 30000);

        // Here we mangle the settings hash to our taste
        args[0]['error'] = errback;
        args[0]['success'] = function(data) {
          clearTimeout(timeout);
          callback(data);
        };
        xhr = $.ajax.apply($.ajax, args);
        return xhr;
      };
    }

Now you have a very customized implementation which Promise can easily understand:
    var myFunc = Futures.promisify(promisifiable, true); // TODO maybe 'custom' rather than true?
    myFunc({
      asnyc: true,
      dataType: "jsonp",
      data: { more : 'params' }
      //error: silently_ignored
      //success: silently_ignored
    })
      .when(function(data){
        // I can now issue multiple callbacks with .when()
      })
      .fail(function(data){
        // I can now issue multiple errbacks with .fail()
      })
      .withResult(function(result){
        // passes in whichever result myFunc originally handed back
      });

Note that in this case 'success' and 'error' are simply overwritten if it's in the params hash.
You could easily modify your implementation to cause them to be the first to execute.

### Further Customization
If you want to be more custom than either of the above wrappers allow
then you might as well just look at the source, copy, paste, and season to taste.

## Subscriptions
SEMI IMPLEMENTED

A low-level subscription
    var s = Futures.subscription(), timeout1, timeout2, passable_subscription;

    timeout1 = setTimeout(function() {
      s.miss("Missed this issue!");
    }, 10000);
    // Note: It's possible that there is a 0 time delay (i.e. abstracting local and web storage)
    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
      { tags: "kitten", tagmode: "any", format: "json" },
      function(data){
        clearTimeout(timeout1);
        s.deliver(data);
    });

    timeout2 = setTimeout(function() {
      s.miss("Missed that issue!");
    }, 10000)
    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?",
      { tags: "mitten", tagmode: "any", format: "json" },
      function(data){
        clearTimeout(timeout2);
        s.deliver(data);
    });
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


    s.subscribe(function(data) {
      clearTimeout(timeout);
    });
    s.fail(function(data) {
      alert("Timed out after 10 seconds with message '" + data + "'");

    function get_data() {
    }
    s.deliver("data"); // or s.issue("data");
    s.("data");


A higher-level subscribable
    var myfunc = Futures.subscribify(myfunc, params),
    unsubscribe;
    // NOTE there will also be an option to pass in a function
    // which delivers the subscription as a result immediately (synchronously)
    // this way it is possible for the original function to behave exactly as it did before,
    // but still trigger the subscription!
    /*
    var subscription, unsubscribe;
    Futures.subscribiy(myfunc, prams, function(s) {
      subscription = s;
    });
    // Don't freak out, this is guarunteed synchronous :D
    unsubscribe = subscription.subscribe(other_func);
    normal_result = myfunc();
    // this when applies to the most recently called
    subscription.when(func);
    */


    // As an object, subscribe is always accessible
    // Any time the function is called, the subscriber
    // is notified of the response
    unsubscribe = myfunc.subscribe(other_function);

    // As a function, when and fail are always accessible
    // For this call of the function the promisee is notified
    // of the result, but not for subsequent calls.
    myfunc(args)
      .when(callback)
      .fail(errback);

    unsubscribe();
