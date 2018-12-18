let mongoose = require('mongoose');

let Schema = mongoose.Schema;

var commentSchema = new Schema({ // Using Schema constructor, create a new CommentSchema object
  
  body: String

});

var Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
