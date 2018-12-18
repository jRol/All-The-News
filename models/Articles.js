let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let ArticleSchema = new Schema({ // Create a New Schema Constructor for News Article

  headline: {
    type: String,
    required: true
  },

  summary: {
    type: String,
    required: true
  },

  url: {
    type: String,
    required: true
  },

  imageURL: {
    type: String,
    required: true
  },

  slug: {
    type: String
  },

  note: [{
    type: Schema.Types.ObjectId,
    ref: "Note"
  }]

});

let Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
