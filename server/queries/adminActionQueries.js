// Admin action queries for handling reports

// Create admin action record
const createAdminAction = `
  INSERT INTO admin_actions (admin_user_id, report_id, action_type, target_item_type, target_item_id, target_user_id, action_details)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING action_id, admin_user_id, report_id, action_type, target_item_type, target_item_id, target_user_id, action_details, created_at
`;

// Get admin actions for a report
const getAdminActionsByReport = `
  SELECT 
    aa.*,
    u.username as admin_username
  FROM admin_actions aa
  JOIN "user" u ON aa.admin_user_id = u.user_id
  WHERE aa.report_id = $1
  ORDER BY aa.created_at DESC
`;

// Create user warning
const createUserWarning = `
  INSERT INTO user_warnings (user_id, admin_id, reason, content_type, content_id, expires_at)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING warning_id, user_id, admin_id, reason, content_type, content_id, is_active, created_at, expires_at
`;

// Create user ban
const createUserBan = `
  INSERT INTO user_bans (user_id, admin_id, reason, ban_type, expires_at)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING ban_id, user_id, admin_id, reason, ban_type, created_at, expires_at, is_active
`;

// Get active warnings for user
const getActiveWarnings = `
  SELECT 
    uw.*,
    u.username as admin_username
  FROM user_warnings uw
  JOIN "user" u ON uw.admin_id = u.user_id
  WHERE uw.user_id = $1 
    AND uw.is_active = true 
    AND (uw.expires_at IS NULL OR uw.expires_at > CURRENT_TIMESTAMP)
  ORDER BY uw.created_at DESC
`;

// Get active bans for user
const getActiveBans = `
  SELECT 
    ub.*,
    u.username as admin_username
  FROM user_bans ub
  JOIN "user" u ON ub.admin_id = u.user_id
  WHERE ub.user_id = $1 
    AND ub.is_active = true 
    AND (ub.expires_at IS NULL OR ub.expires_at > CURRENT_TIMESTAMP)
  ORDER BY ub.created_at DESC
`;

// Check if user is currently banned
const checkUserBanned = `
  SELECT COUNT(*) as ban_count
  FROM user_bans
  WHERE user_id = $1 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
`;

// Delete post
const deletePost = `
  UPDATE posts 
  SET deleted_at = CURRENT_TIMESTAMP, deleted_by_admin = true
  WHERE post_id = $1
  RETURNING post_id, title
`;

// Delete comment  
const deleteComment = `
  UPDATE comments 
  SET deleted_at = CURRENT_TIMESTAMP, deleted_by_admin = true
  WHERE comment_id = $1
  RETURNING comment_id, content
`;

// Delete review
const deleteReview = `
  UPDATE reviews 
  SET deleted_at = CURRENT_TIMESTAMP, deleted_by_admin = true
  WHERE review_id = $1
  RETURNING review_id, title
`;

// Get user info for report
const getUserInfoForReport = `
  SELECT user_id, username, email 
  FROM "user" 
  WHERE user_id = $1
`;

// Get post info for report
const getPostInfo = `
  SELECT 
    p.post_id,
    p.post_text,
    p.user_id,
    p.is_rate_enabled,
    p.ratingpoint,
    p.created_at,
    u.username as user_name
  FROM post p
  LEFT JOIN "user" u ON p.user_id = u.user_id
  WHERE p.post_id = $1
`;

// Get comment info for report
const getCommentInfo = `
  SELECT 
    c.comment_id,
    c.comment_text,
    c.user_id,
    c.entity_type,
    c.entity_id,
    c.created_at,
    u.username as user_name
  FROM comments c
  LEFT JOIN "user" u ON c.user_id = u.user_id
  WHERE c.comment_id = $1
`;

// Get review info for report
const getReviewInfo = `
  SELECT 
    r.review_id,
    r.review_text,
    r.title,
    r.ratingpoint,
    r.user_id,
    r.item_id,
    r.created_at,
    u.username as user_name
  FROM review r
  LEFT JOIN "user" u ON r.user_id = u.user_id
  WHERE r.review_id = $1
`;

// Update report status to resolved
const markReportResolved = `
  UPDATE reports 
  SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
  WHERE report_id = $1
  RETURNING report_id, status
`;

module.exports = {
  createAdminAction,
  getAdminActionsByReport,
  createUserWarning,
  createUserBan,
  getActiveWarnings,
  getActiveBans,
  checkUserBanned,
  deletePost,
  deleteComment,
  deleteReview,
  getUserInfoForReport,
  getPostInfo,
  getCommentInfo,
  getReviewInfo,
  markReportResolved
};
