// controllers/reportControllers.js
const reportServices = require('../services/reportServices');

// Create a new report
const createReport = async (req, res) => {
  try {
    console.log('=== CREATE REPORT CONTROLLER ===');
    const { reportedItemType, reportedItemId, reportedUserId, reason, description } = req.body;
    const reporterUserId = req.user?.id || req.body.reporterUserId;
    
    console.log('Report data:', { reporterUserId, reportedItemType, reportedItemId, reportedUserId, reason });
    
    if (!reporterUserId || !reportedItemType || !reportedItemId || !reportedUserId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: reporterUserId, reportedItemType, reportedItemId, reportedUserId, reason'
      });
    }
    
    // Validate item type
    const validItemTypes = ['post', 'comment', 'review'];
    if (!validItemTypes.includes(reportedItemType)) {
      return res.status(400).json({
        error: 'Invalid item type. Must be: post, comment, or review'
      });
    }
    
    // Check if user is trying to report their own content
    if (parseInt(reporterUserId) === parseInt(reportedUserId)) {
      return res.status(400).json({
        error: 'You cannot report your own content'
      });
    }
    
    const result = await reportServices.createReport({
      reporterUserId: parseInt(reporterUserId),
      reportedItemType,
      reportedItemId: parseInt(reportedItemId),
      reportedUserId: parseInt(reportedUserId),
      reason,
      description: description || null
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log('Report created successfully');
    
    res.status(201).json({
      success: true,
      message: result.message,
      report: result.report
    });
    
  } catch (error) {
    console.error('Error in createReport controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create report'
    });
  }
};

// Get all reports (admin only)
const getAllReports = async (req, res) => {
  try {
    console.log('=== GET ALL REPORTS CONTROLLER ===');
    
    const result = await reportServices.getAllReports();
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.reports.length} reports`);
    
    res.status(200).json({
      success: true,
      reports: result.reports
    });
    
  } catch (error) {
    console.error('Error in getAllReports controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports'
    });
  }
};

// Get reports by status
const getReportsByStatus = async (req, res) => {
  try {
    console.log('=== GET REPORTS BY STATUS CONTROLLER ===');
    const { status } = req.params;
    
    console.log('Getting reports with status:', status);
    
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: pending, reviewed, resolved, or dismissed'
      });
    }
    
    const result = await reportServices.getReportsByStatus(status);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.reports.length} reports with status ${status}`);
    
    res.status(200).json({
      success: true,
      reports: result.reports
    });
    
  } catch (error) {
    console.error('Error in getReportsByStatus controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports'
    });
  }
};

// Get reports for a specific item
const getReportsForItem = async (req, res) => {
  try {
    console.log('=== GET REPORTS FOR ITEM CONTROLLER ===');
    const { itemType, itemId } = req.params;
    
    console.log('Getting reports for:', { itemType, itemId });
    
    const validItemTypes = ['post', 'comment', 'review'];
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        error: 'Invalid item type. Must be: post, comment, or review'
      });
    }
    
    const result = await reportServices.getReportsForItem(itemType, parseInt(itemId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.reports.length} reports for ${itemType} ${itemId}`);
    
    res.status(200).json({
      success: true,
      reports: result.reports
    });
    
  } catch (error) {
    console.error('Error in getReportsForItem controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports'
    });
  }
};

// Get reports made by a user
const getReportsByUser = async (req, res) => {
  try {
    console.log('=== GET REPORTS BY USER CONTROLLER ===');
    const { userId } = req.params;
    
    console.log('Getting reports by user:', userId);
    
    const result = await reportServices.getReportsByUser(parseInt(userId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.reports.length} reports by user ${userId}`);
    
    res.status(200).json({
      success: true,
      reports: result.reports
    });
    
  } catch (error) {
    console.error('Error in getReportsByUser controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports'
    });
  }
};

// Update report status (admin only)
const updateReportStatus = async (req, res) => {
  try {
    console.log('=== UPDATE REPORT STATUS CONTROLLER ===');
    const { reportId } = req.params;
    const { status } = req.body;
    
    console.log('Updating report status:', { reportId, status });
    
    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: pending, reviewed, resolved, or dismissed'
      });
    }
    
    const result = await reportServices.updateReportStatus(parseInt(reportId), status);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log('Report status updated successfully');
    
    res.status(200).json({
      success: true,
      message: result.message,
      report: result.report
    });
    
  } catch (error) {
    console.error('Error in updateReportStatus controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update report status'
    });
  }
};

// Delete report (admin only)
const deleteReport = async (req, res) => {
  try {
    console.log('=== DELETE REPORT CONTROLLER ===');
    const { reportId } = req.params;
    
    console.log('Deleting report:', reportId);
    
    const result = await reportServices.deleteReport(parseInt(reportId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log('Report deleted successfully');
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error in deleteReport controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete report'
    });
  }
};

// Get report reasons
const getReportReasons = async (req, res) => {
  try {
    console.log('=== GET REPORT REASONS CONTROLLER ===');
    
    const result = await reportServices.getReportReasons();
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.reasons.length} report reasons`);
    
    res.status(200).json({
      success: true,
      reasons: result.reasons
    });
    
  } catch (error) {
    console.error('Error in getReportReasons controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch report reasons'
    });
  }
};

// Get report statistics (admin only)
const getReportStats = async (req, res) => {
  try {
    console.log('=== GET REPORT STATS CONTROLLER ===');
    
    const result = await reportServices.getReportStats();
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log('Report stats retrieved successfully');
    
    res.status(200).json({
      success: true,
      stats: result.stats
    });
    
  } catch (error) {
    console.error('Error in getReportStats controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch report statistics'
    });
  }
};

// Get reports count for item
const getReportsCountForItem = async (req, res) => {
  try {
    console.log('=== GET REPORTS COUNT FOR ITEM CONTROLLER ===');
    const { itemType, itemId } = req.params;
    
    console.log('Getting reports count for:', { itemType, itemId });
    
    const validItemTypes = ['post', 'comment', 'review'];
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        error: 'Invalid item type. Must be: post, comment, or review'
      });
    }
    
    const result = await reportServices.getReportsCountForItem(itemType, parseInt(itemId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }
    
    console.log(`Found ${result.count} reports for ${itemType} ${itemId}`);
    
    res.status(200).json({
      success: true,
      count: result.count
    });
    
  } catch (error) {
    console.error('Error in getReportsCountForItem controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reports count'
    });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportsByStatus,
  getReportsForItem,
  getReportsByUser,
  updateReportStatus,
  deleteReport,
  getReportReasons,
  getReportStats,
  getReportsCountForItem
};
