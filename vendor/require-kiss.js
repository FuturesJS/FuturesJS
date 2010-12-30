/*jslint browser: true, devel: true, debug: true, es5: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*
  var window = {}, exports = {}, module = {}, global = {};
*/
// Implementation of require(), modules, exports, and provide to the browser
"use strict";
(function () {
    if ('undefined' !== typeof window && 'undefined' !== typeof alert) {
      (function () {
        var global = window;
        function resetModule() {
          global.module = {};
          global.exports = {};
          global.module.exports = exports;
        }
        global._PLUGIN_EXPORTS = global._PLUGIN_EXPORTS || {};
        global.require = function (name) {
          var plugin = global._PLUGIN_EXPORTS[name] || global[name],
            msg = "One of the included scripts requires '" + 
              name + "', which is not loaded. " +
              "\nTry including '<script src=\"" + name + ".js\"></script>'.\n";
          if ('undefined' === typeof plugin) {
            alert(msg);
            throw new Error(msg);
          }
          return plugin;
        };
        global.provide = function (name) {
          global._PLUGIN_EXPORTS[name] = module.exports;
          resetModule();
        };
        resetModule();
      }());
    } else {
      global.provide = function () {};
    }
}());
