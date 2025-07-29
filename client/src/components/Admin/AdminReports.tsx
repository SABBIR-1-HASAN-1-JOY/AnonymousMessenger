import React, { useState, useEffect } from 'react';
import { Flag, Eye, Check, X, Trash2, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface ReportedContent {
  type: 'post' | 'comment' | 'review';
  content?: {
    id?: number;
    post_id?: number;
    comment_id?: number;
    review_id?: number;
    text?: string;
    title?: string;
    content?: string;
    post_text?: string;
    comment_text?: string;
    reviewText?: string;
    review_text?: string;
    rating?: number;
    ratingpoint?: string;
    author?: string;
    user_name?: string;
    created_at?: string;
    upvotes?: number;
    downvotes?: number;
    is_rate_enabled?: boolean;
    entity_type?: string;
    entity_id?: number;
  };
}

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const [reportedContent, setReportedContent] = useState<Map<number, ReportedContent>>(new Map());

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [selectedStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = selectedStatus === 'all' 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/reports`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/reports/status/${selectedStatus}`;
        
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reports-stats`);
      
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reports/${reportId}/status`, {
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

  const fetchReportedContent = async (reportedItemType: string, reportedItemId: number) => {
    try {
      // Use admin content endpoint first
      let endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/admin/content/${reportedItemType}/${reportedItemId}?adminId=${user?.id}`;
      
      let response = await fetch(endpoint);
      let data = await response.json();
      
      if (data.success && data.data) {
        return {
          type: reportedItemType as 'post' | 'comment' | 'review',
          content: data.data
        };
      }
      
      // Fallback to individual endpoints if admin endpoint fails
      switch (reportedItemType) {
        case 'post':
          // Try to get post from posts endpoint - may need to be implemented
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/posts`;
          response = await fetch(endpoint);
          data = await response.json();
          if (data.success) {
            const post = data.posts?.find((p: any) => p.post_id === reportedItemId || p.id === reportedItemId);
            if (post) {
              return {
                type: 'post',
                content: post
              };
            }
          }
          break;
          
        case 'comment':
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/comments/${reportedItemId}`;
          response = await fetch(endpoint);
          data = await response.json();
          if (data.success && data.comment) {
            return {
              type: 'comment',
              content: data.comment
            };
          }
          break;
          
        case 'review':
          // Try to get review from reviews endpoint
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/reviews`;
          response = await fetch(endpoint);
          data = await response.json();
          if (data.success) {
            const review = data.reviews?.find((r: any) => r.review_id === reportedItemId || r.id === reportedItemId);
            if (review) {
              return {
                type: 'review',
                content: review
              };
            }
          }
          break;
          
        default:
          console.error('Unknown reported item type:', reportedItemType);
          return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching reported content:', error);
      return null;
    }
  };

  const viewContentDetails = async (reportedItemType: string, reportedItemId: number) => {
    // Navigate to the corresponding content page with admin mode enabled
    const adminParam = '?admin=true';
    
    switch (reportedItemType) {
      case 'post':
        navigate(`/posts/${reportedItemId}${adminParam}`);
        break;
      case 'review':
        navigate(`/reviews/${reportedItemId}${adminParam}`);
        break;
      case 'comment':
        // For comments, we need to navigate to the parent post/review
        await fetchCommentParentAndNavigate(reportedItemId);
        break;
      default:
        console.error('Unknown content type:', reportedItemType);
        alert('Unknown content type');
    }
  };

  const fetchCommentParentAndNavigate = async (commentId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/comments/${commentId}`);
      const data = await response.json();
      
      if (data.success && data.comment) {
        const comment = data.comment;
        const adminParam = '?admin=true';
        
        // Navigate to the parent entity based on the comment's entity_type
        if (comment.entity_type === 'post') {
          navigate(`/posts/${comment.entity_id}${adminParam}#comment-${commentId}`);
        } else if (comment.entity_type === 'review') {
          navigate(`/reviews/${comment.entity_id}${adminParam}#comment-${commentId}`);
        } else if (comment.entity_type === 'rate-my-work') {
          navigate(`/rate-my-work/${comment.entity_id}${adminParam}#comment-${commentId}`);
        } else {
          // Default fallback - navigate to a general comment view or entity
          navigate(`/posts/${comment.entity_id}${adminParam}#comment-${commentId}`);
        }
      } else {
        alert('Could not load comment details');
      }
    } catch (error) {
      console.error('Error fetching comment details:', error);
      alert('Error loading comment details');
    }
  };

  const toggleReportExpansion = async (reportId: number, reportedItemType: string, reportedItemId: number) => {
    const newExpandedReports = new Set(expandedReports);
    
    if (expandedReports.has(reportId)) {
      newExpandedReports.delete(reportId);
    } else {
      newExpandedReports.add(reportId);
      
      // Fetch content if not already cached
      if (!reportedContent.has(reportId)) {
        const content = await fetchReportedContent(reportedItemType, reportedItemId);
        if (content) {
          const newReportedContent = new Map(reportedContent);
          newReportedContent.set(reportId, content as ReportedContent);
          setReportedContent(newReportedContent);
        }
      }
    }
    
    setExpandedReports(newExpandedReports);
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reports/${reportId}`, {
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

  const renderReportedContent = (content: ReportedContent) => {
    if (!content.content) {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">Content could not be loaded or may have been deleted.</p>
        </div>
      );
    }

    const { type, content: item } = content;

    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 capitalize">Reported {type} Content</h4>
          <span className="text-xs text-gray-500">
            ID: {item.post_id || item.comment_id || item.review_id} | Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
        
        {type === 'post' && (
          <div className="space-y-2">
            <p className="text-gray-700">
              {item.post_text || 'No content available'}
            </p>
            {item.user_name && (
              <p className="text-sm text-gray-500">By: {item.user_name}</p>
            )}
            {item.is_rate_enabled && (
              <div className="text-sm text-gray-500">
                Rating enabled | Rating: {item.ratingpoint || 'No rating yet'}
              </div>
            )}
          </div>
        )}
        
        {type === 'comment' && (
          <div className="space-y-2">
            <p className="text-gray-700">
              {item.comment_text || 'No content available'}
            </p>
            {item.user_name && (
              <p className="text-sm text-gray-500">By: {item.user_name}</p>
            )}
            {item.entity_type && item.entity_id && (
              <p className="text-sm text-gray-500">
                Comment on {item.entity_type} #{item.entity_id}
              </p>
            )}
          </div>
        )}
        
        {type === 'review' && (
          <div className="space-y-2">
            {item.title && (
              <h5 className="font-medium text-gray-800">{item.title}</h5>
            )}
            <p className="text-gray-700">
              {item.review_text || 'No content available'}
            </p>
            {item.user_name && (
              <p className="text-sm text-gray-500">By: {item.user_name}</p>
            )}
            {item.ratingpoint && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Rating:</span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`text-sm ${i < parseFloat(item.ratingpoint || '0') ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">({item.ratingpoint}/5)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Reported on {new Date(report.created_at).toLocaleDateString()} at{' '}
                          {new Date(report.created_at).toLocaleTimeString()}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => viewContentDetails(report.reported_item_type, report.reported_item_id)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          
                          <button
                            onClick={() => toggleReportExpansion(report.report_id, report.reported_item_type, report.reported_item_id)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                          >
                            {expandedReports.has(report.report_id) ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide Preview
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show Preview
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded content */}
                      {expandedReports.has(report.report_id) && (
                        <div>
                          {reportedContent.has(report.report_id) ? (
                            renderReportedContent(reportedContent.get(report.report_id)!)
                          ) : (
                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-600">Loading content...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
