(function () {
  "use strict";

  console.log("This is a visual test.");

  var Future = require(__dirname + "/../lib/future"),
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
    future = Future(global_context);

  console.log('D 0 === ' + future.deliveryCount());
  console.log('S 0 === ' + future.callbackCount());
  console.log('true === ' + Future.isFuture(future));
  
  future.whenever(context.handler);

  function testGlobalContext() {
    // timeout, undefined, yellow
    future.deliver(undefined, "hello world");
    console.log('D 1 === ' + future.deliveryCount());
  }

  function testTimeout() {
    // FutureTimeout, undefined, yellow
    future.setTimeout(20);
  }

  function testLocalContext() {
    // undefined, hello world, red
    console.log('D 2 === ' + future.deliveryCount());
    future.removeCallback(context.handler);
    console.log('S 0 === ' + future.callbackCount());
    future.setTimeout(0); // turn off timeout
    future.whenever(context.handler, context);
    console.log('S 1 === ' + future.callbackCount());
    future.deliver(undefined, "hello world");
    console.log('D 3 === ' + future.deliveryCount());
  }

  function testOnetimer() {
    // undefined, hello world, green
    global_context.color = 'green';
    future.removeCallback(context.handler, context);
    console.log('S 0 === ' + future.callbackCount());
    future.when(context.handler);
    // 0 when asap is on, 1 when asap is off
    console.log('S 0 === ' + future.callbackCount());
    future.deliver(undefined, "hello world");
    console.log('D 4 === ' + future.deliveryCount());
  }

  function testAsap() {
    // undefined, hello world, blue
    global_context.color = 'blue';
    future.setAsap(true);
    future.whenever(context.handler);
    console.log('1 === ' + future.callbackCount());
  }

  // TODO
  // subscribers

  setTimeout(testGlobalContext, 0);
  setTimeout(testTimeout, 100);
  setTimeout(testLocalContext, 200);
  setTimeout(testOnetimer, 210);
  setTimeout(testAsap, 300);
}());
