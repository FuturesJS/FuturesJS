TODO
==============

move TODOs to issues page

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

The long story: After watching the [Crockford lecture series](http://yuiblog.com/crockford) a few times some of the ideas started to sink in and I took a fresh new look at JavaScript. My immediate leap was to begin on [TriforceJS](http://github.com/coolaj86/triforce), but it was too much to bite off and chew all at once so I scrapped it temporarily and created Futures as a stepping-stone.


Near-future TODOs
-----------------
Due to some deadlines at my day job through september I won't work much on Futures.

  * Goal: November 1st - Document concrete **Use Cases** with Jekyll
  * Goal: November 15th - Implement function **currying / partials**
  * Please mail [the list](http://groups.google.com/group/futures-javascript) with feature requests.
  * I'll also be getting back to work on [CopyCat](http://github.com/coolaj86/copycat), PURE in Reverse (ERUP), and finally tying it all together with Triforce
