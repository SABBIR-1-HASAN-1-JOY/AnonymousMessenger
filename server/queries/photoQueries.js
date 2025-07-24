// queries/photoQueries.js
const pool = require('../config/db.js');

// Create a new photo record
const createPhoto = async (photoData) => {
  try {
    const { type, photoName, userId, sourceId, fileSize, mimeType } = photoData;
    
    const result = await pool.query(`
      INSERT INTO photos (type, photo_name, user_id, source_id, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [type, photoName, userId, sourceId, fileSize, mimeType]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in createPhoto:', error);
    throw error;
  }
};

// Get photos by type and source ID
const getPhotosByTypeAndSource = async (type, sourceId) => {
  try {
    const result = await pool.query(`
      SELECT * FROM photos
      WHERE type = $1 AND source_id = $2
      ORDER BY upload_date DESC
    `, [type, sourceId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getPhotosByTypeAndSource:', error);
    throw error;
  }
};

// Get photo by ID
const getPhotoById = async (photoId) => {
  try {
    const result = await pool.query(`
      SELECT * FROM photos WHERE photo_id = $1
    `, [photoId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in getPhotoById:', error);
    throw error;
  }
};

// Delete photo by ID
const deletePhotoById = async (photoId) => {
  try {
    const result = await pool.query(`
      DELETE FROM photos WHERE photo_id = $1
      RETURNING *
    `, [photoId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in deletePhotoById:', error);
    throw error;
  }
};

// Get photos by user ID
const getPhotosByUserId = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT * FROM photos
      WHERE user_id = $1
      ORDER BY upload_date DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error in getPhotosByUserId:', error);
    throw error;
  }
};

// Update photo metadata
const updatePhoto = async (photoId, updateData) => {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(photoId);
    const query = `
      UPDATE photos 
      SET ${fields.join(', ')}
      WHERE photo_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error in updatePhoto:', error);
    throw error;
  }
};

module.exports = {
  createPhoto,
  getPhotosByTypeAndSource,
  getPhotoById,
  deletePhotoById,
  getPhotosByUserId,
  updatePhoto
};
