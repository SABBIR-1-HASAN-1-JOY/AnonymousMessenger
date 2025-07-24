// queries/entityRequestQueries.js
const pool = require('../config/db');

// Create a new entity request
exports.createEntityRequest = async (requestData) => {
  const { userId, itemName, description, category, sector, picture } = requestData;
  const query = `
    INSERT INTO entity_requests (user_id, item_name, description, category, sector, picture, status, requested_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [userId, itemName, description, category, sector, picture]);
  return result.rows[0];
};

// Get all entity requests (admin view)
exports.getAllEntityRequests = async (status = null) => {
  let query = `
    SELECT 
      er.*,
      u.username as requester_name,
      u.email as requester_email,
      admin_user.username as reviewed_by_name
    FROM entity_requests er
    LEFT JOIN "user" u ON er.user_id = u.user_id
    LEFT JOIN "user" admin_user ON er.reviewed_by = admin_user.user_id
  `;
  
  const params = [];
  if (status) {
    query += ` WHERE er.status = $1`;
    params.push(status);
  }
  
  query += ` ORDER BY er.requested_at DESC`;
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Get entity requests by user
exports.getEntityRequestsByUser = async (userId) => {
  const query = `
    SELECT 
      er.*,
      admin_user.username as reviewed_by_name
    FROM entity_requests er
    LEFT JOIN "user" admin_user ON er.reviewed_by = admin_user.user_id
    WHERE er.user_id = $1
    ORDER BY er.requested_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Get a specific entity request by ID
exports.getEntityRequestById = async (requestId) => {
  const query = `
    SELECT 
      er.*,
      u.username as requester_name,
      u.email as requester_email,
      admin_user.username as reviewed_by_name
    FROM entity_requests er
    LEFT JOIN "user" u ON er.user_id = u.user_id
    LEFT JOIN "user" admin_user ON er.reviewed_by = admin_user.user_id
    WHERE er.request_id = $1
  `;
  const result = await pool.query(query, [requestId]);
  return result.rows[0];
};

// Update entity request status (approve/reject)
exports.updateEntityRequestStatus = async (requestId, status, adminId, adminNotes = null) => {
  const query = `
    UPDATE entity_requests 
    SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3
    WHERE request_id = $4
    RETURNING *
  `;
  const result = await pool.query(query, [status, adminId, adminNotes, requestId]);
  return result.rows[0];
};

// Delete entity request
exports.deleteEntityRequest = async (requestId) => {
  const query = `DELETE FROM entity_requests WHERE request_id = $1 RETURNING *`;
  const result = await pool.query(query, [requestId]);
  return result.rows[0];
};

// Get entity request statistics
exports.getEntityRequestStats = async () => {
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM entity_requests
    GROUP BY status
  `;
  const result = await pool.query(query);
  return result.rows;
};
