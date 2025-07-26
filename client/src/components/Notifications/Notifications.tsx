import React, { useState, useEffect } from 'react';
import { Bell, Star, MessageCircle, UserPlus, Eye, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  notification_id: string;
  recipient_user_id: string;
  actor_user_id: string;
  notification_type: 'comment' | 'vote' | 'follow' | 'rating';
  entity_type: string;
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  actor_username: string | null;
  actor_profile_picture: string | null;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      // Fallback to localhost:3000 if environment variable is not set
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/notifications/user/${user.id}`;
      
      console.log('Fetching notifications from:', url);
      console.log('User ID:', user.id);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Remove authorization header for now since this is demo mode
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete notification');
      
      // Update local state
      const deletedNotification = notifications.find(n => n.notification_id === notificationId);
      setNotifications(notifications.filter(n => n.notification_id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }

    // Navigate based on notification type and entity
    switch (notification.notification_type) {
      case 'follow':
        // Navigate to the follower's profile
        if (notification.actor_user_id) {
          navigate(`/profile/${notification.actor_user_id}`);
        }
        break;
      
      case 'comment':
        // Navigate to the feed with highlighted content for comments
        // Include actor_user_id to highlight the specific comment from that user
        const highlightComment = notification.actor_user_id ? `&highlightUser=${notification.actor_user_id}` : '';
        
        if (notification.entity_type === 'post' && notification.entity_id) {
          navigate(`/feed?highlight=post-${notification.entity_id}${highlightComment}#comments`);
        } else if (notification.entity_type === 'rate-my-work' && notification.entity_id) {
          navigate(`/feed?highlight=rate-my-work-${notification.entity_id}${highlightComment}#comments`);
        } else if (notification.entity_type === 'review' && notification.entity_id) {
          navigate(`/feed?highlight=review-${notification.entity_id}${highlightComment}#comments`);
        } else {
          // Fallback to feed
          navigate('/feed');
        }
        break;
      
      case 'vote':
        // Navigate to the voted content
        if (notification.entity_type === 'post' && notification.entity_id) {
          navigate(`/posts/${notification.entity_id}`);
        } else if (notification.entity_type === 'rate-my-work' && notification.entity_id) {
          navigate(`/rate-my-work/${notification.entity_id}`);
        } else if (notification.entity_type === 'review' && notification.entity_id) {
          navigate(`/reviews/${notification.entity_id}`);
        } else {
          // Fallback to feed
          navigate('/feed');
        }
        break;
      
      case 'rating':
        // Navigate to the rated rate-my-work content
        if (notification.entity_type === 'rate-my-work' && notification.entity_id) {
          navigate(`/rate-my-work/${notification.entity_id}`);
        } else {
          // Fallback to feed
          navigate('/feed');
        }
        break;
      
      default:
        // Default to feed page
        navigate('/feed');
        console.log('Unknown notification type:', notification.notification_type);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view notifications</h2>
        </div>
      </div>
    );
  }

  // Admin restriction - redirect admins away from notifications
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            Notifications are only available for regular users. As an admin, please use the admin dashboard.
          </p>
          <button 
            onClick={() => navigate('/admin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Notifications</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchNotifications}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'rating':
        return <Star className="w-5 h-5 text-yellow-600" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'vote':
        return <Star className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Stay updated with your activity and interactions. Click on any notification to view the content.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {unreadCount} unread
                </div>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-md">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start">
                    {/* Clickable notification content */}
                    <div 
                      className="flex-1 p-6 cursor-pointer flex items-start hover:bg-gray-100 rounded-l-lg transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                      title="Click to view content"
                    >
                      <div className="flex-shrink-0 mr-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 p-6 pl-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.notification_id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600">
                You'll see notifications here when people interact with your content
              </p>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Comments on your posts</h3>
                <p className="text-sm text-gray-500">Get notified when someone comments on your posts</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Ratings on your work</h3>
                <p className="text-sm text-gray-500">Get notified when someone rates your "Rate My Work" posts</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">New followers</h3>
                <p className="text-sm text-gray-500">Get notified when someone follows you</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Votes on your content</h3>
                <p className="text-sm text-gray-500">Get notified when someone upvotes or downvotes your content</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;