let axios = require('axios'); 
let cheerio = require('cheerio');
let mongoose = require('mongoose'); 
let db = require("../models"); 

mongoose.Promise = Promise; // Set mongoose to leverage Built in JavaScript ES6 Promises
mongoose.connect("mongodb://localhost:27017/news", { // Connect to the Mongo DB
  useMongoClient: true
});

let mongooseConnection = mongoose.connection;

mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
mongooseConnection.once('open', function() {
  console.log(`Sucessfully Connected to Mongo DB !`); 
});

module.exports = (app) => { // Export Module Containing Routes. Called from Server.js

  // Default Route
  app.get("/", (req, res) => res.render("index"));

  // Scrape Articles Route
  app.get("/api/search", (req, res) => {

    axios.get("https://www.npr.org/sections/news/").then(response => {
      // console.log("Load Response");
      
      let $ = cheerio.load(response.data);

      let handlebarsObject = {
        data: []
      }; 

      $("article").each((i, element) => { // Use Cheerio to Search for all Article HTML Tags
      
        let lowResImageLink = $(element).children('.item-image').children('.imagewrap').children('a').children('img').attr('src');

        if (lowResImageLink) {

          let imageLength = lowResImageLink.length;
          let highResImage = lowResImageLink.substr(0, imageLength - 11) + "800-c100.jpg";

          handlebarsObject.data.push({ // Store Scrapped Data into handlebarsObject
            headline: $(element).children('.item-info').children('.title').children('a').text(),
            summary: $(element).children('.item-info').children('.teaser').children('a').text(),
            url: $(element).children('.item-info').children('.title').children('a').attr('href'),
            imageURL: highResImage,
            slug: $(element).children('.item-info').children('.slug-wrap').children('.slug').children('a').text(),
            comments: null
          }); // Store HTML Data as an Object within an Object
        } 
      }); 

      res.render("index", handlebarsObject);
    });
  });

  // Saved Article Route
  app.get("/api/savedArticles", (req, res) => {
    // Grab every document in the Articles collection
    db.Articles.find({}). // Find all Saved Articles
    then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    }).catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
  }); 

  app.post("/api/add", (req, res) => { // Add Article Route

    // console.log("add path hit");

    let articleObject = req.body;

    db.Articles. 
    findOne({url: articleObject.url}). 
    then(function(response) {

      if (response === null) { // Only Create Article if it has not been Created
        db.Articles.create(articleObject).then((response) => console.log(" ")).catch(err => res.json(err));
      } 

      res.send("Article Saved");
    }).catch(function(err) {
    
      res.json(err);
    });

  }); 

  // Delete Article Route
  app.post("/api/deleteArticle", (req, res) => {
    // console.log(req.body)
    sessionArticle = req.body;

    db.Articles.findByIdAndRemove(sessionArticle["_id"]). 
    then(response => {
      if (response) {
        res.send("Sucessfully Deleted");
      }
    });
  }); 

  // Delete Comment Route
  app.post("/api/deleteComment", (req, res) => {
    // console.log("delete comment route hit")
    let comment = req.body;
    db.Notes.findByIdAndRemove(comment["_id"]). 
    then(response => {
      if (response) {
        res.send("Sucessfully Deleted");
      }
    });
  }); 

  // Create Notes Route
  app.post("/api/createNotes", (req, res) => {

    sessionArticle = req.body;

    db.Notes.create(sessionArticle.body).then(function(dbNote) {
      // console.log(dbNote);
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Articles.findOneAndUpdate({
        _id: sessionArticle.articleID.articleID
      }, {
        $push: {
          note: dbNote._id
        }
      });
    }).then(function(dbArticle) {
      
      res.json(dbArticle);
    }).catch(function(err) {
    
      res.json(err);
    });
  }); 

  // Route for grabbing a specific Article by id, populate it with it's comment
  app.post("/api/populateNote", function(req, res) {
    // console.log("ID is "+ req.body.articleID);

    db.Articles.findOne({_id: req.body.articleID}).populate("Note"). // Associate Notes with the Article ID
    then((response) => {
      // console.log("response is " + response);

      if (response.note.length == 1) { 

        db.Notes.findOne({'_id': response.note}).then((comment) => {
          comment = [comment];
          console.log("Sending Back One Comment");
          res.json(comment); 
        });

      } else { 

        console.log("2")
        db.Notes.find({
          '_id': {
            "$in": response.note
          }
        }).then((comments) => {
          // console.log("Sending Back Multiple Comments");
          res.json(comments); 
        });
      }
     
    }).catch(function(err) {
    
      res.json(err);
    });
  }); 

} 
