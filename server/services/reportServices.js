// services/reportServices.js
const pool = require('../config/db');
const reportQueries = require('../queries/reportQueries');

// Create a new report
const createReport = async (reportData) => {
  const { reporterUserId, reportedItemType, reportedItemId, reportedUserId, reason, description } = reportData;
  
  try {
    // Check if user already reported this item
    const existingReport = await pool.query(reportQueries.checkExistingReport, [
      reporterUserId, reportedItemType, reportedItemId
    ]);
    
    if (existingReport.rows.length > 0) {
      return {
        success: false,
        error: 'You have already reported this item'
      };
    }
    
    // Create the report
    const result = await pool.query(reportQueries.createReport, [
      reporterUserId, reportedItemType, reportedItemId, reportedUserId, reason, description
    ]);
    
    return {
      success: true,
      report: result.rows[0],
      message: 'Report submitted successfully'
    };
  } catch (error) {
    console.error('Error creating report:', error);
    return {
      success: false,
      error: 'Failed to create report'
    };
  }
};

// Get all reports (admin function)
const getAllReports = async () => {
  try {
    const result = await pool.query(reportQueries.getAllReports);
    
    return {
      success: true,
      reports: result.rows
    };
  } catch (error) {
    console.error('Error getting all reports:', error);
    return {
      success: false,
      error: 'Failed to fetch reports'
    };
  }
};

// Get reports by status
const getReportsByStatus = async (status) => {
  try {
    const result = await pool.query(reportQueries.getReportsByStatus, [status]);
    
    return {
      success: true,
      reports: result.rows
    };
  } catch (error) {
    console.error('Error getting reports by status:', error);
    return {
      success: false,
      error: 'Failed to fetch reports'
    };
  }
};

// Get reports for a specific item
const getReportsForItem = async (itemType, itemId) => {
  try {
    const result = await pool.query(reportQueries.getReportsForItem, [itemType, itemId]);
    
    return {
      success: true,
      reports: result.rows
    };
  } catch (error) {
    console.error('Error getting reports for item:', error);
    return {
      success: false,
      error: 'Failed to fetch reports'
    };
  }
};

// Get reports made by a user
const getReportsByUser = async (userId) => {
  try {
    const result = await pool.query(reportQueries.getReportsByUser, [userId]);
    
    return {
      success: true,
      reports: result.rows
    };
  } catch (error) {
    console.error('Error getting reports by user:', error);
    return {
      success: false,
      error: 'Failed to fetch reports'
    };
  }
};

// Update report status (admin function)
const updateReportStatus = async (reportId, status) => {
  try {
    const result = await pool.query(reportQueries.updateReportStatus, [status, reportId]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Report not found'
      };
    }
    
    return {
      success: true,
      report: result.rows[0],
      message: 'Report status updated successfully'
    };
  } catch (error) {
    console.error('Error updating report status:', error);
    return {
      success: false,
      error: 'Failed to update report status'
    };
  }
};

// Delete report (admin function)
const deleteReport = async (reportId) => {
  try {
    const result = await pool.query(reportQueries.deleteReport, [reportId]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Report not found'
      };
    }
    
    return {
      success: true,
      message: 'Report deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting report:', error);
    return {
      success: false,
      error: 'Failed to delete report'
    };
  }
};

// Get all report reasons
const getReportReasons = async () => {
  try {
    const result = await pool.query(reportQueries.getReportReasons);
    
    return {
      success: true,
      reasons: result.rows
    };
  } catch (error) {
    console.error('Error getting report reasons:', error);
    return {
      success: false,
      error: 'Failed to fetch report reasons'
    };
  }
};

// Get report statistics (admin function)
const getReportStats = async () => {
  try {
    const result = await pool.query(reportQueries.getReportStats);
    
    return {
      success: true,
      stats: result.rows[0]
    };
  } catch (error) {
    console.error('Error getting report stats:', error);
    return {
      success: false,
      error: 'Failed to fetch report statistics'
    };
  }
};

// Get reports count for a specific item
const getReportsCountForItem = async (itemType, itemId) => {
  try {
    const result = await pool.query(reportQueries.getReportsCountForItem, [itemType, itemId]);
    
    return {
      success: true,
      count: parseInt(result.rows[0].report_count)
    };
  } catch (error) {
    console.error('Error getting reports count for item:', error);
    return {
      success: false,
      error: 'Failed to fetch reports count'
    };
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
