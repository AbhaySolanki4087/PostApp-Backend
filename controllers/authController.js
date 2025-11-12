const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Blog = require('../models/blogModel');

const SECRET_KEY = process.env.JWT_SECRET;

// Register
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, passwordHash });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Logout
exports.logoutUser = (req, res) => {
  // With JWT, client just deletes the token
  res.json({ success: true, message: 'Logged out successfully' });
};

// Get profile
exports.getProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { name, bio } = req.body;
  const userId = req.user?.id;
  if (!userId)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, bio } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  const userId = req.user?.id;
  const userName = req.user?.name;
  if (!userId)
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    await User.findByIdAndDelete(userId);

    await Blog.updateMany(
      {},
      { $pull: { comments: { user: userName }, likedBy: userName } }
    );

    const blogs = await Blog.find({ likedBy: { $exists: true } });
    for (const blog of blogs) {
      blog.likes = blog.likedBy.length;
      await blog.save();
    }

    res.json({ success: true, message: 'Account deleted and related data removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};
