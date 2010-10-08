"use strict";
(function ($) {
    $(function (){
        //
        // Emulate a Slow http Request
        //
        $.getContacts = function (func) {
            setTimeout(function(){
                func(MDB.contactsSource2);
            },Math.floor(Math.random()*1000)+100);  
        };
        $.getMoreContacts = function (func) {
            setTimeout(function(){
                func(MDB.contactsSource1);
            },Math.floor(Math.random()*1000)+100);  
        };

        //
        // Render the data using selectors (not templaets)
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

        function render_contacts (data1, data2) {
          var all = Array.concat(data1[0].contacts, data2[0].contacts);
          $("#contacts").render({contacts: all}, rfn);
        }


        //
        // Display the contacts on click
        //
        $("#contacts").html("No contacts yet ...");  
        $("body").delegate("form", "submit", function (ev) {
          var p1, p2, promises = [];
          ev.preventDefault(); // don't actually submit the form
          $("#contacts").html("loading...");  

          p1 = Futures.promise();
          $.getContacts(p1.fulfill);

          p2 = Futures.promise();
          $.getMoreContacts(p2.fulfill);
          
          Futures.join(p1, p2).when(render_contacts);
        });
    });
}(window.jQuery));
