chainify()
----

Creates an asynchronous model using asynchronous method queueing.

**Core**

  * `Futures.chainify(providers, modifiers, consumers, context)` - creates an asynchronous model
    * `providers` - methods which provide data - must return Futures or Joins or undefined
      * `function (next, params)` must call `next`

    * `modifiers` - methods which use provided data and modify it - act as Sequences
      * `function (next, err, data [, ...])` must call `next`

    * `consumers` - methods which use data without modifying it - act as simple callbacks
      * `function (err, data [, ...])`

Note: `next` is an instance of `Futures.deliver`

**Example:**

Let's say we want to produce a model which acts like this:

    Contacts.all({httpAuth: base64("coolaj86:secret")}).limit(30).render();

The code to produce such a model might look like this:

    var Contacts,
      providers,
      modifiers,
      consumers;

    // Get resources from various sites
    providers = {
      facebook: function (next, params) {
        var future = Futures.future();
        // make async calls to get data

        // probably best to handle errors
        // and not pass them on
        next(data);
      },
      twitter: function (next, params) {
        // same as above
      },
      all: function (next, params) {
        var join = Futures.join();
        join.add([
          providers.FacebookContacts(params),
          providers.TwitterContacts(params)
        ]);
        join.when(next);
      }
    };

    modifiers = {
      limit: function(next, data, params) {
        data = data.first(params);
        next(data);
      }
    };

    consumers = {
      render: function (data, params) {
        Template.render(data, params);
      }
    };

    Contacts = Futures.chainify(providers, modifiers, consumers);
