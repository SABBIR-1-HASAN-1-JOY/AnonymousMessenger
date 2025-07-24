// services/photoServices.js
const {
  createPhoto,
  getPhotosByTypeAndSource,
  getPhotoById,
  deletePhotoById,
  getPhotosByUserId,
  updatePhoto
} = require('../queries/photoQueries');
const fs = require('fs').promises;
const path = require('path');

// Service to create a new photo record
const createNewPhoto = async (photoData) => {
  try {
    console.log('Creating new photo record:', photoData);
    const photo = await createPhoto(photoData);
    return photo;
  } catch (error) {
    throw error;
  }
};

// Service to fetch photos by type and source ID
const fetchPhotosByTypeAndSource = async (type, sourceId) => {
  try {
    console.log('Fetching photos for type:', type, 'source ID:', sourceId);
    const photos = await getPhotosByTypeAndSource(type, sourceId);
    return photos;
  } catch (error) {
    throw error;
  }
};

// Service to fetch photo by ID
const fetchPhotoById = async (photoId) => {
  try {
    console.log('Fetching photo by ID:', photoId);
    const photo = await getPhotoById(photoId);
    return photo;
  } catch (error) {
    throw error;
  }
};

// Service to delete photo (including file from disk)
const deletePhotoAndFile = async (photoId) => {
  try {
    console.log('Deleting photo by ID:', photoId);
    
    // First get the photo record to get filename
    const photo = await getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }
    
    // Delete from database
    const deletedPhoto = await deletePhotoById(photoId);
    
    // Delete file from disk
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, photo.photo_name);
    
    try {
      await fs.unlink(filePath);
      console.log('File deleted from disk:', filePath);
    } catch (fileError) {
      console.warn('Could not delete file from disk:', fileError.message);
      // Don't throw error if file doesn't exist, as DB record is already deleted
    }
    
    return deletedPhoto;
  } catch (error) {
    throw error;
  }
};

// Service to fetch photos by user ID
const fetchPhotosByUserId = async (userId) => {
  try {
    console.log('Fetching photos for user ID:', userId);
    const photos = await getPhotosByUserId(userId);
    return photos;
  } catch (error) {
    throw error;
  }
};

// Service to update photo metadata
const updatePhotoMetadata = async (photoId, updateData) => {
  try {
    console.log('Updating photo metadata:', photoId, updateData);
    const updatedPhoto = await updatePhoto(photoId, updateData);
    return updatedPhoto;
  } catch (error) {
    throw error;
  }
};

// Generate filename using the specified naming convention
const generatePhotoFilename = (uploaderId, uploaderType, type, typeId, originalExtension) => {
  // For profile photos, add timestamp to ensure uniqueness
  if (type === 'profile') {
    const timestamp = Date.now();
    return `${uploaderType}${uploaderId}${type}${typeId}_${timestamp}.${originalExtension}`;
  }
  
  // For other types, use original format: uploader + id + type + type_id + .jpg
  // Example: admin123entities456.jpg or user789reviews123.jpg
  return `${uploaderType}${uploaderId}${type}${typeId}.${originalExtension}`;
};

// Validate photo upload permissions
const validatePhotoUploadPermissions = (userId, isAdmin, type, typeId) => {
  // Entity photos can only be uploaded by admins
  if (type === 'entities' && !isAdmin) {
    throw new Error('Only admin users can upload entity photos');
  }
  
  // Profile photos can only be uploaded by the profile owner or admin
  if (type === 'profile' && typeId !== userId && !isAdmin) {
    throw new Error('You can only upload your own profile photo');
  }
  
  // Review photos can be uploaded by anyone (with proper validation in controller)
  return true;
};

module.exports = {
  createNewPhoto,
  fetchPhotosByTypeAndSource,
  fetchPhotoById,
  deletePhotoAndFile,
  fetchPhotosByUserId,
  updatePhotoMetadata,
  generatePhotoFilename,
  validatePhotoUploadPermissions
};
