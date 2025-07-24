// middleware/photoUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generatePhotoFilename } = require('../services/photoServices');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a temporary filename for now - will be renamed later
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase().substring(1) || 'jpg';
    const tempFilename = `temp_${timestamp}_${Math.random().toString(36).substring(2)}.${extension}`;
    
    // Store temp filename for later use
    req.tempFilename = tempFilename;
    
    cb(null, tempFilename);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Middleware for single photo upload
const uploadSinglePhoto = upload.single('photo');

// Middleware for multiple photo upload (max 5 photos)
const uploadMultiplePhotos = upload.array('photos', 5);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field name for file upload.' });
    }
  }
  
  if (err.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  
  if (err.message.includes('Only JPEG, PNG, GIF, and WebP images are allowed')) {
    return res.status(400).json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
  }
  
  if (err.message.includes('Missing required parameters')) {
    return res.status(400).json({ error: err.message });
  }
  
  // Other multer errors
  console.error('Upload error:', err);
  res.status(500).json({ error: 'File upload error' });
};

module.exports = {
  uploadSinglePhoto,
  uploadMultiplePhotos,
  handleUploadError,
  uploadsDir
};
