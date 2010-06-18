# PromiseJS

## About
PromiseJS is a colletion of tools for function-level Promises, Futures, Subscriptions, and the like.

Note: Due to the nature of Document-Driven Development this documentation is more up to date than some of the code.


## Examples
    var p = make_promise(),
    timeout = setTimeout(function() {
      p.smash("Suxorz!");
    }, 10000),
    passable_promise;

    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?tags=kitten&tagmode=any&format=json&jsoncallback=?",
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

## Wrapping your functions as promisables and subscribables
PromiseJS can wrap your functions in order to provide Futures and Subscriptions.
Since Promise can't guess the semantics of the parameters passed into your function, 
nor its results we provide two basic ways to wrap your functions.

### Simple argument-indexed wrapper
If your function has predictable argument order you can tell Promise the order and get back a wrapped function.
    var myFunc = function(arg0, arg1, callback, errback) {
      // do_stuff
    };

    myFunc = promisify(myFunc, { "when": 2, "fail": 3 });
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

### Custom wrapping a function
The simple argument-index wrapper provided with PromiseJS isn't adequate for an implementation like this:
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
    var myFunc = promisify(promisifiable, true); // TODO maybe 'custom' rather than true?
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
