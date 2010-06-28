JaySyncUnit (JS)
================

This is a trivial asynchronous unit test suite.
The important thing is that "this.complete(true||false)" is called at some point before the timeout occurs.

**Depends on jQuery**

**Suggested to use Futures**


Examples
========

Let's run two tests.
They need a name, a test function, and (optionally) a limit to the time they may run before timing out as failure.

A div for the test results will be created in the body of the page.
For each test begun the number of tests will be incremented.
As each test completes it will pass or fail itself. 

    (function() {
      JSUnit.addTest('My Test',function() {
        this.complete(true);
      }, 500);
      JSUnit.addTest('My Other Test',function() {
        this.complete(true);
      }, 2000);

      JSUnit.runTests();
    }());


TODO
====

* Remove trivial jQuery dependency
* Practice my friend's XUnit Kata again
* Write tests to test the framework itself
* Add fixtures
