"use strict";
(function ($) {
    $(function (){
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

        //$("#contacts").html("loading...");  
        
        render_contacts(MDB.contactsSource2);
    });
}(window.jQuery));
