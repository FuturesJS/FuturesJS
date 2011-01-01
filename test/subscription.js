(function () {
  "use strict";

  console.log("This is a visual test.");

  var Subscription = require(__dirname + "/../lib/subscription"),
    global_context = {
      color: 'yellow'
    },
    context = {
      color: 'red',
      handler: function (err, data) {
        console.log(err, data, this.color);
      }
    },
    // context is option and refers to what `this` will be
    subscription = Subscription(global_context);

  console.log('D 0 === ' + subscription.deliveryCount());
  console.log('S 0 === ' + subscription.callbackCount());
  console.log('true === ' + Subscription.isSubscription(subscription));
  
  subscription.whenever(context.handler);

  function testGlobalContext() {
    // timeout, undefined, yellow
    subscription.deliver(undefined, "hello world");
    console.log('D 1 === ' + subscription.deliveryCount());
  }

  function testTimeout() {
    // SubscriptionTimeout, undefined, yellow
    subscription.setTimeout(20);
  }

  function testLocalContext() {
    // undefined, hello world, red
    console.log('D 2 === ' + subscription.deliveryCount());
    subscription.removeCallback(context.handler);
    console.log('S 0 === ' + subscription.callbackCount());
    subscription.setTimeout(0); // turn off timeout
    subscription.whenever(context.handler, context);
    console.log('S 1 === ' + subscription.callbackCount());
    subscription.deliver(undefined, "hello world");
    console.log('D 3 === ' + subscription.deliveryCount());
  }

  function testOnetimer() {
    // undefined, hello world, green
    global_context.color = 'green';
    subscription.removeCallback(context.handler, context);
    console.log('S 0 === ' + subscription.callbackCount());
    subscription.when(context.handler);
    // 0 when asap is on, 1 when asap is off
    console.log('S 0 === ' + subscription.callbackCount());
    subscription.deliver(undefined, "hello world");
    console.log('D 4 === ' + subscription.deliveryCount());
  }

  function testAsap() {
    // undefined, hello world, blue
    global_context.color = 'blue';
    subscription.setAsap(true);
    subscription.whenever(context.handler);
    console.log('1 === ' + subscription.callbackCount());
  }

  // TODO
  // subscribers

  setTimeout(testGlobalContext, 0);
  setTimeout(testTimeout, 100);
  setTimeout(testLocalContext, 200);
  setTimeout(testOnetimer, 210);
  setTimeout(testAsap, 300);
}());
