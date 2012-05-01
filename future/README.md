Future
----

Creates a Future (aka Promise, Deferred, Subscription, Callback) object.

Installation
---

Node.JS (Server):

    npm install future

Ender.JS (Browser):

    ender build future

Usage
---

    var context = { "foo": "bar" }
      , Future = require('future')
      , future = Future.create(context)
      , err
      , message = "Hello World!"
      ;

    future.whenever(function (error, data) {
      if (error) {
        throw err;
      }
      console.log(this.foo + " says: " + data);
    });

    future.setTimeout(100);
    future.deliver(err, message);

Output:

    "bar says: Hello World"
    FutureTimeout: timeout 100ms
        at [object SomeObject]:x:y
        ...

API
---

Creates a Future (aka Promise, Deferred, Subscription, Callback) object.

**Core**

  * `Futures.future(globalContext=null)` - creates a `Future` object and uses `globalContext` as the default `this` for callbacks

  * `deliver(err, data, ...)` - Send a message (data) to all listeners (callbacks)

  * `fulfill([err, data, ...])` - Prevent the sending of any future messages. If arguments are passed they will be `deliver`ed.

  * `whenever(callback, [context])` - Listen to all messages, applying `context` if provided (passing `null` cancels `globalContext`)

  * `when(callback, [context])` - Listen one-time only, then `removeCallback` automatically

  * `setTimeout(ms)` - will sends a `FutureTimeout` error if no activity occurs within `ms`


**Accessory**

  * `errback(err)` - Useful for a peer-library requiring a method specifically for errbacks
    * i.e. `jQuery`'s `$.ajax`

  * `callback(data [, ...])` - Useful for a peer-library requiring a method which does not pass `err` as the first parameter
    * i.e. `jQuery`'s `$.ajax`

  * `removeCallback(callback, context=null)` - This callback and associated context will no longer receive messages

  * `setAsap(on=true)` - New listeners get existing data (if available) rather than waiting until the next delivery (default on)

  * `isFuture(obj)` - a best-effort guess as to whether or not an object is a Future

  * `callbackCount(callback, context)` - The number of listening callbacks

  * `deliveryCount(callback, context)` - The number of deliveries made

  * `hasCallback(callback, context=null)` - Returns `true` if the callback is listening


Example
---

    var context = { "foo": "bar" },
      future = Futures.future(context),
      err,
      message = "Hello World!";

    future.whenever(function (error, data) {
      if (error) {
        throw err;
      }
      console.log(this.foo + " says: " + data);
    });

    future.setTimeout(100);
    future.deliver(err, message);

Output:

    "bar says: Hello World"
    FutureTimeout: timeout 100ms
        at [object SomeObject]:x:y
        ...

