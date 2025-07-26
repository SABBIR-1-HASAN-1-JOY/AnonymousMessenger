// queries/reportQueries.js

// Create a new report
const createReport = `
  INSERT INTO reports (
    reporter_user_id, 
    reported_item_type, 
    reported_item_id, 
    reported_user_id, 
    reason, 
    description
  ) VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`;

// Get all reports (for admin)
const getAllReports = `
  SELECT 
    r.*,
    reporter.username as reporter_username,
    reported.username as reported_username
  FROM reports r
  LEFT JOIN users reporter ON r.reporter_user_id = reporter.user_id
  LEFT JOIN users reported ON r.reported_user_id = reported.user_id
  ORDER BY r.created_at DESC
`;

// Get reports by status
const getReportsByStatus = `
  SELECT 
    r.*,
    reporter.username as reporter_username,
    reported.username as reported_username
  FROM reports r
  LEFT JOIN users reporter ON r.reporter_user_id = reporter.user_id
  LEFT JOIN users reported ON r.reported_user_id = reported.user_id
  WHERE r.status = $1
  ORDER BY r.created_at DESC
`;

// Get reports for a specific item
const getReportsForItem = `
  SELECT 
    r.*,
    reporter.username as reporter_username,
    reported.username as reported_username
  FROM reports r
  LEFT JOIN users reporter ON r.reporter_user_id = reporter.user_id
  LEFT JOIN users reported ON r.reported_user_id = reported.user_id
  WHERE r.reported_item_type = $1 AND r.reported_item_id = $2
  ORDER BY r.created_at DESC
`;

// Get reports made by a user
const getReportsByUser = `
  SELECT 
    r.*,
    reported.username as reported_username
  FROM reports r
  LEFT JOIN users reported ON r.reported_user_id = reported.user_id
  WHERE r.reporter_user_id = $1
  ORDER BY r.created_at DESC
`;

// Update report status
const updateReportStatus = `
  UPDATE reports 
  SET status = $1, updated_at = CURRENT_TIMESTAMP 
  WHERE report_id = $2
  RETURNING *
`;

// Delete report
const deleteReport = `
  DELETE FROM reports 
  WHERE report_id = $1
  RETURNING *
`;

// Check if user already reported an item
const checkExistingReport = `
  SELECT report_id 
  FROM reports 
  WHERE reporter_user_id = $1 
    AND reported_item_type = $2 
    AND reported_item_id = $3
`;

// Get all report reasons
const getReportReasons = `
  SELECT * FROM report_reasons 
  WHERE is_active = true 
  ORDER BY reason_text
`;

// Get report statistics
const getReportStats = `
  SELECT 
    COUNT(*) as total_reports,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
    COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
    COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports
  FROM reports
`;

// Get reports count for a specific item
const getReportsCountForItem = `
  SELECT COUNT(*) as report_count
  FROM reports 
  WHERE reported_item_type = $1 AND reported_item_id = $2
`;

module.exports = {
  createReport,
  getAllReports,
  getReportsByStatus,
  getReportsForItem,
  getReportsByUser,
  updateReportStatus,
  deleteReport,
  checkExistingReport,
  getReportReasons,
  getReportStats,
  getReportsCountForItem
};
