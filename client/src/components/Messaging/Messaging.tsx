import React, { useState, useEffect, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: string;
  message: string;
  sent_at: string;
  expires_at?: string;
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

type MessagingMode = 'select' | 'p2p' | 'group-browse' | 'group-create' | 'group-chat';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [p2pStatus, setP2pStatus] = useState<P2PStatus>({ connected: false, waiting: false });
  const [waitStartTime, setWaitStartTime] = useState<number | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [serverNowOffset, setServerNowOffset] = useState<number>(0); // server_now - Date.now()
  const MESSAGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    }
  }, [user, navigate]);

  // Poll for P2P status and messages
  useEffect(() => {
    if (mode !== 'p2p' || !user) return;

    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/check-p2p/${user.username}`);
        if (res.ok) {
          const status = await res.json();
          setP2pStatus(status);
          if (status.connected && status.partner) {
            setWaitStartTime(null);
            const mr = await fetch(`http://localhost:3000/api/get-p2p-messages/${user.username}/${status.partner}`);
            if (mr.ok) {
              const data = await mr.json();
              if (data.server_now) {
                const srv = new Date(data.server_now).getTime();
                setServerNowOffset(srv - Date.now());
              }
              setMessages(data.messages || []);
            }
          }
        }

        if (p2pStatus.waiting) {
          const sr = await fetch('http://localhost:3000/api/queue-stats');
          if (sr.ok) {
            setQueueStats(await sr.json());
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    const id = window.setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [mode, user, p2pStatus.waiting]);

  // Group loading
  const loadGroups = useCallback(async () => {
    try {
      const url = searchTerm.trim()
        ? `http://localhost:3000/api/groups?search=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:3000/api/groups';
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (mode === 'group-browse') loadGroups();
  }, [mode, searchTerm, loadGroups]);

  // Tick every second to update countdowns
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const getRemaining = useCallback(
    (sentAt: string, ttlMs = MESSAGE_TTL_MS, expiresAt?: string) => {
      const target = expiresAt ? new Date(expiresAt).getTime() : new Date(sentAt).getTime() + ttlMs;
      const current = now + serverNowOffset;
      const remaining = Math.max(0, target - current);
      const mm = Math.floor(remaining / 60000);
      const ss = Math.floor((remaining % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      return `${mm}m ${ss}s`;
    },
    [now, serverNowOffset]
  );

  const loadGroupMessages = useCallback(async () => {
    if (!user || !currentGroup) return;
    try {
      const r = await fetch(`http://localhost:3000/api/get-group-messages/${currentGroup.id}?username=${user.username}`);
      if (r.ok) {
        const data = await r.json();
        if (data.server_now) {
          const srv = new Date(data.server_now).getTime();
          setServerNowOffset(srv - Date.now());
        }
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, currentGroup]);

  useEffect(() => {
    if (mode !== 'group-chat' || !currentGroup || !user) return;
    loadGroupMessages();
    const id = window.setInterval(loadGroupMessages, 3000);
    return () => clearInterval(id);
  }, [mode, currentGroup, user, loadGroupMessages]);

  // Actions
  const joinP2P = async () => {
    if (!user) return;
    setLoading(true);
    setWaitStartTime(Date.now());
    try {
      const r = await fetch('http://localhost:3000/api/join-p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      if (r.ok) {
        const result = await r.json();
        setP2pStatus(result);
        setMode('p2p');
        if (result.matched) setWaitStartTime(null);
      } else {
        const err = await r.json();
        alert(err.error || 'Failed to join P2P');
        setWaitStartTime(null);
      }
    } catch (e) {
      console.error(e);
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
      const r = await fetch('http://localhost:3000/api/send-p2p-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: user.username, receiver: p2pStatus.partner, message: message.trim() }),
      });
      if (r.ok) setMessage('');
      else alert('Failed to send message');
    } catch (e) {
      console.error(e);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const leaveP2P = async () => {
    if (!user) return;
    try {
      await fetch('http://localhost:3000/api/leave-p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
    } finally {
      logout();
      navigate('/');
    }
  };

  const handleLogout = () => leaveP2P();

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupTopic.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('http://localhost:3000/api/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: user.username, topic: newGroupTopic.trim(), description: newGroupDescription.trim() }),
      });
      if (r.ok) {
        const result = await r.json();
        setCurrentGroup(result.group);
        setNewGroupTopic('');
        setNewGroupDescription('');
        setMode('group-chat');
      } else alert('Failed to create group');
    } catch (e) {
      console.error(e);
      alert('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (group: Group) => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch('http://localhost:3000/api/join-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, groupId: group.id }),
      });
      if (r.ok) {
        setCurrentGroup(group);
        setMode('group-chat');
      } else alert('Failed to join group');
    } catch (e) {
      console.error(e);
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
      const r = await fetch('http://localhost:3000/api/send-group-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: user.username, groupId: currentGroup.id, message: message.trim() }),
      });
      if (r.ok) setMessage('');
      else alert('Failed to send message');
    } catch (e) {
      console.error(e);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
              <button onClick={() => setMode('select')} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">Back</button>
            )}
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">Logout</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {mode === 'select' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Choose Messaging Mode</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={joinP2P} disabled={loading} className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                <h3 className="text-xl font-semibold mb-2">P2P Messaging</h3>
                <p className="text-sm opacity-90">Connect with one random person for private chat</p>
              </button>
              <button onClick={() => setMode('group-browse')} className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors">
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
                <div className="mb-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{p2pStatus.waiting ? 'Finding Your Chat Partner...' : 'Joining Queue...'}</h3>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-lg font-medium mb-2">{p2pStatus.waiting ? 'You are in the waiting room' : 'Setting up your connection'}</p>
                  <p className="text-blue-600 text-sm mb-3">{p2pStatus.waiting ? "We're looking for another person who wants to chat anonymously. This usually takes a few seconds." : 'Please wait while we prepare your anonymous chat session.'}</p>
                  {queueStats && p2pStatus.waiting && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center p-2 bg-white rounded-md"><div className="text-lg font-bold text-blue-700">{queueStats.waiting}</div><div className="text-xs text-blue-600">Waiting</div></div>
                      <div className="text-center p-2 bg-white rounded-md"><div className="text-lg font-bold text-green-700">{queueStats.active_connections}</div><div className="text-xs text-green-600">Active Chats</div></div>
                      <div className="text-center p-2 bg-white rounded-md"><div className="text-lg font-bold text-gray-700">{queueStats.total_active_users}</div><div className="text-xs text-gray-600">Online</div></div>
                    </div>
                  )}
                </div>
                {waitStartTime && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-6"><p className="text-gray-600 text-sm">Waiting time: <span className="font-mono font-semibold">{Math.floor((Date.now() - waitStartTime) / 1000)}s</span></p></div>
                )}
                <div className="flex justify-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
                </div>
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
                  <button onClick={() => { setMode('select'); setWaitStartTime(null); }} className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors">Cancel & Go Back</button>
                  {p2pStatus.waiting && (
                    <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">Refresh Queue</button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b bg-green-50"><p className="text-green-800 text-center">Connected with <strong>{p2pStatus.partner}</strong></p></div>
                <div className="h-96 overflow-y-auto p-4 border-b">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === user.username ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="font-medium text-xs mb-1">{msg.sender === user.username ? 'You' : p2pStatus.partner}</p>
            <p>{msg.message || 'Message content'}</p>
              <p className="text-xs opacity-75 mt-1">Disappears in {getRemaining(msg.sent_at, MESSAGE_TTL_MS, msg.expires_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <form onSubmit={sendP2PMessage} className="p-4">
                  <div className="flex items-center gap-2 relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                      aria-label="Toggle emoji picker"
                      title="Add emoji"
                    >
                      😊
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: any) => {
                            setMessage((prev) => `${prev}${emoji.native || ''}`);
                          }}
                          theme="light"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      onFocus={() => setShowEmojiPicker(false)}
                    />
                    <button type="submit" disabled={loading || !message.trim()} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Sending...' : 'Send'}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Group Browse */}
        {mode === 'group-browse' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold mb-4">Group Messaging</h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search groups by topic..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <button onClick={loadGroups} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Search</button>
                <button onClick={() => setMode('group-create')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Create Group</button>
              </div>
            </div>
            <div className="p-6">
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No groups found. Create one to get started!</p>
                  <button onClick={() => setMode('group-create')} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">Create First Group</button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{group.topic}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500"><span>{group.member_count} members</span><span>{group.message_count} messages</span></div>
                      </div>
                      {group.description && <p className="text-gray-600 mb-3">{group.description}</p>}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">Created by {group.creator} • {new Date(group.created_at).toLocaleString()}</div>
                        <button onClick={() => joinGroup(group)} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Join Group</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Group */}
        {mode === 'group-create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic (required)</label>
                <input type="text" value={newGroupTopic} onChange={(e) => setNewGroupTopic(e.target.value)} placeholder="Enter group topic (3-50 characters)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={3} maxLength={50} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder="Describe what this group is about, who should join, experience level needed, etc." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} maxLength={500} />
                <p className="text-sm text-gray-500 mt-1">Help others understand if this group is for experts, beginners, or everyone!</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading || !newGroupTopic.trim()} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Creating...' : 'Create Group'}</button>
                <button type="button" onClick={() => setMode('group-browse')} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Group Chat */}
        {mode === 'group-chat' && currentGroup && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-green-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">{currentGroup.topic}</h3>
                  {currentGroup.description && <p className="text-sm text-green-600">{currentGroup.description}</p>}
                  <p className="text-sm text-green-600">{currentGroup.member_count} members • Max 100 messages</p>
                </div>
                <button onClick={() => setMode('group-browse')} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Leave</button>
              </div>
            </div>
            <div className="h-96 overflow-y-auto p-4 border-b">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === user?.username ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === user?.username ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="font-medium text-xs mb-1">{msg.sender === user?.username ? 'You' : msg.sender}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-75 mt-1">Disappears in {getRemaining(msg.sent_at, MESSAGE_TTL_MS, msg.expires_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={sendGroupMessage} className="p-4">
              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                  aria-label="Toggle emoji picker"
                  title="Add emoji"
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        setMessage((prev) => `${prev}${emoji.native || ''}`);
                      }}
                      theme="light"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                  onFocus={() => setShowEmojiPicker(false)}
                />
                <button type="submit" disabled={loading || !message.trim()} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Sending...' : 'Send'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
