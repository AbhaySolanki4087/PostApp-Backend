// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');

// Import controllers
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  deleteProfile
} = require('../controllers/authController'); // make sure path is correct

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
// verfy tiken before access it
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.delete('/profile', verifyToken, deleteProfile);


module.exports = router;
