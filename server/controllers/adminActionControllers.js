const adminActionService = require('../services/adminActionService');
const { checkAdminPermission } = require('../middleware/adminMiddleware');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminActionService.getDashboardStats();
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      details: error.message
    });
  }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const reports = await adminActionService.getAllReports();
    res.status(200).json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      details: error.message
    });
  }
};

// Get report statistics
const getReportsStats = async (req, res) => {
  try {
    const stats = await adminActionService.getReportsStats();
    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Get reports stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch report stats',
      details: error.message
    });
  }
};

// Get reports by status
const getReportsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const reports = await adminActionService.getReportsByStatus(status);
    res.status(200).json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Get reports by status error:', error);
    res.status(500).json({
      error: 'Failed to fetch reports by status',
      details: error.message
    });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    const result = await adminActionService.updateReportStatus(parseInt(reportId), status);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      error: 'Failed to update report status',
      details: error.message
    });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const result = await adminActionService.deleteReport(parseInt(reportId));
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Failed to delete report',
      details: error.message
    });
  }
};

// Handle admin action on a report
const handleReportAction = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { actionType, actionDetails, adminId } = req.body;

    // Verify admin permission
    const isAdmin = await checkAdminPermission(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate action type
    const validActions = ['warning', 'delete_content', 'ban_user', 'no_action'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const result = await adminActionService.handleReportAction(
      parseInt(reportId),
      parseInt(adminId),
      actionType,
      actionDetails || {}
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Admin action completed successfully'
    });

  } catch (error) {
    console.error('Handle report action error:', error);
    res.status(500).json({
      error: 'Failed to handle report action',
      details: error.message
    });
  }
};

// Get admin actions for a report
const getReportActions = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { adminId } = req.query;

    // Verify admin permission
    const isAdmin = await checkAdminPermission(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const actions = await adminActionService.getReportActions(parseInt(reportId));

    res.status(200).json({
      success: true,
      data: actions
    });

  } catch (error) {
    console.error('Get report actions error:', error);
    res.status(500).json({
      error: 'Failed to get report actions',
      details: error.message
    });
  }
};

// Get user warnings (admin only)
const getUserWarnings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId } = req.query;

    // Verify admin permission
    const isAdmin = await checkAdminPermission(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const warnings = await adminActionService.getUserWarnings(parseInt(userId));

    res.status(200).json({
      success: true,
      data: warnings
    });

  } catch (error) {
    console.error('Get user warnings error:', error);
    res.status(500).json({
      error: 'Failed to get user warnings',
      details: error.message
    });
  }
};

// Get user bans (admin only)
const getUserBans = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId } = req.query;

    // Verify admin permission
    const isAdmin = await checkAdminPermission(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const bans = await adminActionService.getUserBans(parseInt(userId));

    res.status(200).json({
      success: true,
      data: bans
    });

  } catch (error) {
    console.error('Get user bans error:', error);
    res.status(500).json({
      error: 'Failed to get user bans',
      details: error.message
    });
  }
};

// Check if user is banned
const checkUserBanned = async (req, res) => {
  try {
    const { userId } = req.params;

    const isBanned = await adminActionService.isUserBanned(parseInt(userId));

    res.status(200).json({
      success: true,
      data: { isBanned }
    });

  } catch (error) {
    console.error('Check user banned error:', error);
    res.status(500).json({
      error: 'Failed to check user ban status',
      details: error.message
    });
  }
};

// Get content info for admin review
const getContentInfo = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { adminId } = req.query;

    // Verify admin permission
    const isAdmin = await checkAdminPermission(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const content = await adminActionService.getContentInfo(contentType, parseInt(contentId));

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.status(200).json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Get content info error:', error);
    res.status(500).json({
      error: 'Failed to get content info',
      details: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllReports,
  getReportsStats,
  getReportsByStatus,
  updateReportStatus,
  deleteReport,
  handleReportAction,
  getReportActions,
  getUserWarnings,
  getUserBans,
  checkUserBanned,
  getContentInfo
};
