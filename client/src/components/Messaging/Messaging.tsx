import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: string;
  message: string;
  sent_at: string;
}

interface Group {
  id: number;
  topic: string;
  description?: string;
  creator: string;
  member_count: number;
  message_count: number;
  created_at: string;
}

type MessagingMode = 'select' | 'p2p' | 'group' | 'group-browse' | 'group-create' | 'group-chat';

interface P2PStatus {
  connected: boolean;
  waiting: boolean;
  partner?: string;
  connectionId?: number;
}

interface QueueStats {
  waiting: number;
  active_connections: number;
  total_active_users: number;
}

const Messaging: React.FC = () => {
  const [mode, setMode] = useState<MessagingMode>('select');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [p2pStatus, setP2pStatus] = useState<P2PStatus>({ connected: false, waiting: false });
  const [waitStartTime, setWaitStartTime] = useState<number | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  
  // Group messaging states
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Poll for P2P status when in P2P mode
  useEffect(() => {
    let pollInterval: number;
    
    const poll = async () => {
      if (!user) return;
      
      try {
        // Check P2P status
        const response = await fetch(`https://kc5m06d5-3000.asse.devtunnels.ms/api/check-p2p/${user.username}`);
        if (response.ok) {
          const status = await response.json();
          setP2pStatus(status);
          
          // Clear wait time when connected
          if (status.connected) {
            setWaitStartTime(null);
          }
          
          if (status.connected && status.partner) {
            try {
              const messagesResponse = await fetch(`https://kc5m06d5-3000.asse.devtunnels.ms/api/get-p2p-messages/${user.username}/${status.partner}`);
              if (messagesResponse.ok) {
                const data = await messagesResponse.json();
                setMessages(data.messages || []);
              }
            } catch (error) {
              console.error('Error loading messages:', error);
            }
          }
        }

        // Fetch queue stats if waiting
        if (p2pStatus.waiting) {
          try {
            const statsResponse = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/queue-stats');
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              setQueueStats(stats);
            }
          } catch (error) {
            console.error('Error loading queue stats:', error);
          }
        }
      } catch (error) {
        console.error('Error checking P2P status:', error);
      }
    };
    
    if (mode === 'p2p' && user) {
      pollInterval = window.setInterval(poll, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [mode, user, p2pStatus.connected, p2pStatus.partner, p2pStatus.waiting]);

  // Load groups when entering group browse mode
  useEffect(() => {
    if (mode === 'group-browse') {
      loadGroups();
    }
  }, [mode, searchTerm]);

  // Poll group messages when in group chat mode
  useEffect(() => {
    let pollInterval: number;
    
    if (mode === 'group-chat' && currentGroup && user) {
      loadGroupMessages(); // Load immediately
      pollInterval = window.setInterval(loadGroupMessages, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [mode, currentGroup, user]);

  const joinP2P = async () => {
    if (!user) return;
    
    setLoading(true);
    setWaitStartTime(Date.now()); // Start tracking wait time
    
    try {
      const response = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/join-p2p', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username }),
      });

      if (response.ok) {
        const result = await response.json();
        setP2pStatus(result);
        setMode('p2p');
        
        // If immediately matched, clear wait time
        if (result.matched) {
          setWaitStartTime(null);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join P2P');
        setWaitStartTime(null);
      }
    } catch (error) {
      console.error('Error joining P2P:', error);
      alert('Error joining P2P queue');
      setWaitStartTime(null);
    } finally {
      setLoading(false);
    }
  };

  const sendP2PMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !p2pStatus.partner) return;

    setLoading(true);
    try {
      const response = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/send-p2p-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: user.username,
          receiver: p2pStatus.partner,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessage('');
        // Reload messages - this will happen automatically via the polling interval
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const leaveP2P = async () => {
    if (!user) return;
    
    try {
      await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/leave-p2p', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username }),
      });
      
      // Logout user as per requirements
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error leaving P2P:', error);
    }
  };

  const handleLogout = () => {
    leaveP2P(); // This will also logout
  };

  // Group messaging functions
  const loadGroups = useCallback(async () => {
    try {
      const url = searchTerm.trim() 
        ? `https://kc5m06d5-3000.asse.devtunnels.ms/api/groups?search=${encodeURIComponent(searchTerm)}`
        : 'https://kc5m06d5-3000.asse.devtunnels.ms/api/groups';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }, [searchTerm]);

  const loadGroupMessages = useCallback(async () => {
    if (!user || !currentGroup) return;

    try {
      const response = await fetch(`https://kc5m06d5-3000.asse.devtunnels.ms/api/get-group-messages/${currentGroup.id}?username=${user.username}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  }, [user, currentGroup]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupTopic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator: user.username,
          topic: newGroupTopic.trim(),
          description: newGroupDescription.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentGroup(result.group);
        setNewGroupTopic('');
        setNewGroupDescription('');
        setMode('group-chat');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (group: Group) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/join-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          groupId: group.id,
        }),
      });

      if (response.ok) {
        setCurrentGroup(group);
        setMode('group-chat');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Error joining group');
    } finally {
      setLoading(false);
    }
  };

  const sendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !currentGroup) return;

    setLoading(true);
    try {
      const response = await fetch('https://kc5m06d5-3000.asse.devtunnels.ms/api/send-group-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: user.username,
          groupId: currentGroup.id,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessage('');
        // Messages will reload automatically via polling
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending group message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Anonymous Messenger</h1>
            <p className="text-sm text-gray-600">Welcome, {user.username}</p>
          </div>
          <div className="flex gap-2">
            {mode !== 'select' && (
              <button
                onClick={() => setMode('select')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
              >
                Back
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {mode === 'select' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Choose Messaging Mode</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={joinP2P}
                disabled={loading}
                className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">P2P Messaging</h3>
                <p className="text-sm opacity-90">Connect with one random person for private chat</p>
              </button>
              
              <button
                onClick={() => setMode('group-browse')}
                className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">Group Messaging</h3>
                <p className="text-sm opacity-90">Join or create groups for topic-based discussions</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'p2p' && (
          <div className="bg-white rounded-lg shadow">
            {!p2pStatus.connected ? (
              <div className="p-8 text-center">
                {/* Enhanced Waiting Room */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {p2pStatus.waiting ? 'Finding Your Chat Partner...' : 'Joining Queue...'}
                </h3>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-lg font-medium mb-2">
                    {p2pStatus.waiting ? 'You are in the waiting room' : 'Setting up your connection'}
                  </p>
                  <p className="text-blue-600 text-sm mb-3">
                    {p2pStatus.waiting 
                      ? 'We\'re looking for another person who wants to chat anonymously. This usually takes a few seconds.'
                      : 'Please wait while we prepare your anonymous chat session.'
                    }
                  </p>
                  
                  {/* Queue Statistics */}
                  {queueStats && p2pStatus.waiting && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center p-2 bg-white rounded-md">
                        <div className="text-lg font-bold text-blue-700">{queueStats.waiting}</div>
                        <div className="text-xs text-blue-600">Waiting</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-md">
                        <div className="text-lg font-bold text-green-700">{queueStats.active_connections}</div>
                        <div className="text-xs text-green-600">Active Chats</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-md">
                        <div className="text-lg font-bold text-gray-700">{queueStats.total_active_users}</div>
                        <div className="text-xs text-gray-600">Online</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wait Time Display */}
                {waitStartTime && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <p className="text-gray-600 text-sm">
                      Waiting time: <span className="font-mono font-semibold">
                        {Math.floor((Date.now() - waitStartTime) / 1000)}s
                      </span>
                    </p>
                  </div>
                )}

                {/* Animated Dots */}
                <div className="flex justify-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h4 className="text-yellow-800 font-semibold mb-2">While you wait:</h4>
                  <ul className="text-yellow-700 text-sm text-left space-y-1">
                    <li>• Your conversation will be completely anonymous</li>
                    <li>• Messages disappear after 5 minutes</li>
                    <li>• You can leave the chat anytime</li>
                    <li>• Be respectful to your chat partner</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setMode('select');
                      setWaitStartTime(null);
                    }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel & Go Back
                  </button>
                  
                  {p2pStatus.waiting && (
                    <button
                      onClick={() => {
                        // Refresh the queue status
                        window.location.reload();
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Refresh Queue
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b bg-green-50">
                  <p className="text-green-800 text-center">
                    Connected with <strong>{p2pStatus.partner}</strong>
                  </p>
                </div>
                
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 border-b">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === user.username 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            <p className="font-medium text-xs mb-1">
                              {msg.sender === user.username ? 'You' : p2pStatus.partner}
                            </p>
                            <p>{msg.message || 'Message content'}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {new Date(msg.sent_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendP2PMessage} className="p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !message.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Group Browse Mode */}
        {mode === 'group-browse' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold mb-4">Group Messaging</h2>
              
              {/* Search and Create Group */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search groups by topic..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={loadGroups}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
                <button
                  onClick={() => setMode('group-create')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Create Group
                </button>
              </div>
            </div>

            {/* Groups List */}
            <div className="p-6">
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No groups found. Create one to get started!</p>
                  <button
                    onClick={() => setMode('group-create')}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    Create First Group
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{group.topic}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{group.member_count} members</span>
                          <span>{group.message_count} messages</span>
                        </div>
                      </div>
                      {group.description && (
                        <p className="text-gray-600 mb-3">{group.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Created by {group.creator} • {new Date(group.created_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => joinGroup(group)}
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Join Group
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Group Mode */}
        {mode === 'group-create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
            
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic (required)
                </label>
                <input
                  type="text"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="Enter group topic (3-50 characters)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Describe what this group is about, who should join, experience level needed, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Help others understand if this group is for experts, beginners, or everyone!
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !newGroupTopic.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('group-browse')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Group Chat Mode */}
        {mode === 'group-chat' && currentGroup && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-green-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">{currentGroup.topic}</h3>
                  {currentGroup.description && (
                    <p className="text-sm text-green-600">{currentGroup.description}</p>
                  )}
                  <p className="text-sm text-green-600">
                    {currentGroup.member_count} members • Max 100 messages
                  </p>
                </div>
                <button
                  onClick={() => setMode('group-browse')}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Leave
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 border-b">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === user?.username ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === user?.username 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="font-medium text-xs mb-1">
                          {msg.sender === user?.username ? 'You' : msg.sender}
                        </p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(msg.sent_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendGroupMessage} className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
