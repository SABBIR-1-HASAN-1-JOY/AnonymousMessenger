// routes/photoRoute.js
const express = require('express');
const router = express.Router();
const {
  uploadPhoto,
  uploadMultiplePhotos,
  getPhotosByTypeAndSource,
  getPhotosByUser,
  servePhotoFile,
  deletePhoto
} = require('../controllers/photoControllers');

const {
  validatePhotoUpload,
  validatePhotoIdParam,
  validateGetPhotos,
  validateUserIdParam
} = require('../validators/photoValidators');

const {
  uploadSinglePhoto,
  uploadMultiplePhotos: uploadMultipleMiddleware,
  handleUploadError
} = require('../middleware/photoUpload');

// Upload single photo
router.post('/upload', uploadSinglePhoto, handleUploadError, validatePhotoUpload, uploadPhoto);

// Upload multiple photos
router.post('/upload-multiple', uploadMultipleMiddleware, handleUploadError, validatePhotoUpload, uploadMultiplePhotos);

// Serve photo file - MUST come before /:type/:sourceId route
router.get('/file/:filename', servePhotoFile);

// Get photos by user ID - MUST come before /:type/:sourceId route
router.get('/user/:userId', validateUserIdParam, getPhotosByUser);

// Get photos by type and source ID
// Example: GET /api/photos/reviews/123 or GET /api/photos/profile/456
router.get('/:type/:sourceId', validateGetPhotos, getPhotosByTypeAndSource);

// Delete photo by ID
router.delete('/:photoId', validatePhotoIdParam, deletePhoto);

// Get photo endpoint info (for testing)
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Photo API is running',
    endpoints: {
      'POST /upload': 'Upload single photo (form-data: photo file, userId, type, typeId, isAdmin)',
      'POST /upload-multiple': 'Upload multiple photos (form-data: photos files, userId, type, typeId, isAdmin)',
      'GET /:type/:sourceId': 'Get photos by type and source ID',
      'GET /user/:userId': 'Get photos by user ID',
      'GET /file/:filename': 'Serve photo file',
      'DELETE /:photoId': 'Delete photo by ID'
    },
    photoTypes: ['profile', 'reviews', 'entities'],
    maxFileSize: '5MB',
    allowedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
    namingConvention: 'uploader+id+type+type_id+.extension'
  });
});

module.exports = router;
