"use strict";
(function ($) {
    $(function (){

        //
        // Emulate a Slow http Request
        //
        $.getContacts = function (func) {
            setTimeout(function(){
                func(MDB.contactsSource2);
            },500);  
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

        function render_contacts (data) {
          $("#contacts").render(data, rfn);
        }


        //
        // Display the contacts
        //
        $("body").delegate("form", "submit", function (ev) {
          ev.preventDefault(); // don't actually submit the form
          $("#contacts").html("loading...");  
          $.getContacts(render_contacts);
        });
    });
}(window.jQuery));
