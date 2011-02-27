(function () {
  "use strict";

  console.log("This is a visual test.");

  var Asyncify = require(__dirname + "/../lib/asyncify"),
    onceOnlySync,
    onceOnly,
    future;

  console.log(Asyncify);


  // Don't even bother looking at this mess.
  //
  // Let this explanation suffice:
  // A function that replaces itself with an error once called
  onceOnlySync = (function (func) {
    return function () {
      var f = func;
      func = function () {
        throw new Error("[Pass: not actually an error] Don't call me no more: I'm dead");
      };
      return f.apply(this, arguments);
    };
  }(function () {
    return "I'm dying!"
  }));




  onceOnly = Asyncify(onceOnlySync);

  onceOnly.whenever(function (err, data) {
    console.log("[whenever] " + (err || data));
  });

  onceOnly().when(function (err, data) {
    console.log("[when[0]]  " + (err || data));
  });

  onceOnly();

  // Asap is turned off for asyncify, so this doesn't run immediately
  onceOnly.when(function (err, data) {
    console.log("[when[1]   " + (err || data));
  });
  
}());
(function () {
  "use strict";

  var Futures = require(__dirname + '/../lib');

  if (!Futures.future) {
    console.log("Fail: no futures");
  } else {
    console.log("Pass: `Futures`");
  }
}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Loop = require(__dirname + "/../lib/loop"),
    loop = Loop();

  console.log(Loop);

  loop.setTimeout(400);
  loop.setWait(100);
  loop.setMaxLoop(3);
  loop.run(function (next, err, data) {
    if (data > 5) {
      next("break", err, data);
    }
    console.log(data);
    next(err, data + 1);
  }, 0).when(function (err, data) {
    console.log("loop ended", err, data);
  });
  
}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Promise = require(__dirname + "/../lib/future"),
    promise = Promise();

  console.log(Promise);

  promise.when(function (err, data) {
    console.log(data);
  });
  promise.fulfill(undefined, "hello world");
  promise.when(function (err, data) {
    console.log(data);
  });
  try {
    promise.fulfill(undefined, "end-of-the-world");
    console.log("Fail");
  } catch(e) {
    console.log("Pass if hello world is displayed twice");
  }
}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Sequence  = require(__dirname + "/../lib/sequence"),
    sequence = Sequence(),
    err = undefined;

  sequence
    .then(function (next) {
      setTimeout(function () {
        next(err, "a", "b", "c");
      }, 100);
    })
    .then(function (next, err, a, b, c) {
      setTimeout(function () {
        console.log(a, b, c);
        next(err, "d", "e", "f");
      }, 200);
    })
    .then(function (next, err, d, e, f) {
      setTimeout(function () {
        console.log(d, e, f);
        next(err, "g", "h", "i");
      }, 500);
    });

  sequence
    .then(function (next, err, g, h, i) {
      console.log(g, h, i);
      next(err, "j", "k", "l");
    }).then(function (next, err, j, k, l) {
      console.log(j, k, l);
      next(err, "m", "n", "o");
    });

}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Emitter = require(__dirname + "/../lib/emitter"),
    emitter = Emitter();

  console.log(Emitter);

  console.log(emitter);

  emitter.on("foo", function (data) {
    console.log(data);
  });

  emitter.emit("foo", "bar");
}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Synchronize = require(__dirname + "/../lib/join"),
    Future = require(__dirname + "/../lib/future"),
    synchronize = Synchronize(),
    s1 = Future(),
    s2 = Future(),
    s3 = Future();

  console.log(Synchronize);

  s1.deliver(undefined, "Hello");
  s3.deliver(undefined, "!");
  s2.deliver(undefined, "World");

  synchronize.add(s1, s2, s3);

  synchronize.when(function (args1, args2, args3) {
    console.log('[when]', args1[1], args2[1], args3[1]);
  });

  s2.deliver(undefined, "Amazing");

  synchronize.whenever(function (args1, args2, args3) {
    console.log('[whenever]', args1[1], args2[1], args3[1]);
  });

  s2.deliver(undefined, "Cruel");
  s3.deliver(undefined, "World!");
  s1.deliver(undefined, "Goodbye");

}());
(function () {
  "use strict";

  console.log("This is a visual test.");

  var Modelify = require(__dirname + "/../lib/modelify"),
    model,
    providers,
    modifiers,
    consumers;

  providers = {
    one: function (next, query) {
      console.log("Pass: provider params == ", query);
      next("CoolAJ86", "555-555-5555");
    },
    all: function (next, query) {
      console.log("Pass: provider params == ", query);
      next("Mvndaai", "555-555-5555");
    }
  };

  modifiers = {
    caps: function (next, nombre, numero, params) {
      console.log("Pass: modifier params == ", params);
      next(nombre.toUpperCase(), numero.toUpperCase());
    },
    decaps: function (next, nombre, numero, params) {
      console.log("Pass: modifier params == ", params);
      next(nombre.toLowerCase(), numero.toLowerCase());
    }
  };

  consumers = {
    print: function (nombre, numero, transform) {
      var msg = transform(nombre);
      console.log(msg, numero);
    }
  };

  console.log(Modelify);

  model = Modelify(providers, modifiers, consumers);

  console.log("\none");
  model.one("provider params").caps("modifier params").print(function (str) { return ("Pass: " + str); });

  console.log("\nall");
  model.all("provider params").decaps("modifier params").print(function (str) { return ("Pass: " + str); });

}());
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
