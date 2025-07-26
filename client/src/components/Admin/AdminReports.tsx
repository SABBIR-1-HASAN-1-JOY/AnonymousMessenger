import React, { useState, useEffect } from 'react';
import { Flag, Eye, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Report {
  report_id: number;
  reporter_user_id: number;
  reported_item_type: string;
  reported_item_id: number;
  reported_user_id: number;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  reporter_username: string;
  reported_username: string;
}

interface ReportStats {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
}

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [selectedStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = selectedStatus === 'all' 
        ? 'http://localhost:3000/api/admin/reports'
        : `http://localhost:3000/api/admin/reports/status/${selectedStatus}`;
        
      const response = await fetch(endpoint);
      
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/reports-stats');
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    }
  };

  const updateReportStatus = async (reportId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh reports and stats
        fetchReports();
        fetchStats();
      } else {
        alert('Failed to update report status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status');
    }
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchReports();
        fetchStats();
      } else {
        alert('Failed to delete report: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Spam': return 'bg-orange-100 text-orange-800';
      case 'Harassment': return 'bg-red-100 text-red-800';
      case 'Hate Speech': return 'bg-red-100 text-red-800';
      case 'Violence': return 'bg-red-100 text-red-800';
      case 'Inappropriate Content': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Management</h1>
          <p className="text-gray-600">Review and manage user reports</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.total_reports}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_reports}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed_reports}</div>
              <div className="text-sm text-gray-600">Reviewed</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.resolved_reports}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-600">{stats.dismissed_reports}</div>
              <div className="text-sm text-gray-600">Dismissed</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['pending', 'reviewed', 'resolved', 'dismissed', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    selectedStatus === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports found for the selected status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div key={report.report_id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(report.reason)}`}>
                          {report.reason}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {report.reported_item_type} #{report.reported_item_id}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-900">
                          <strong>{report.reporter_username}</strong> reported{' '}
                          <strong>{report.reported_username}</strong>'s {report.reported_item_type}
                        </p>
                        {report.description && (
                          <p className="text-sm text-gray-600 mt-1">"{report.description}"</p>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Reported on {new Date(report.created_at).toLocaleDateString()} at{' '}
                        {new Date(report.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.report_id, 'reviewed')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Mark as reviewed"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.report_id, 'resolved')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as resolved"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.report_id, 'dismissed')}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                            title="Dismiss report"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteReport(report.report_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
