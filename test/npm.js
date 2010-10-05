var Futures = require('futures');
var p = Futures.promise();

p.when(function (err, data) {
  console.log("Success");
});

p.fulfill(undefined, {"msg": "Hello World!"});
