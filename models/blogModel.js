// models/blogModel.js
const mongoose = require('mongoose');

// comment sub-schema
const commentSchema = new mongoose.Schema({
  user: { type: String, required: true }, // store username or userId
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
// comment sub-schema
const likeSchema = new mongoose.Schema({
  user: { type: String, required: true } // store username or userId
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'Technology' },
  author: { type: String, required: true }, // could also store userId
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },       // optional, just store count
  likedBy: { type: [String], default: [] }, 
  comments: { type: [commentSchema], default: [] }, // <-- embed actual comments here
  image: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
