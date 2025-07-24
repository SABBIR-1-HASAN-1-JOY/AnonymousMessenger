import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Trash2, User, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EntityRequest {
  request_id: number;
  user_id: number;
  item_name: string;
  description: string;
  category: string;
  sector?: string;
  picture?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  requester_name: string;
  requester_email: string;
  reviewed_by_name?: string;
}

interface EntityRequestStats {
  status: string;
  count: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entityRequests, setEntityRequests] = useState<EntityRequest[]>([]);
  const [stats, setStats] = useState<EntityRequestStats[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EntityRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Demo data for when backend is unavailable
  const demoEntityRequests: EntityRequest[] = [
    {
      request_id: 1,
      user_id: 1,
      item_name: 'Tesla Model 3',
      description: 'Electric vehicle with autopilot features',
      category: 'Electronics',
      sector: 'Automotive',
      picture: undefined,
      status: 'pending',
      requested_at: '2025-07-20T10:30:00Z',
      requester_name: 'John Smith',
      requester_email: 'john@demo.com'
    },
    {
      request_id: 2,
      user_id: 2,
      item_name: 'iPhone 15 Pro',
      description: 'Latest iPhone with titanium build',
      category: 'Electronics',
      sector: 'Mobile',
      picture: undefined,
      status: 'pending',
      requested_at: '2025-07-21T14:15:00Z',
      requester_name: 'Sarah Johnson',
      requester_email: 'sarah@demo.com'
    },
    {
      request_id: 3,
      user_id: 3,
      item_name: 'MacBook Pro M3',
      description: 'Professional laptop for developers',
      category: 'Electronics',
      sector: 'Computers',
      picture: undefined,
      status: 'approved',
      reviewed_at: '2025-07-22T09:00:00Z',
      reviewed_by: 1,
      reviewed_by_name: 'Admin User',
      requested_at: '2025-07-19T16:20:00Z',
      requester_name: 'Mike Chen',
      requester_email: 'mike@demo.com'
    }
  ];

  const demoStats: EntityRequestStats[] = [
    { status: 'pending', count: '2' },
    { status: 'approved', count: '1' },
    { status: 'rejected', count: '0' },
    { status: 'total', count: '3' }
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchEntityRequests();
      fetchStats();
    }
  }, [filter, isAdmin]);

  const fetchEntityRequests = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/entity-requests' : `/api/entity-requests?status=${filter}`;
      const response = await fetch(`http://localhost:3000${url}`);
      
      if (!response.ok) {
        throw new Error('API unavailable');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEntityRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching entity requests:', error);
      // Use demo data when API is unavailable
      const filteredRequests = filter === 'all' 
        ? demoEntityRequests 
        : demoEntityRequests.filter(req => req.status === filter);
      setEntityRequests(filteredRequests);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/entity-requests/stats');
      
      if (!response.ok) {
        throw new Error('API unavailable');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use demo stats when API is unavailable
      setStats(demoStats);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/entity-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: user?.id,
          adminNotes: adminNotes
        }),
      });

      if (!response.ok) {
        throw new Error('API unavailable');
      }

      const data = await response.json();
      if (data.success) {
        fetchEntityRequests();
        fetchStats();
        setSelectedRequest(null);
        setAdminNotes('');
        alert('Entity request approved and entity created');
      } else {
        alert('Failed to approve request: ' + data.error);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      // Simulate approval in demo mode
      setEntityRequests(prev => prev.map(req => 
        req.request_id === requestId 
          ? { ...req, status: 'approved' as const, reviewed_by_name: user?.displayName }
          : req
      ));
      setSelectedRequest(null);
      setAdminNotes('');
      alert('Entity request approved (Demo Mode)');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/entity-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: user?.id,
          adminNotes: adminNotes
        }),
      });

      if (!response.ok) {
        throw new Error('API unavailable');
      }

      const data = await response.json();
      if (data.success) {
        fetchEntityRequests();
        fetchStats();
        setSelectedRequest(null);
        setAdminNotes('');
        alert('Entity request rejected');
      } else {
        alert('Failed to reject request: ' + data.error);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      // Simulate rejection in demo mode
      setEntityRequests(prev => prev.map(req => 
        req.request_id === requestId 
          ? { ...req, status: 'rejected' as const, reviewed_by_name: user?.displayName }
          : req
      ));
      setSelectedRequest(null);
      setAdminNotes('');
      alert('Entity request rejected (Demo Mode)');
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const response = await fetch(`/api/entity-requests/${requestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchEntityRequests();
        fetchStats();
        alert('Entity request deleted successfully');
      } else {
        alert('Failed to delete request: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error deleting request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage entity requests from users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.status} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{stat.status}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                </div>
                {getStatusIcon(stat.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  filter === status
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Entity Requests Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Entity Requests</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : entityRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No entity requests found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entityRequests.map((request) => (
                    <tr key={request.request_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.item_name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{request.description}</div>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <Tag className="w-3 h-3 mr-1" />
                              {request.category}
                            </span>
                            {request.sector && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                {request.sector}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.requester_name}</div>
                            <div className="text-sm text-gray-500">{request.requester_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(request.requested_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.request_id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(request.request_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(request.request_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Entity Request Details</h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entity Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.item_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sector</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.sector || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.requester_name} ({selectedRequest.requester_email})</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add notes for this decision..."
                    />
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => handleReject(selectedRequest.request_id)}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest.request_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve & Create Entity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
