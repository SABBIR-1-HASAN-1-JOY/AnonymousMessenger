// controllers/photoControllers.js
const {
  createNewPhoto,
  fetchPhotosByTypeAndSource,
  fetchPhotoById,
  deletePhotoAndFile,
  fetchPhotosByUserId,
  validatePhotoUploadPermissions
} = require('../services/photoServices');
const path = require('path');

// Upload single photo
const uploadPhoto = async (req, res) => {
  try {
    console.log('=== UPLOAD PHOTO ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { userId, type, typeId, isAdmin } = req.body;
    const userIsAdmin = isAdmin === 'true';
    
    // Validate upload permissions
    try {
      validatePhotoUploadPermissions(parseInt(userId), userIsAdmin, type, parseInt(typeId));
    } catch (permissionError) {
      // Delete the uploaded file since validation failed
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: permissionError.message });
    }
    
    // Generate proper filename using naming convention
    const uploaderType = userIsAdmin ? 'admin' : 'user';
    const extension = path.extname(req.file.originalname).toLowerCase().substring(1) || 'jpg';
    const { generatePhotoFilename } = require('../services/photoServices');
    const newFilename = generatePhotoFilename(userId, uploaderType, type, typeId, extension);
    
    // Rename the file to use proper naming convention
    const fs = require('fs');
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);
    
    try {
      fs.renameSync(oldPath, newPath);
      req.file.path = newPath;
      req.file.filename = newFilename;
    } catch (renameError) {
      console.error('Error renaming file:', renameError);
      // Clean up original file
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      return res.status(500).json({ error: 'Failed to process uploaded file' });
    }
    
    // For profile photos, delete previous profile photos for this user
    if (type === 'profile') {
      try {
        console.log('Checking for existing profile photos to replace...');
        const existingPhotos = await fetchPhotosByTypeAndSource('profile', parseInt(typeId));
        
        if (existingPhotos && existingPhotos.length > 0) {
          console.log(`Found ${existingPhotos.length} existing profile photos to delete`);
          
          // Delete all existing profile photos for this user
          for (const photo of existingPhotos) {
            try {
              await deletePhotoAndFile(photo.photo_id);
              console.log(`Deleted old profile photo: ${photo.photo_name}`);
            } catch (deleteError) {
              console.error(`Error deleting old profile photo ${photo.photo_id}:`, deleteError);
              // Continue with upload even if old photo deletion fails
            }
          }
        }
      } catch (fetchError) {
        console.error('Error checking for existing profile photos:', fetchError);
        // Continue with upload even if check fails
      }
    }
    
    // Create photo record in database
    const photoData = {
      type,
      photoName: newFilename,
      userId: userIsAdmin && type === 'entities' ? null : parseInt(userId), // null for admin entity uploads
      sourceId: parseInt(typeId),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };
    
    const newPhoto = await createNewPhoto(photoData);
    
    // Format response
    const responseData = {
      id: newPhoto.photo_id,
      photo_id: newPhoto.photo_id,
      type: newPhoto.type,
      filename: newPhoto.photo_name,
      url: `/api/photos/file/${newPhoto.photo_name}`,
      sourceId: newPhoto.source_id,
      userId: newPhoto.user_id,
      uploadDate: newPhoto.upload_date,
      fileSize: newPhoto.file_size,
      mimeType: newPhoto.mime_type
    };
    
    console.log('Photo uploaded successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error uploading photo:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload multiple photos
const uploadMultiplePhotos = async (req, res) => {
  try {
    console.log('=== UPLOAD MULTIPLE PHOTOS ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const { userId, type, typeId, isAdmin } = req.body;
    const userIsAdmin = isAdmin === 'true';
    
    // Validate upload permissions
    try {
      validatePhotoUploadPermissions(parseInt(userId), userIsAdmin, type, parseInt(typeId));
    } catch (permissionError) {
      // Delete all uploaded files since validation failed
      const fs = require('fs');
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(403).json({ error: permissionError.message });
    }
    
    const uploadedPhotos = [];
    
    try {
      // Process each uploaded file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        const photoData = {
          type,
          photoName: file.filename,
          userId: userIsAdmin && type === 'entities' ? null : parseInt(userId),
          sourceId: parseInt(typeId),
          fileSize: file.size,
          mimeType: file.mimetype
        };
        
        const newPhoto = await createNewPhoto(photoData);
        
        uploadedPhotos.push({
          id: newPhoto.photo_id,
          photo_id: newPhoto.photo_id,
          type: newPhoto.type,
          filename: newPhoto.photo_name,
          url: `/api/photos/file/${newPhoto.photo_name}`,
          sourceId: newPhoto.source_id,
          userId: newPhoto.user_id,
          uploadDate: newPhoto.upload_date,
          fileSize: newPhoto.file_size,
          mimeType: newPhoto.mime_type
        });
      }
      
      console.log('Multiple photos uploaded successfully:', uploadedPhotos);
      res.status(201).json({
        message: `${uploadedPhotos.length} photos uploaded successfully`,
        photos: uploadedPhotos
      });
    } catch (dbError) {
      // If database operations fail, clean up all uploaded files
      const fs = require('fs');
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
      throw dbError;
    }
  } catch (error) {
    console.error('Error uploading multiple photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get photos by type and source ID
const getPhotosByTypeAndSource = async (req, res) => {
  try {
    console.log('=== GET PHOTOS BY TYPE AND SOURCE ENDPOINT HIT ===');
    const { type, sourceId } = req.params;
    console.log('Type:', type, 'Source ID:', sourceId);
    
    const photos = await fetchPhotosByTypeAndSource(type, parseInt(sourceId));
    
    // Format response
    const responseData = photos.map(photo => ({
      id: photo.photo_id,
      photo_id: photo.photo_id,
      type: photo.type,
      filename: photo.photo_name,
      url: `/api/photos/file/${photo.photo_name}`,
      sourceId: photo.source_id,
      userId: photo.user_id,
      uploadDate: photo.upload_date,
      fileSize: photo.file_size,
      mimeType: photo.mime_type
    }));
    
    console.log(`Found ${responseData.length} photos`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get photos by user ID
const getPhotosByUser = async (req, res) => {
  try {
    console.log('=== GET PHOTOS BY USER ENDPOINT HIT ===');
    const { userId } = req.params;
    console.log('User ID:', userId);
    
    const photos = await fetchPhotosByUserId(parseInt(userId));
    
    // Format response
    const responseData = photos.map(photo => ({
      id: photo.photo_id,
      photo_id: photo.photo_id,
      type: photo.type,
      filename: photo.photo_name,
      url: `/api/photos/file/${photo.photo_name}`,
      sourceId: photo.source_id,
      userId: photo.user_id,
      uploadDate: photo.upload_date,
      fileSize: photo.file_size,
      mimeType: photo.mime_type
    }));
    
    console.log(`Found ${responseData.length} photos for user ${userId}`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Serve photo file
const servePhotoFile = async (req, res) => {
  try {
    const { filename } = req.params;
    console.log('Serving photo file:', filename);
    
    // Validate filename format (basic security check)
    if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Serve the file with appropriate headers
    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set content type based on file extension
    let contentType = 'application/octet-stream';
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving photo file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete photo
const deletePhoto = async (req, res) => {
  try {
    console.log('=== DELETE PHOTO ENDPOINT HIT ===');
    const { photoId } = req.params;
    console.log('Photo ID:', photoId);
    
    // Get photo details first to check permissions
    const photo = await fetchPhotoById(parseInt(photoId));
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Basic permission check (you might want to add more sophisticated checking)
    const userId = req.headers['user-id'];
    const isAdmin = req.headers['is-admin'] === 'true';
    
    if (!isAdmin && photo.user_id && photo.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own photos' });
    }
    
    const deletedPhoto = await deletePhotoAndFile(parseInt(photoId));
    
    console.log('Photo deleted successfully:', deletedPhoto);
    res.status(200).json({
      message: 'Photo deleted successfully',
      deletedPhoto: {
        id: deletedPhoto.photo_id,
        type: deletedPhoto.type,
        filename: deletedPhoto.photo_name
      }
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    if (error.message === 'Photo not found') {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  uploadPhoto,
  uploadMultiplePhotos,
  getPhotosByTypeAndSource,
  getPhotosByUser,
  servePhotoFile,
  deletePhoto
};
