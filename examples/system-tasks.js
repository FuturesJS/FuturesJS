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

  var fs = require('fs');

  fs.readdir('./', s1.fulfill);
  fs.readdir('/bin', s3.fulfill);
  fs.readdir('/tmp', s2.fulfill);

  synchronize.add(s1, s2, s3);
  synchronize.when(function (s1a, s2a, s3a){
    console.log(s1a[1]);
    console.log(s2a[1]);
    console.log(s3a[1]);
  });

}());
