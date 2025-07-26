import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Report {
  report_id: number;
  reporter_user_id: number;
  reporter_username: string;
  reported_item_type: 'post' | 'comment' | 'review';
  reported_item_id: number;
  reported_user_id: number;
  reported_username: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

interface AdminAction {
  action_id: number;
  admin_user_id: number;
  admin_username: string;
  report_id: number;
  action_type: 'warning' | 'delete_content' | 'ban_user' | 'no_action';
  target_item_type?: string;
  target_item_id?: number;
  target_user_id?: number;
  action_details?: string;
  created_at: string;
}

interface ContentInfo {
  [key: string]: any;
  title?: string;
  content?: string;
  body?: string;
}

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportActions, setReportActions] = useState<AdminAction[]>([]);
  const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    actionType: '',
    reason: '',
    banType: 'temporary',
    expiresAt: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/reports?adminId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportActions = async (reportId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/actions?adminId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setReportActions(data.data || []);
      }
    } catch (err) {
      console.error('Fetch report actions error:', err);
    }
  };

  const fetchContentInfo = async (contentType: string, contentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/content/${contentType}/${contentId}?adminId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setContentInfo(data.data);
      }
    } catch (err) {
      console.error('Fetch content info error:', err);
    }
  };

  const handleReportClick = async (report: Report) => {
    setSelectedReport(report);
    await Promise.all([
      fetchReportActions(report.report_id),
      fetchContentInfo(report.reported_item_type, report.reported_item_id)
    ]);
  };

  const handleAdminAction = async () => {
    if (!selectedReport || !actionForm.actionType) return;

    try {
      setActionLoading(true);
      
      const actionDetails: any = {
        reason: actionForm.reason
      };

      if (actionForm.actionType === 'ban_user') {
        actionDetails.banType = actionForm.banType;
        if (actionForm.banType === 'temporary' && actionForm.expiresAt) {
          actionDetails.expiresAt = actionForm.expiresAt;
        }
      } else if (actionForm.actionType === 'warning' && actionForm.expiresAt) {
        actionDetails.expiresAt = actionForm.expiresAt;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${selectedReport.report_id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: actionForm.actionType,
          actionDetails,
          adminId: user.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh data
        await Promise.all([
          fetchReports(),
          fetchReportActions(selectedReport.report_id)
        ]);
        
        setShowActionModal(false);
        setActionForm({
          actionType: '',
          reason: '',
          banType: 'temporary',
          expiresAt: ''
        });
        
        alert('Action completed successfully!');
      } else {
        alert(data.error || 'Failed to complete action');
      }
    } catch (err) {
      console.error('Admin action error:', err);
      alert('Failed to complete action');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => 
    selectedStatus === 'all' || report.status === selectedStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'delete_content': return 'bg-red-100 text-red-800';
      case 'ban_user': return 'bg-purple-100 text-purple-800';
      case 'no_action': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-600 mt-2">Manage user reports and take appropriate actions</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reports</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Reports ({filteredReports.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No reports found
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.report_id}
                    onClick={() => handleReportClick(report)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedReport?.report_id === report.report_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {report.reported_item_type.toUpperCase()} #{report.reported_item_id}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Reason:</strong> {report.reason}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Reporter:</strong> {report.reporter_username}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Reported User:</strong> {report.reported_username}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
            </div>
            <div className="p-6">
              {selectedReport ? (
                <div className="space-y-6">
                  {/* Report Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Report Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Report ID:</strong> {selectedReport.report_id}</div>
                      <div><strong>Type:</strong> {selectedReport.reported_item_type}</div>
                      <div><strong>Item ID:</strong> {selectedReport.reported_item_id}</div>
                      <div><strong>Reason:</strong> {selectedReport.reason}</div>
                      <div><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedReport.status)}`}>
                          {selectedReport.status}
                        </span>
                      </div>
                      {selectedReport.description && (
                        <div><strong>Description:</strong> {selectedReport.description}</div>
                      )}
                      <div><strong>Created:</strong> {new Date(selectedReport.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Content Info */}
                  {contentInfo && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Reported Content</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {contentInfo.title && <div><strong>Title:</strong> {contentInfo.title}</div>}
                        {contentInfo.content && <div><strong>Content:</strong> {contentInfo.content.substring(0, 200)}...</div>}
                        {contentInfo.body && <div><strong>Body:</strong> {contentInfo.body.substring(0, 200)}...</div>}
                      </div>
                    </div>
                  )}

                  {/* Previous Actions */}
                  {reportActions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Previous Actions</h3>
                      <div className="space-y-2">
                        {reportActions.map((action) => (
                          <div key={action.action_id} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${getActionTypeColor(action.action_type)}`}>
                                {action.action_type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                by {action.admin_username} on {new Date(action.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {action.action_details && (
                              <div className="text-xs text-gray-600 mt-1">
                                Details: {action.action_details}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedReport.status === 'pending' && (
                    <div>
                      <button
                        onClick={() => setShowActionModal(true)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Take Action
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a report to view details
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Take Admin Action</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <select
                    value={actionForm.actionType}
                    onChange={(e) => setActionForm({...actionForm, actionType: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select action...</option>
                    <option value="warning">Issue Warning</option>
                    <option value="delete_content">Delete Content</option>
                    <option value="ban_user">Ban User</option>
                    <option value="no_action">No Action</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={actionForm.reason}
                    onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                    placeholder="Explain the reason for this action..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {actionForm.actionType === 'ban_user' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ban Type
                      </label>
                      <select
                        value={actionForm.banType}
                        onChange={(e) => setActionForm({...actionForm, banType: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="temporary">Temporary</option>
                        <option value="permanent">Permanent</option>
                      </select>
                    </div>
                    
                    {actionForm.banType === 'temporary' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expires At
                        </label>
                        <input
                          type="datetime-local"
                          value={actionForm.expiresAt}
                          onChange={(e) => setActionForm({...actionForm, expiresAt: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </>
                )}

                {actionForm.actionType === 'warning' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warning Expires At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={actionForm.expiresAt}
                      onChange={(e) => setActionForm({...actionForm, expiresAt: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminAction}
                  disabled={!actionForm.actionType || actionLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Execute Action'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
