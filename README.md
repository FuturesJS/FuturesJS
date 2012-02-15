FuturesJS v2.x
====

###################################################################################
#
#

Futures 2.x - A JavaScript flow-control library*


#
#
###################################################################################



FuturesJS is a JavaScript library which (when used as directed) simplifies the flow-control of asynchronous programming (aka Callbacks & Errbacks).

  * **Futures** - aka Promises, Deferreds, Subscriptions
  * **Joins** - Synchronization of multiple Futures and asynchronous / eventually consistent data
  * **Asynchronous ForEach** - an ordered, asynchronous `ForEachAsync` implementation available as a prototype or standalone
  * **Events** - (using [Node.JS](http://nodejs.org)'s [EventEmitter](http://nodejs.org/docs/v0.2.6/api.html#eventemitter-13), modified for browser use)
  * **Sequences** - Chains of chronological callbacks
  * **Asynchronous Method Queues** - Think Twitter Anywhere API
  * **Asynchronous Models**

Weighs in at mere 3.5K when [Uglified](https://github.com/mishoo/UglifyJS) (minified) and gzipped.

**Note**: Using `packer` results in insignificantly smaller size, but results slower and more CPU-intensive page loads

*Futures one of the most-watched JavaScript flow-control library on Github (see [2.no.de](http://2.no.de/#flow-control). I'm shamelessly taking bragging rights for that. =8^D

  * [Stack Overflow](http://stackoverflow.com/questions/3249646/client-side-javascript-to-support-promises-futures-etc/3251177#3251177)
  * [InfoQ: How to Survive Asynchronous Programming in JavaScript](http://www.infoq.com/articles/surviving-asynchronous-programming-in-javascript)
  * [JavaScript Jabber: Asynchronous Programming](http://javascriptjabber.com/001-jsj-asynchronous-programming/)

Installation
====

As of 2.2.0 `futures` is a stub package which lists a number of submodules

**Pakmanager (browser)**

    npm init
    # list `futures` in `browserDependencies` 
    # or individually list `join`, `forEachAsync`, etc in `browserDependencies`
    pakmanager build

    <script src='pakmanaged.js'></script>

**NodeJS**

    npm install futures Array.prototype.forEachAsync

    # or individually
    npm install future join sequence chainify asyncify forEachAsync loop Array.prototype.forEachAsync

or

    git clone https://github.com/coolaj86/futures.git
    cd futures
    git checkout v2.0
    cp -a ./futures ~/.node_libraries/futures

**npm dependency** `package.json`:

    "dependencies"  : { "futures": ">=2.1.0" },

**Browser (without Ender.JS)**

Requires JSON and ES5 support (libraries provided for legacy browsers)

    <script src='vendor/json2.js'></script>
    <script src='vendor/persevere/global-es5.js'></script>
    <script src='release/futures.ender.js'></script>
    <script>
        var Futures = require('futures') // uses `ender.js` for SSJS / Browser compatibility layer
          , EventEmitter = require('events.node').EventEmitter // taken directly from Node.JS
          ;
    </script>

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

`asyncify`, `chainify`, `future`, `join`, `loop`, `sequence`, `forEachAsync`

See the documentation for each in the individual folders.

`join`, `forEachAsync`, and `sequence` are probably what you're most interested in handling serial and parallel callbacks.

`chainify` is what you're interested in if you want to create a beautiful API.

EventEmitter
===

No event library is complete without an Event Emitter.

In conjunction with FuturesJS, I recommend using [Node.JS#EventEmitter](http://nodejs.org/docs/latest/api/events.html#events.EventEmitter), which is available in `npm` as `events.node` for browser use.

Old Docs
===

Documentation for [Futures v1.x](https://github.com/coolaj86/futures/tree/v1.0)
