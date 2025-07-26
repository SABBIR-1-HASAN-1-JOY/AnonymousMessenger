// routes/reportRoute.js
const express = require('express');
const router = express.Router();
const reportControllers = require('../controllers/reportControllers');

// =====================================
// REPORT ROUTES
// =====================================

// POST /api/reports - Create a new report
router.post('/', reportControllers.createReport);

// GET /api/reports - Get all reports (admin only)
router.get('/', reportControllers.getAllReports);

// GET /api/reports/status/:status - Get reports by status
router.get('/status/:status', reportControllers.getReportsByStatus);

// GET /api/reports/item/:itemType/:itemId - Get reports for a specific item
router.get('/item/:itemType/:itemId', reportControllers.getReportsForItem);

// GET /api/reports/item/:itemType/:itemId/count - Get reports count for a specific item
router.get('/item/:itemType/:itemId/count', reportControllers.getReportsCountForItem);

// GET /api/reports/user/:userId - Get reports made by a user
router.get('/user/:userId', reportControllers.getReportsByUser);

// PUT /api/reports/:reportId/status - Update report status (admin only)
router.put('/:reportId/status', reportControllers.updateReportStatus);

// DELETE /api/reports/:reportId - Delete report (admin only)
router.delete('/:reportId', reportControllers.deleteReport);

// GET /api/reports/reasons - Get all report reasons
router.get('/reasons', reportControllers.getReportReasons);

// GET /api/reports/stats - Get report statistics (admin only)
router.get('/stats', reportControllers.getReportStats);

module.exports = router;
