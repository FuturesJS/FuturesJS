      (function() {
        var JSUnit = {},
        tests = {},
        runables = {},
        num_tests = 0,
        num_over = 0,
        num_passed = 0,
        completeTest,
        addTest,
        runTests,
        begin;

        $(function () {
          $('<div id="ajax_unit_test"><span id="aut_num_tests"></span></div>').appendTo("body");
        });

        completeTest = function (status) {
          var item = this;
          $(function() {
            if (undefined === item.result) {
              num_over += 1;
              clearTimeout(item.timeout);
            } else {
              alert('"'+item.name+'" completed after timeout with status "'+status+'".');
            }
            
            item.result = status;
            if (true == item.result) {
              num_passed += 1;
            }
            status = status && "Passed" || "Failed"
            
            //alert('passed: ' + JSON.stringify(item));
            $('#'+item.lname).html('"'+item.name+'" ' + status);
          });
        };

        addTest = function(name, func, wait) {
          var lname = name.toLowerCase().replace(/\W/g,'_'),
          complete;
          
          if (undefined !== runables[lname]) {
            throw new Error('"'+lname+'" is already defined');
          }
          num_tests += 1;
          runables[lname] = {}
          runables[lname].result = undefined;
          runables[lname].lname = lname;
          runables[lname].name = name;
          runables[lname].wait = wait;
          runables[lname].complete = function (result) {
            completeTest.call(runables[lname], result);
          }
          runables[lname].func = function() {
            func.apply({
              complete: runables[lname].complete
            });
          }
        };

        runTests = function() {$(function() {
          for (key in runables) {
              var item = runables[key];
              item.timeout = setTimeout(function() {
                num_over += 1;
                item.complete(false);
              }, item.wait);
              $("<div id='"+item.lname+"'></div>").appendTo("#ajax_unit_test").html('"'+item.name+'" running...');
              $('#aut_num_tests').html(num_tests + ' tests running...');
              item.func();
          };
        });};
        
        JSUnit.addTest = addTest;
        JSUnit.runTests = runTests;
        window.JSUnit = JSUnit;
      }());
