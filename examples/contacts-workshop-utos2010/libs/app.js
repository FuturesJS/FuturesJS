"use strict";
(function ($) {
    $(function (){
        //
        // Emulate a Slow http Request
        //
        $.getTacebookContacts = function (callback) {
            setTimeout(function(){
                callback(MDB.tacebookContacts);
            }, Math.floor(Math.random()*1000)+100);  
        };
        $.getFwitterContacts = function (callback) {
            setTimeout(function(){
                callback(MDB.fwitterContacts);
            }, Math.floor(Math.random()*1000)+100);  
        };


        //
        // Contacts Provider function
        //
        $.getAllContacts = function() {
            var p1, p2, result;

            p1 = Futures.promise();
            $.getTacebookContacts(p1.fulfill);

            p2 = Futures.promise();
            $.getFwitterContacts(p2.fulfill);

            result = Futures.promise();
            
            Futures.join(p1, p2).when(function (data1, data2) {
              result.fulfill({
                contacts: Array.concat(data1[0].contacts, data2[0].contacts)
              });
            });
            return result;
        }

        //
        // Render the data using selectors (not templates) PURE.js
        //
        var rfn =  $("#contacts").compile({
            ".contact" : {
                "c<-contacts" : {
                    ".photo@src": "images/#{c.photo}.jpg",
                    ".name": "c.name",
                    ".phone_number": "c.phone",
                    ".email": "c.email"
                }
            }
        });


        //
        // Chainify'd Model
        //
        var Contacts = Futures.chainify({
          // providers
          all: $.getAllContacts
        },{
          // consumers
          render: render_contacts,
          sayLater: function (data) {
            alert(data);
            return "Later passing to Now";
          },
          sayNow: function (data) {
            alert(data);
            return undefined; // uses previous data
          },
          sayAgain: function (data) {
            alert(data);
            return "I never get said";
          }
        });

        function render_contacts (data) {
          $("#contacts").render(data[0], rfn);
          var p = Futures.promise().fulfill("heya");
          return p;
        }


        //
        // Display the contacts on click
        //
        $("#contacts").html("No contacts yet ...");  
        $("body").delegate("form", "submit", function (ev) {

          ev.preventDefault(); // don't actually submit the form
          $("#contacts").html("loading...");  

          Contacts.all().render().sayLater().sayNow().sayAgain();
          
        });
    });
}(window.jQuery));
