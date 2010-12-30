(function () {
  "use strict";

  var Subscription = require(__dirname + "/../../futures/lib/subscription"),
    subscription = Subscription(),
    g_context = {
      color: 'blue'
    },
    context = {
      color: 'red',
      handler: function (err, data) {
        console.log(err, data, this.color);
      }
    };

  console.log(Subscription.isSubscription(subscription));
  
  subscription.whenever(context.handler);

  function testDefault() {
    // undefined, hello world, undefined
    subscription.deliver(undefined, "hello world");
  }

  function testGlobalContext() {
    // timeout, undefined, blue
    subscription.setContext(g_context);
    subscription.setTimeout(90);
    setTimeout(subscription.deliver, 100, undefined, "hello world");
  }

  function testLocalContext() {
    // undefined, hello world, red
    subscription.unsubscribe(context.handler);
    subscription.setTimeout(0); // turn off timeout
    subscription.whenever(context.handler, context);
    subscription.deliver(undefined, "hello world");
  }

  // TODO
  // getSubscribers

  setTimeout(testDefault, 0);
  setTimeout(testGlobalContext, 100);
  setTimeout(testLocalContext, 210);
}());
