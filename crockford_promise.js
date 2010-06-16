function make_promise() {
  var status = 'unresolved',
      outcome,
      waiting = [],
      dreading = []; 

  function vouch(deed, func) {
    switch (status) {
    case 'unresolved':
      (deed === 'fulfilled' ? waiting : dreading).push(func);
      break; 
    case deed:
      func(outcome);
      break;
    }
  };

  function resolve(deed, value) {
    if (status !== 'unresolved') {
      throw new Error('The promise has already been resolved:' + status);
    }
    status = deed;
    outcome = value;
    (deed == 'fulfilled' ? waiting : dreading).forEach(function (func) {
      try {
        func(outcome);
      } catch (ignore) {}
    });
    waiting = null;
    dreading = null;
  };

  return {
    when: function (func) {
      vouch('fulfilled', func);
    }, 
    fail: function (func) {
      vouch('smashed', func);
    },
    fulfill: function (value) {
      resolve('fulfilled', value);
    },
    smash: function (string) {
      resolve('smashed', string);
    }, 
    status: function () {
      return status;
    }
  };
};
