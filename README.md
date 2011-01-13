FuturesJS v2.x
====

###################################################################################
#
#

Futures 2.0 **Beta**

Mailing List: [Google Groups FuturesJS](https://groups.google.com/forum/#!forum/futures-javascript)

[Documentation for Futures v1.x](https://github.com/coolaj86/futures/tree/v1.0)

#
#
###################################################################################



FuturesJS is a JavaScript library which (when used as directed) simplifies Asynchronous Programming (aka Callbacks & Errbacks).

  * **Futures** - aka Promises, Deferreds, Subscriptions
  * **Joins** - Synchronization of multiple Futures and asynchronous / eventually consistent data
  * **Events** - (using [Node.JS](http://nodejs.org)'s [EventEmitter](http://nodejs.org/docs/v0.2.6/api.html#eventemitter-13), modified for browser use)
  * **Sequences** - Chains of chronological callbacks
  * **Asynchronous Method Queues** - Think Twitter Anywhere API
  * **Asynchronous Models**

Weighs in at a mere 5.9K when Minified, Uglified, and Packed

Installation
====

**Browser**

Requires JSON and ES5 support (libraries provided for legacy browsers)

    <script src='vendor/json2.js'></script>
    <script src='release/futures.all.js'></script>
    var Futures = require('futures'); // comes with thin require wrapper

**Node.JS**

    npm install futures # v2.0 not yet available

or

    git clone https://github.com/coolaj86/futures.git
    cd futures
    git checkout v2.0
    cp -a ./lib ~/.node_libraries/futures

**npm dependency** `package.json`:

    "dependencies"  : { "futures": ">=1.9.0" },

**Rhino / Ringo / etc**

You'll probably need `env.js`. Shoot me a message and we'll figure it out.

How FutureJS will get you more dates
====

Futures isn't a framework perse, but it does make building a beautiful API dirt simple.

Think this is sexy?

    Contacts.all({httpAuth: base64("coolaj86:secret"}).limit(30).render();
    // all - makes request to two servers to get contacts
    // limit - takes the first 30 contacts
    // render - some function to render the contacts

So do the ladies. Now read up on the API.

API
====

`asyncify`, `chainify`, `emitter`, `future`, `join`, `loop`, `sequence`

future()
----

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

**Example:**

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

join()
----

Creates a Future-ish object for the purpose of synchronizing other Futures.

**Core**

  * `Futures.join(globalContext=null)` - create a Future and modifies it
  * `add(future [, ...] | Array)` - add single, multiple, or an array of Futures which to join
  * `isJoin` - a best-effort guess as to whether or not an object is a Join

**Inherited-ish**

  * `when` - see `Future.future().when`
  * `whenever` - see `Future.future().whenever`

Note: All `add(future)`s must be done before calling `when` or `whenever` on the join object.

**Example:**

    var join = Futures.join(),
      fs = [
        Futures.future(),
        Futures.future(),
        Futures.future()
      ],
      e;

    setTimeout(function () { fs[1].deliver(e, "World"); }, 100);
    setTimeout(function () { fs[0].deliver(e, "Hi"); }, 300);
    setTimeout(function () { fs[0].deliver(e, "Hello"); }, 500);
    setTimeout(function () { fs[2].deliver(e, "!", "!"); }, 700);

    join.add(futures);
    // or join.add(fs[0], fs[1], fs[2]);
    // or join.add(fs[0]).add(fs[1]).add(fs[2]);

    join.when(function (f0Args, f1Args, f2Args) {
      console.log(f1Args[1], f2Args[1], f3Args[1], f2Args[2]);
    });


sequence()
----

Creates an Asynchronous Stack which execute each enqueued method after the previous function calls the provided `next(err, data [, ...])`.

**Core**

  * `Futures.sequence(globalContext=null)`
  * `then(next, err, data [, ...])` - add a method onto the queue
    * begins or resumes the queue
    * passes the results of the previous function into the next

**Example:**

    var sequence = Futures.sequence(),
      err;

    sequence
      .then(function (next) {
        setTimeout(function () {
          next(err, "Hi", "World!");
        }, 120);
      })
      .then(function (next, err, a, b) {
        setTimeout(function () {
          next(err, "Hello", b);
        }, 270);
      })
      .then(function (next, err, a, b) {
        setTimeout(function () {
          console.log(a, b);
          next();
        }, 50);
      });


chainify()
----

Creates an asynchronous model using asynchronous method queueing.

**Core**

  * `Futures.chainify(providers, modifiers, consumers, context)` - creates an asynchronous model
    * `providers` - methods which provide data - must return Futures or Joins
      * `function (next, params)` must call `next`

    * `modifiers` - methods which use provided data and modify it - act as Sequences
      * `function (next, err, data [, ...])` must call `next`

    * `consumers` - methods which use data without modifying it - act as simple callbacks
      * `function (err, data [, ...])`

Note: `next` is an instance of `Futures.deliver`

**Example:**

Let's say we want to produce a model which acts like this:

    Contacts.all({httpAuth: base64("coolaj86:secret")}).limit(30).render();

The code to produce such a model might look like this:

    var Contacts,
      providers,
      modifiers,
      consumers;

    // Get resources from various sites
    providers = {
      facebook: function (next, params) {
        var future = Futures.future();
        // make async calls to get data

        // probably best to handle errors
        // and not pass them on
        next(data);
      },
      twitter: function (next, params) {
        // same as above
      },
      all: function (next, params) {
        var join = Futures.join();
        join.add([
          providers.FacebookContacts(params),
          providers.TwitterContacts(params)
        ]);
        join.when(next);
      }
    };

    modifiers = {
      limit: function(next, data, params) {
        data = data.first(params);
        next(data);
      }
    };

    consumers = {
      display: function (data, params) {
        Template.render(data, params);
      }
    };

    Contacts = Futures.chainify(providers, modifiers, consumers);


loop()
----

Creates a "safe" asynchronous loop.

**core**

  * `Futures.loop(context=null)` - creates a loop object
  * `run(function (next), seed [, ...])` - Start the loop
    * `next = function (err, data [, ...]) {}`
      * `next("break")` will break the loop
    * `seed` - the data to start with

  * `setTimeout(ms)` - Kill the loop if it runs for `ms`
  * `setMaxLoop(count)` - Kill the loop if it continues `count+1` times
  * `setWait(ms)` - Wait at least `ms` before looping again (Browser minimum is 4ms, even if 0 is set)

Note: In a browser each loop will be at least 4ms apart.

**Example:**

    var loop = Futures.loop();

    loop.setTimeout(1000);
    loop.setMaxLoop(20);

    loop.run(function (next, err, data) {
      if (data == 4) {
        next("break");
      }
      data += 1;
      next(undefined, data);
    }, 0);


emitter()
----

See [Node.JS#EventEmitter](http://nodejs.org/docs/v0.2.6/api.html#eventemitter-13) for full documentation.

**Core**

  * `on(event, callback)` - registers a callback with a listener
  * `emit(event, data [, ...])` - sends `data [, ...]` to all listeners
  * `emit("error", err)` - Throws `err` if no "error" listeners are present.

**Example:**

    var emitter = Futures.emitter();

    emitter.on("error", function (err) {
      throw err;
    });

    emitter.on("data", function (data) {
      console.log(JSON.stringify(data));
    });

    emitter.emit("data", "Hello World!");
    emitter.emit("error", new Error("Goodbye Cruel World..."));


asyncify()
----

  * `doStuff = Futures.asyncify(doStuffSync)` - returns a fuction with the same signature which catches errors and returns a future rather than the synchronous data.

**Example:**

    function doStuffSync = function (params) {
      throw new Error("Error of some sort");
      return "Hello";
    }

    var doStuff = Futures.asyncify(doStuffSync);

    doStuff.whenever(function (err, data) {
      console.log(err, data);
    });

    doStuff();
    doStuff();
    doStuff().when(function (err, data) {
      if (err) {
        throw err;
      }
      console.log(data);
    });
