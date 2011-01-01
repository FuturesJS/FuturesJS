FuturesJS v2.x
====

  [Documentation for Futures v1.x](https://github.com/coolaj86/futures/tree/v1.0)

FuturesJS is a JavaScript library which (when used as directed) simplifies Asynchronous Programming (aka Callbacks & Errbacks).

  * Futures - aka Promises, Deferreds, Subscriptions
  * Joins - Synchronization of multiple Futures and asynchronous / eventually consistent data
  * Events - (using [Node.JS](http://nodejs.org)'s [EventEmitter](http://nodejs.org/docs/v0.2.6/api.html#eventemitter-13), modified for browser use)
  * Sequences - Chains of chronological callbacks
  * Asynchronous Method Queues - Think Twitter Anywhere API

Installation
====

**Browser**

    <script src='release/futures.all.js'></script>
    var Futures = require('futures'); // comes with thin require wrapper

**Node.JS**

    npm install futures # v2.0 not yet available

or

    git clone https://github.com/coolaj86/futures.git
    cd futures
    git checkout v2.0
    cp -a ./lib ~/.node_libraries/futures

**Rhino / Ringo / etc**

    You'll probably need `env.js`. Shoot me a message and we'll figure it out.

API
====

`future`, `join`, `sequence`, `loop`, `emitter`

Futures.future([globalContext])
----

Creates a Future (aka Promise, Deferred, Subscription, Callback) object.

**Core**

  * `Futures.future(globalContext=null)` - creates a `Future` object and uses `globalContext` as the default `this` for callbacks

  * `deliver(err, data, ...)` - Send a message (data) to all listeners (callbacks)

  * `fulfill(err, data, ...)` - `deliver` and then prevent the sending of any future messages

  * `whenever(callback, [context])` - Listen to all messages, applying `context` if provided (passing `null` cancels `globalContext`)

  * `when(callback, [context])` - Listen one-time only, then `removeCallback` automatically

  * `setTimeout(ms)` - will sends a `FutureTimeout` error if no activity occurs within `ms`

Note: A callback cannot be added multiple times.


**Accessory**

  * `errback(err)` - Pass this when the peer-library requires a method specifically for errbacks (i.e. `jQuery`'s `$.ajax`)

  * `callback(data [, ...])` - Pass this when the peer-library requires a method which does not pass `err` as the first parameter (i.e. `jQuery`'s `$.ajax`)

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

Futures.join(globalContext)
----

Creates a Future-ish object for the purpose of synchronizing other Futures.

**Core**

  * `Futures.join(context=null)` - create a Future and modifies it
  * `add(future [, ...] | Array)` - add single, multiple, or an array of Futures which to join
  * `isJoin` - a best-effort guess as to whether or not an object is a Join
  * **Removed Methods**: `deliver`, `fulfill`

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

    join.when(function (err, f0Args, f1Args, f2Args) {
      console.log(f1Args[1], f2Args[1], f3Args[1], f2Args[2]);
    });

Futures.sequence()
----

Creates an Asynchronous Stack which execute each enqueued method after the previous function calls the provided `next(err, data [, ...])`.

**Core**

  * `then(next, err, data [, ...])` - Start the domino effect by popping the first 

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
      })
      .begin();

Futures.chainify()
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

    Contacts.all({user: "coolaj86", password: "secret"}).limit(30).render();

The code to produce such a model might look like this:

    var Contacts,
      providers,
      modifiers,
      consumers;

    // Get resources from various sites
    providers = {
      facebook: function (next, credentials, params) {
        var future = Futures.future();
        // make async calls to get data
        next(err, data);
      },
      twitter: function (next, credentials, params) {
        // same as above
      },
      all: function (next, credentials, params) {
        var join = Futures.join();
        join.add([
          providers.FacebookContacts(credentials, params),
          providers.TwitterContacts(credentials, params)
        ]);
        join.when(next);
      }
    };

    modifiers = {
      limit: function(next, err, data) {
        next(err, data);
      }
    };

    consumers = {
      display: function (err, data) {
        Template.render(data);
      }
    };

    Contacts = Futures.chainify(providers, modifiers, consumers);
