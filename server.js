var express = require("express");
var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var request = require("request");

var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();


var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

app.get("/", function(req, res){
    res.render("index");
});


// A GET route for scraping the nytimes website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://www.newyorktimes.com/", function(error, response, html) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(html);
  
      // Now, we grab every h2 within an article tag, and do the following:
      $("article").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("h2")
          .children("a")
          .text();
        result.link = $(this)
          .children("h2")
          .children("a")
          .attr("href");
        result.summary = $(this)
          .children(".summary")
          .text();
        
        //function to create an article
        //function createTheArticle() {
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
            .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
            })
            .catch(function(err) {
            // If an error occurred, send it to the client
            return res.json(err);
            });

        //};

    
        // //make sure the article isn't already in the db
        // db.Article.find({}).then(function(articlesinDB){
        //     var headlinesinDB = articlesinDB.map(function(article){
        //         return article.title
        //     });
        //     if (headlinesinDB.includes(result.title)){
        //         console.log("a repeat");
        //     } else {
        //         createTheArticle();
        //     }
        // });
  
      });
  
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
    });
});
  

app.get("/articles", function (req, res) {
    db.Article.find({}, null, { sort: { '_id': -1 } }, function (error, data) {
      if (error) throw error;
      res.render("articles", { articles: data })
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.render("notes", {article: dbArticle});
    })
    .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
    
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.title, req.body)
    .then(function(dbNote) {
        console.log(dbNote);
    // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
    // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
    // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote[1]._id }}, { new: true });
    })
    .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
    })
    .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
    });
});

app.put("/notes/:id", function(req, res) {
    db.Note.remove({_id: req.params.id})
    .then(function(data){
        console.log(data);
        res.send(data);
    });
    // db.Article.findOneAndUpdate({_id: req.articleID}, {remove: { note: req.params.id }});
});

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
