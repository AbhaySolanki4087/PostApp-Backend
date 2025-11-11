// middlewares/authMiddleware.js
function isLoggedIn(req, res, next) {
  // ✅ Simulate a logged-in user (temporary)
  if (!req.session?.user) {
    req.session = req.session || {};
    req.session.user = { name: 'abhay' }; // fake default for testing
  }

  // If still no user, block
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  req.user = req.session.user;
  next();
}

module.exports = { isLoggedIn };
