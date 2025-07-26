const express = require('express');
const router = express.Router();
const adminActionControllers = require('../controllers/adminActionControllers');

// GET /api/admin/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', adminActionControllers.getDashboardStats);

// GET /api/admin/reports - Get all reports  
router.get('/reports', adminActionControllers.getAllReports);

// GET /api/admin/reports-stats - Get report statistics
router.get('/reports-stats', adminActionControllers.getReportsStats);

// GET /api/admin/reports/status/:status - Get reports by status
router.get('/reports/status/:status', adminActionControllers.getReportsByStatus);

// PUT /api/admin/reports/:reportId/status - Update report status
router.put('/reports/:reportId/status', adminActionControllers.updateReportStatus);

// POST /api/admin/reports/:reportId/action - Handle admin action on report
router.post('/reports/:reportId/action', adminActionControllers.handleReportAction);

// GET /api/admin/reports/:reportId/actions - Get admin actions for a report
router.get('/reports/:reportId/actions', adminActionControllers.getReportActions);

// GET /api/admin/users/:userId/warnings - Get user warnings
router.get('/users/:userId/warnings', adminActionControllers.getUserWarnings);

// GET /api/admin/users/:userId/bans - Get user bans
router.get('/users/:userId/bans', adminActionControllers.getUserBans);

// GET /api/admin/users/:userId/banned - Check if user is banned
router.get('/users/:userId/banned', adminActionControllers.checkUserBanned);

// GET /api/admin/content/:contentType/:contentId - Get content info for admin review
router.get('/content/:contentType/:contentId', adminActionControllers.getContentInfo);

module.exports = router;
