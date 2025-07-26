const pool = require('../config/db');
const adminActionQueries = require('../queries/adminActionQueries');

class AdminActionService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const client = await pool.connect();
      
      try {
        // Get total users count
        const usersResult = await client.query('SELECT COUNT(*) as count FROM "user"');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Get total entities count (using reviewable_entity table)
        const entitiesResult = await client.query('SELECT COUNT(*) as count FROM reviewable_entity');
        const totalEntities = parseInt(entitiesResult.rows[0].count);

        // Get total reviews count
        const reviewsResult = await client.query('SELECT COUNT(*) as count FROM review');
        const totalReviews = parseInt(reviewsResult.rows[0].count);

        // Get total reports count
        const reportsResult = await client.query('SELECT COUNT(*) as count FROM reports');
        const totalReports = parseInt(reportsResult.rows[0].count);

        // Get pending reports count
        const pendingReportsResult = await client.query(
          'SELECT COUNT(*) as count FROM reports WHERE status = $1',
          ['pending']
        );
        const pendingReports = parseInt(pendingReportsResult.rows[0].count);

        // Get pending entity requests count (if entity_requests table exists)
        let pendingEntityRequests = 0;
        try {
          const entityRequestsResult = await client.query(
            'SELECT COUNT(*) as count FROM entity_requests WHERE status = $1',
            ['pending']
          );
          pendingEntityRequests = parseInt(entityRequestsResult.rows[0].count);
        } catch (error) {
          // Table might not exist, use 0
          console.log('Entity requests table not found, using 0');
        }

        return {
          totalUsers,
          totalEntities,
          totalReviews,
          totalReports,
          pendingReports,
          pendingEntityRequests
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get all reports
  async getAllReports() {
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 
            r.*,
            u1.username as reporter_name,
            u2.username as reported_user_name
          FROM reports r
          LEFT JOIN "user" u1 ON r.reporter_user_id = u1.user_id
          LEFT JOIN "user" u2 ON r.reported_user_id = u2.user_id
          ORDER BY r.created_at DESC
        `);
        
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting all reports:', error);
      throw error;
    }
  }

  // Get report statistics
  async getReportsStats() {
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as total_reports,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
            COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
            COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports
          FROM reports
        `);
        
        const stats = result.rows[0];
        return {
          total_reports: parseInt(stats.total_reports),
          pending_reports: parseInt(stats.pending_reports),
          reviewed_reports: parseInt(stats.reviewed_reports),
          resolved_reports: parseInt(stats.resolved_reports),
          dismissed_reports: parseInt(stats.dismissed_reports)
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting report stats:', error);
      throw error;
    }
  }

  // Get reports by status
  async getReportsByStatus(status) {
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          SELECT 
            r.*,
            u1.username as reporter_name,
            u2.username as reported_user_name
          FROM reports r
          LEFT JOIN "user" u1 ON r.reporter_user_id = u1.user_id
          LEFT JOIN "user" u2 ON r.reported_user_id = u2.user_id
          WHERE r.status = $1
          ORDER BY r.created_at DESC
        `, [status]);
        
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting reports by status:', error);
      throw error;
    }
  }

  // Update report status
  async updateReportStatus(reportId, status) {
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          UPDATE reports 
          SET status = $1, updated_at = NOW()
          WHERE report_id = $2
          RETURNING *
        `, [status, reportId]);
        
        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // Delete report
  async deleteReport(reportId) {
    try {
      const client = await pool.connect();
      
      try {
        const result = await client.query(`
          DELETE FROM reports 
          WHERE report_id = $1
          RETURNING *
        `, [reportId]);
        
        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Handle admin action on a report
  async handleReportAction(reportId, adminId, actionType, actionDetails = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get report details
      const reportResult = await client.query(
        'SELECT * FROM reports WHERE report_id = $1',
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        throw new Error('Report not found');
      }

      const report = reportResult.rows[0];
      const { reported_item_type, reported_item_id, reported_user_id } = report;

      let actionResult = {};

      // Execute the specific action
      switch (actionType) {
        case 'warning':
          actionResult = await this.issueWarning(
            client,
            reported_user_id,
            adminId,
            actionDetails.reason || 'Content violation',
            reported_item_type,
            reported_item_id,
            actionDetails.expiresAt
          );
          break;

        case 'delete_content':
          actionResult = await this.deleteContent(
            client,
            reported_item_type,
            reported_item_id
          );
          break;

        case 'ban_user':
          actionResult = await this.banUser(
            client,
            reported_user_id,
            adminId,
            actionDetails.reason || 'Repeated violations',
            actionDetails.banType || 'temporary',
            actionDetails.expiresAt
          );
          break;

        case 'no_action':
          actionResult = { message: 'No action taken' };
          break;

        default:
          throw new Error('Invalid action type');
      }

      // Record the admin action
      const adminActionResult = await client.query(
        adminActionQueries.createAdminAction,
        [
          adminId,
          reportId,
          actionType,
          reported_item_type,
          reported_item_id,
          reported_user_id,
          JSON.stringify(actionDetails)
        ]
      );

      // Mark report as resolved
      await client.query(
        adminActionQueries.markReportResolved,
        [reportId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        adminAction: adminActionResult.rows[0],
        actionResult,
        message: `Action "${actionType}" completed successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Admin action error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Issue warning to user
  async issueWarning(client, userId, adminId, reason, contentType, contentId, expiresAt) {
    const expiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const result = await client.query(
      adminActionQueries.createUserWarning,
      [userId, adminId, reason, contentType, contentId, expiryDate]
    );

    return {
      warning: result.rows[0],
      message: 'Warning issued to user'
    };
  }

  // Delete content (post, comment, or review)
  async deleteContent(client, contentType, contentId) {
    let result;
    let message;

    switch (contentType) {
      case 'post':
        result = await client.query(adminActionQueries.deletePost, [contentId]);
        message = 'Post deleted';
        break;
      case 'comment':
        result = await client.query(adminActionQueries.deleteComment, [contentId]);
        message = 'Comment deleted';
        break;
      case 'review':
        result = await client.query(adminActionQueries.deleteReview, [contentId]);
        message = 'Review deleted';
        break;
      default:
        throw new Error('Invalid content type for deletion');
    }

    if (result.rows.length === 0) {
      throw new Error(`${contentType} not found or already deleted`);
    }

    return {
      deletedContent: result.rows[0],
      message
    };
  }

  // Ban user
  async banUser(client, userId, adminId, reason, banType, expiresAt) {
    let expiryDate = null;
    
    if (banType === 'temporary') {
      expiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
    }

    const result = await client.query(
      adminActionQueries.createUserBan,
      [userId, adminId, reason, banType, expiryDate]
    );

    return {
      ban: result.rows[0],
      message: `User ${banType === 'permanent' ? 'permanently' : 'temporarily'} banned`
    };
  }

  // Get user warnings
  async getUserWarnings(userId) {
    try {
      const result = await pool.query(
        adminActionQueries.getActiveWarnings,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user warnings error:', error);
      throw error;
    }
  }

  // Get user bans
  async getUserBans(userId) {
    try {
      const result = await pool.query(
        adminActionQueries.getActiveBans,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user bans error:', error);
      throw error;
    }
  }

  // Check if user is banned
  async isUserBanned(userId) {
    try {
      const result = await pool.query(
        adminActionQueries.checkUserBanned,
        [userId]
      );

      return parseInt(result.rows[0].ban_count) > 0;
    } catch (error) {
      console.error('Check user banned error:', error);
      throw error;
    }
  }

  // Get admin actions for a report
  async getReportActions(reportId) {
    try {
      const result = await pool.query(
        adminActionQueries.getAdminActionsByReport,
        [reportId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get report actions error:', error);
      throw error;
    }
  }

  // Get content info for report context
  async getContentInfo(contentType, contentId) {
    try {
      let query;
      switch (contentType) {
        case 'post':
          query = adminActionQueries.getPostInfo;
          break;
        case 'comment':
          query = adminActionQueries.getCommentInfo;
          break;
        case 'review':
          query = adminActionQueries.getReviewInfo;
          break;
        default:
          throw new Error('Invalid content type');
      }

      const result = await pool.query(query, [contentId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Get content info error:', error);
      throw error;
    }
  }
}

module.exports = new AdminActionService();
