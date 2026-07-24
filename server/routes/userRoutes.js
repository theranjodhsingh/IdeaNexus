const express = require('express');
const multer = require('multer');

const User = require('../models/userProfileSchemaPatch');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProfilePicture, deleteProfilePicture } = require('../services/cloudinaryService');

const router = express.Router();
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'profilePicture'));
    }
    return callback(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single('profilePicture')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image must be 5 MB or smaller' });
    }
    return res.status(400).json({ success: false, message: 'Only JPG, PNG, and WebP images are allowed' });
  });
};

router.post('/profile-picture', verifyToken, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A profile picture is required' });
    }

    const profilePictureUrl = await uploadProfilePicture(req.file.buffer, req.user._id);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePictureUrl },
      { new: true, runValidators: true },
    );

    return res.json({ success: true, data: { profilePictureUrl: user.profilePictureUrl } });
  } catch (error) {
    console.error('PROFILE PICTURE UPLOAD ERROR:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status === 503 ? error.message : 'Unable to upload profile picture',
    });
  }
});

router.delete('/profile-picture', verifyToken, async (req, res) => {
  try {
    await deleteProfilePicture(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { profilePictureUrl: null }, { runValidators: true });
    return res.json({ success: true, data: { profilePictureUrl: null } });
  } catch (error) {
    console.error('PROFILE PICTURE DELETE ERROR:', error);
    return res.status(500).json({ success: false, message: 'Unable to remove profile picture' });
  }
});

module.exports = router;
