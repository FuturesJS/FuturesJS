(function () {
  "use strict";

  var Future = require('../future/future')
    , assert = require('assert')
    , iDont
    , iThrow
    , options = {}
    ;

  function handleError(err) {
    //console.error(err.message);
    //console.error(err.stack);
    console.log('[PASS] caught error');
  }
  
  options.error = handleError;

  iDont = Future(null, options);
  iThrow = Future(null);

  assert.doesNotThrow(function () { iDont.when(1) }, /.*/, 'should not have thrown, but did');
  assert.throws(function () { iThrow.when(2) }, /.*/, 'should have thrown, but didn\'t');
}());
