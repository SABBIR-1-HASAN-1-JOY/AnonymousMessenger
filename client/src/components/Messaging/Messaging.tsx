import React, { useState, useEffect, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

interface Message {
  sender: string;
  message: string;
  sent_at: string;
  expires_at?: string;
  id?: string;
  sending?: boolean; // Show spinning circle while sending
  showTick?: boolean; // Show tick for 1 second after sent
  reply_id?: number;
  reply_sender?: string;
  reply_message?: string;
  react?: string | null; // Emoji reaction to the message
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
  const [serverNowOffset, setServerNowOffset] = useState<number>(0);
  const MESSAGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Reply functionality states
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Reaction picker states
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [reactionPickerType, setReactionPickerType] = useState<'p2p' | 'group'>('p2p');

  // Group messaging states
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Emoji reaction options
  const emojiReactions = [
    { emoji: '❤️', label: 'love' },
    { emoji: '👍', label: 'like' },
    { emoji: '😂', label: 'haha' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😮', label: 'wow' },
    { emoji: '😠', label: 'angry' }
  ];

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
        const res = await fetch(`${API_BASE_URL}/api/check-p2p/${user.username}`);
        if (res.ok) {
          const status = await res.json();
          setP2pStatus(status);
          if (status.connected && status.partner) {
            setWaitStartTime(null);
            const mr = await fetch(`${API_BASE_URL}/api/get-p2p-messages/${user.username}/${status.partner}`);
            if (mr.ok) {
              const data = await mr.json();
              if (data.server_now) {
                const srv = new Date(data.server_now).getTime();
                setServerNowOffset(srv - Date.now());
              }
              // Only update with server messages if not currently sending
              setMessages(prev => {
                const serverMessages = data.messages || [];
                const localSendingMessages = prev.filter(msg => msg.sending || msg.showTick);
                return [...serverMessages, ...localSendingMessages];
              });
            }
          }
        }

        if (p2pStatus.waiting) {
          const sr = await fetch(`${API_BASE_URL}/api/queue-stats`);
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
        ? `${API_BASE_URL}/api/groups?search=${encodeURIComponent(searchTerm)}`
        : `${API_BASE_URL}/api/groups`;
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
      const r = await fetch(`${API_BASE_URL}/api/get-group-messages/${currentGroup.id}?username=${user.username}`);
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
      const r = await fetch(`${API_BASE_URL}/api/join-p2p`, {
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
    
    const messageText = message.trim();
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = new Date().toISOString();
    const replyId = replyingTo?.id ? parseInt(replyingTo.id) : null;
    
    // 1. Show message immediately with spinning circle
    const tempMessage: Message = {
      id: messageId,
      sender: user.username,
      message: messageText,
      sent_at: currentTime,
      expires_at: new Date(Date.now() + MESSAGE_TTL_MS).toISOString(),
      sending: true, // Show spinning circle
      reply_id: replyId || undefined,
      reply_sender: replyingTo?.sender,
      reply_message: replyingTo?.message
    };

    // Add to messages immediately and clear input
    setMessages(prev => [...prev, tempMessage]);
    setMessage('');
    setReplyingTo(null); // Clear reply state
    
    try {
      // Send to server
      const r = await fetch(`${API_BASE_URL}/api/send-p2p-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sender: user.username, 
          receiver: p2pStatus.partner, 
          message: messageText,
          reply_id: replyId
        }),
      });
      
      if (r.ok) {
        // 2. Show tick for 1 second when successfully sent
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, sending: false, showTick: true }
              : msg
          )
        );
        
        // Remove tick after 1 second
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, showTick: false }
                : msg
            )
          );
        }, 1000);
      } else {
        // Remove the temp message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        alert('Failed to send message');
      }
    } catch (e) {
      // Remove the temp message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      console.error('Error sending message:', e);
      alert('Error sending message');
    }
  };

  const leaveP2P = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/api/leave-p2p`, {
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
      const r = await fetch(`${API_BASE_URL}/api/create-group`, {
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
      const r = await fetch(`${API_BASE_URL}/api/join-group`, {
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
    
    const replyId = replyingTo?.id ? parseInt(replyingTo.id) : null;
    
    try {
      const r = await fetch(`${API_BASE_URL}/api/send-group-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sender: user.username, 
          groupId: currentGroup.id, 
          message: message.trim(),
          reply_id: replyId
        }),
      });
      if (r.ok) {
        setMessage('');
        setReplyingTo(null); // Clear reply state
      } else {
        alert('Failed to send message');
      }
    } catch (e) {
      console.error(e);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  // Handle message reactions
  const reactToMessage = async (messageId: string, emoji: string | null, messageType: 'p2p' | 'group') => {
    if (!user) return;
    
    try {
      const r = await fetch(`${API_BASE_URL}/api/react-to-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          messageType,
          username: user.username,
          emoji
        }),
      });
      
      if (r.ok) {
        // Update the message in the local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, react: emoji }
              : msg
          )
        );
      } else {
        const error = await r.json();
        console.error('Failed to react to message:', error);
        alert(error.error || 'Failed to react to message');
      }
    } catch (e) {
      console.error('Error reacting to message:', e);
      alert('Error reacting to message');
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
                        <div key={msg.id || index} className={`flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${msg.sender === user.username ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="font-medium text-xs mb-1">{msg.sender === user.username ? 'You' : p2pStatus.partner}</p>
                            
                            {/* Reply context */}
                            {msg.reply_id && msg.reply_sender && msg.reply_message && (
                              <div className={`mb-2 p-2 rounded border-l-2 text-xs ${msg.sender === user.username ? 'bg-blue-500/20 border-blue-300' : 'bg-gray-300/50 border-gray-400'}`}>
                                <p className="font-medium opacity-75">Replying to {msg.reply_sender === user.username ? 'You' : msg.reply_sender}:</p>
                                <p className="opacity-75 truncate">{msg.reply_message}</p>
                              </div>
                            )}
                            
                            <p>{msg.message || 'Message content'}</p>
                            
                            {/* Show existing reaction */}
                            {msg.react && (
                              <div className="flex items-center mt-2">
                                <span 
                                  className="text-lg cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => reactToMessage(msg.id!, null, 'p2p')}
                                  title="Click to remove reaction"
                                >
                                  {msg.react}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-75">Disappears in {getRemaining(msg.sent_at, MESSAGE_TTL_MS, msg.expires_at)}</p>
                              {msg.sender === user.username && (
                                <div className="flex items-center ml-2">
                                  {msg.sending ? (
                                    <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"></div>
                                  ) : msg.showTick ? (
                                    <svg className="w-3 h-3 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            
                            {/* Reaction and Reply buttons */}
                            {msg.id && !msg.sending && (
                              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {/* Reaction picker button */}
                                <button
                                  onClick={() => {
                                    if (msg.react) {
                                      // If message already has a reaction, remove it
                                      reactToMessage(msg.id!, null, 'p2p');
                                    } else {
                                      // Open reaction picker
                                      setReactionPickerMessageId(msg.id!);
                                      setReactionPickerType('p2p');
                                      setShowReactionPicker(true);
                                    }
                                  }}
                                  className={`p-1 rounded text-xs ${
                                    msg.sender === user.username ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                  }`}
                                  title={msg.react ? "Remove reaction" : "Add reaction"}
                                >
                                  {msg.react ? '💔' : '😊'}
                                </button>
                                {/* Reply button */}
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className={`p-1 rounded text-xs ${
                                    msg.sender === user.username ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                  }`}
                                  title="Reply"
                                >
                                  ↩️
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <form onSubmit={sendP2PMessage} className="p-4">
                  {/* Reply preview */}
                  {replyingTo && (
                    <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Replying to {replyingTo.sender === user.username ? 'You' : replyingTo.sender}:
                          </p>
                          <p className="text-sm text-gray-600 truncate">{replyingTo.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                          title="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors"
                    >
                      😊
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={500}
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {replyingTo ? 'Reply' : 'Send'}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 z-10">
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: any) => {
                            setMessage(prev => prev + emoji.native);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Group Browse */}
        {mode === 'group-browse' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Browse Groups</h3>
                <button onClick={() => setMode('group-create')} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Create Group</button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups by topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {groups.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No groups found. Create the first one!</div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{group.topic}</h4>
                          {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{group.member_count} members</span>
                            <span>{group.message_count} messages</span>
                            <span>Created by {group.creator}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => joinGroup(group)}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 ml-4"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Group Create */}
        {mode === 'group-create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic (required)</label>
                <input
                  type="text"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="Enter group topic..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Describe what this group is about..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
                  maxLength={300}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!newGroupTopic.trim() || loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setMode('group-browse')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
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
                    <div key={msg.id || index} className={`flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${msg.sender === user.username ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="font-medium text-xs mb-1">{msg.sender === user.username ? 'You' : msg.sender}</p>
                        
                        {/* Reply context */}
                        {msg.reply_id && msg.reply_sender && msg.reply_message && (
                          <div className={`mb-2 p-2 rounded border-l-2 text-xs ${msg.sender === user.username ? 'bg-green-500/20 border-green-300' : 'bg-gray-300/50 border-gray-400'}`}>
                            <p className="font-medium opacity-75">Replying to {msg.reply_sender === user.username ? 'You' : msg.reply_sender}:</p>
                            <p className="opacity-75 truncate">{msg.reply_message}</p>
                          </div>
                        )}
                        
                        <p>{msg.message}</p>
                        
                        {/* Show existing reaction */}
                        {msg.react && (
                          <div className="flex items-center mt-2">
                            <span 
                              className="text-lg cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => reactToMessage(msg.id!, null, 'group')}
                              title="Click to remove reaction"
                            >
                              {msg.react}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs opacity-75 mt-1">Disappears in {getRemaining(msg.sent_at, MESSAGE_TTL_MS, msg.expires_at)}</p>
                        
                        {/* Reaction and Reply buttons */}
                        {msg.id && (
                          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            {/* Reaction picker button */}
                            <button
                              onClick={() => {
                                if (msg.react) {
                                  // If message already has a reaction, remove it
                                  reactToMessage(msg.id!, null, 'group');
                                } else {
                                  // Open reaction picker
                                  setReactionPickerMessageId(msg.id!);
                                  setReactionPickerType('group');
                                  setShowReactionPicker(true);
                                }
                              }}
                              className={`p-1 rounded text-xs ${
                                msg.sender === user.username ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                              }`}
                              title={msg.react ? "Remove reaction" : "Add reaction"}
                            >
                              {msg.react ? '💔' : '😊'}
                            </button>
                            {/* Reply button */}
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className={`p-1 rounded text-xs ${
                                msg.sender === user.username ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                              }`}
                              title="Reply"
                            >
                              ↩️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={sendGroupMessage} className="p-4">
              {/* Reply preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Replying to {replyingTo.sender === user.username ? 'You' : replyingTo.sender}:
                      </p>
                      <p className="text-sm text-gray-600 truncate">{replyingTo.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                      title="Cancel reply"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors"
                >
                  😊
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={500}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {replyingTo ? 'Reply' : 'Send'}
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-10">
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        setMessage(prev => prev + emoji.native);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Reaction Picker Popup */}
      {showReactionPicker && reactionPickerMessageId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowReactionPicker(false)}
        >
          <div className="absolute inset-0 bg-black bg-opacity-25"></div>
          <div 
            className="relative bg-white rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3 text-center">Choose your reaction</h3>
            <div className="grid grid-cols-3 gap-3">
              {emojiReactions.map((reaction) => (
                <button
                  key={reaction.label}
                  onClick={() => {
                    reactToMessage(reactionPickerMessageId, reaction.emoji, reactionPickerType);
                    setShowReactionPicker(false);
                    setReactionPickerMessageId(null);
                  }}
                  className="flex flex-col items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  title={`React with ${reaction.label}`}
                >
                  <span className="text-2xl mb-1">{reaction.emoji}</span>
                  <span className="text-xs text-gray-600 capitalize">{reaction.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReactionPicker(false)}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;