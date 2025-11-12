const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Blog = require('../models/blogModel');
const isLoggedIn = require('../middlewares/authMiddleware');

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create blog (protected)
router.post('/', isLoggedIn, upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body;
  const author = req.user?.name || "abhay";

  if (!title || !content)
    return res.status(400).json({ success: false, message: 'Title and content required' });

  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newBlog = await Blog.create({ title, content, category, author, image: imageUrl });
    res.status(201).json({ success: true, blog: newBlog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// Likes, comments, etc remain the same but replace req.session.user.name with req.user.name
router.post('/:blogId/like', isLoggedIn, async (req, res) => {
  const { blogId } = req.params;
  const username = req.user.name;

  const blog = await Blog.findById(blogId);
  if (!blog) return res.status(404).json({ msg: 'Blog not found' });

  if (blog.likedBy.includes(username)) {
    blog.likedBy = blog.likedBy.filter(u => u !== username);
  } else {
    blog.likedBy.push(username);
  }
  blog.likes = blog.likedBy.length;
  await blog.save();
  res.json({ success: true, likes: blog.likes, likedBy: blog.likedBy });
});

// Comment routes can remain unchanged
// Add a comment
router.post('/:blogId/comment', isLoggedIn, async (req, res) => {
  const { text } = req.body;
  const username = req.user.name; // Make sure JWT middleware sets req.user

  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    // Push new comment
    blog.comments.push({ user: username, text, createdAt: new Date() });
    await blog.save();

    res.json({ success: true, comments: blog.comments, count: blog.comments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Get all comments for a blog
router.get('/:blogId/comments', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    res.json({ success: true, comments: blog.comments, count: blog.comments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});


// Delete comment (optional)
router.delete('/:blogId/comment/:commentId', isLoggedIn, async (req, res) => {
  const { blogId, commentId } = req.params;
  const username = req.user.name;

  try {
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.comments = blog.comments.filter(c => c._id.toString() !== commentId || c.user !== username);
    await blog.save();

    res.json({ success: true, comments: blog.comments, count: blog.comments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

module.exports = router;
