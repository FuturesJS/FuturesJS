
promisify and subscribify have been removed. There's a slight chance I'll add then once arguceptor works better.

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


