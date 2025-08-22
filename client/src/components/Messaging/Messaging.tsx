import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: string;
  reciever: string;
  time: string;
  message?: string;
}

type MessagingMode = 'select' | 'p2p' | 'group';

interface P2PStatus {
  connected: boolean;
  waiting: boolean;
  partner?: string;
  connectionId?: number;
}

const Messaging: React.FC = () => {
  const [mode, setMode] = useState<MessagingMode>('select');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [p2pStatus, setP2pStatus] = useState<P2PStatus>({ connected: false, waiting: false });
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
    if (mode === 'p2p' && user) {
      const pollInterval = setInterval(() => {
        checkP2PStatus();
        if (p2pStatus.connected && p2pStatus.partner) {
          loadP2PMessages();
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [mode, user, p2pStatus.connected, p2pStatus.partner]);

  const checkP2PStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/check-p2p/${user.username}`);
      if (response.ok) {
        const status = await response.json();
        setP2pStatus(status);
      }
    } catch (error) {
      console.error('Error checking P2P status:', error);
    }
  };

  const joinP2P = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/join-p2p', {
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
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join P2P');
      }
    } catch (error) {
      console.error('Error joining P2P:', error);
      alert('Error joining P2P queue');
    } finally {
      setLoading(false);
    }
  };

  const loadP2PMessages = async () => {
    if (!user || !p2pStatus.partner) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/get-p2p-messages/${user.username}/${p2pStatus.partner}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendP2PMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !p2pStatus.partner) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/send-p2p-message', {
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
        loadP2PMessages(); // Reload messages
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
      await fetch('http://localhost:3000/api/leave-p2p', {
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
                disabled
                className="bg-gray-400 text-white p-6 rounded-lg cursor-not-allowed"
              >
                <h3 className="text-xl font-semibold mb-2">Group Messaging</h3>
                <p className="text-sm opacity-90">Coming Soon...</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'p2p' && (
          <div className="bg-white rounded-lg shadow">
            {!p2pStatus.connected ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  {p2pStatus.waiting ? 'Waiting for someone to connect...' : 'Joining P2P queue...'}
                </h3>
                <p className="text-gray-600">Please wait while we find you a chat partner</p>
                <button
                  onClick={() => setMode('select')}
                  className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
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
                              {new Date(msg.time).toLocaleTimeString()}
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
      </div>
    </div>
  );
};

export default Messaging;
