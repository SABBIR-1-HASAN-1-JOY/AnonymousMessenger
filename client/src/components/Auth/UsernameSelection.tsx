import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UsernameSelection: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createUser, isCodeVerified } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isCodeVerified) {
      navigate('/');
    }
  }, [isCodeVerified, navigate]);

  const validateUsername = (username: string): boolean => {
    // Check if username contains only letters and numbers
    const isValid = /^[a-zA-Z0-9]+$/.test(username);
    return isValid && username.length >= 3 && username.length <= 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username can only contain letters and numbers (3-20 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await createUser(username);
      if (success) {
        navigate('/messaging');
      } else {
        setError('Username is already taken. Please choose another one.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isCodeVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Choose Your Username
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Pick a unique username for anonymous messaging
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter a username (letters and numbers only)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters and numbers only
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsernameSelection;
