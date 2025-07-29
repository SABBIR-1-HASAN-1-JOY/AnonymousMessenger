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

const EntityRequestsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [entityRequests, setEntityRequests] = useState<EntityRequest[]>([]);
  const [stats, setStats] = useState<EntityRequestStats[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EntityRequest | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<File | null>(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.isAdmin === true;

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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEntityRequests(data.requests || []);
      } else {
        throw new Error(data.message || 'Failed to fetch entity requests');
      }
    } catch (error) {
      console.error('Error fetching entity requests:', error);
      setEntityRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/entity-requests/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || []);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats([]);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setLoading(true);
      
      // Create FormData to handle photo upload
      const formData = new FormData();
      formData.append('adminId', user?.id?.toString() || '');
      if (adminPhoto) {
        formData.append('photo', adminPhoto);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/entity-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Refresh both entity requests and stats to reflect the change
        await fetchEntityRequests();
        await fetchStats();
        setSelectedRequest(null);
        setAdminPhoto(null);
        setAdminPhotoPreview(null);
        alert('Entity request approved and entity created successfully!');
      } else {
        alert('Failed to approve request: ' + (data.message || data.error));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/entity-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          adminId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Refresh both entity requests and stats to reflect the change
        await fetchEntityRequests();
        await fetchStats();
        setSelectedRequest(null);
        setAdminPhoto(null);
        setAdminPhotoPreview(null);
        alert('Entity request rejected successfully!');
      } else {
        alert('Failed to reject request: ' + (data.message || data.error));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/entity-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Refresh both entity requests and stats to reflect the change
        await fetchEntityRequests();
        await fetchStats();
        alert('Entity request deleted successfully!');
      } else {
        alert('Failed to delete request: ' + (data.message || data.error));
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error deleting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdminPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdminPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setAdminPhoto(null);
    setAdminPhotoPreview(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entity Requests</h1>
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
                    onClick={() => {
                      setSelectedRequest(null);
                      setAdminPhoto(null);
                      setAdminPhotoPreview(null);
                    }}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.requester_name} ({selectedRequest.requester_email})</p>
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo (Optional)</label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        
                        {adminPhotoPreview && (
                          <div className="relative">
                            <img 
                              src={adminPhotoPreview} 
                              alt="Preview" 
                              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              onClick={removePhoto}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

export default EntityRequestsAdmin;
