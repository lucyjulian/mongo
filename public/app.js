$(document).ready(function () {
    // When you click the savenote button
    $(document).on("click", "#saveNote", function() {
    // Grab the id associated with the article from the submit button
        var thisId = $(this).attr("data-id");
        console.log("about to call ajax");

        // Run a POST request to change the note, using what's entered in the inputs
        $.ajax({
            method: "POST",
            url: "/articles/" + thisId,
            data: {
                // Value taken from title input
                title: $("#titleinput").val(),
                // Value taken from note textarea
                body: $("#bodyinput").val()
            }
        })
        // With that done
        .then(function(data) {
            // Log the response
            console.log(data);
            document.location.reload();
            

            // Also, remove the values entered in the input and textarea for note entry
            $("#titleinput").val("");
            $("#bodyinput").val("");
        });

        
    });

    $(document).on("click", ".deleteNote", function() {
        var thisId = $(this).attr("data-id");

        $.ajax({
            method: "PUT",
            url: "/notes/" + thisId
        }).then(function(response) {
            console.log(response);
            document.location.reload();
        });
    });



    $(document).on("click", "#scrapeNew", function() {
        $.ajax({
            method: "GET",
            url: "/scrape"
        })
        .then(function(data){
            console.log(data);
            document.location.reload();
        })
    });
});