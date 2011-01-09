(function () {
  "use strict";

  console.log("This is a visual test.");

  var Chainify = require(__dirname + "/../lib/chainify"),
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

  console.log(Chainify);

  model = Chainify(providers, modifiers, consumers);

  console.log("\none");
  model.one("provider params").caps("modifier params").print(function (str) { return ("Pass: " + str); });

  console.log("\nall");
  model.all("provider params").decaps("modifier params").print(function (str) { return ("Pass: " + str); });

}());
