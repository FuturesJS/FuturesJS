# PromiseJS

## About
PromiseJS is a colletion of tools for function-level Promises, Futures, Subscriptions, and the like.

## Examples
    var p = make_promise(),
    timeout = setTimeout(function() {
      p.smash("Suxorz!");
    }, 10000);
    async_call_with_callback_and_errback(function(data){
      p.fulfill(data);
    });
    p.when(function(data) {alert("Got some data: \n\n" + JSON.strinigfy(data ,undefined, '\t'))});
    p.fail(function(data) {alert("Timed out after 10 seconds with message '" + data + "'"));

    passable_promise = p.public(); // Hide 'smash' and 'fulfill' methods
    passable_promise
      .when(function(data){ alert('Success Message 2') })
      .fail(function(data){ alert('Failure Message 2') })
      ;
