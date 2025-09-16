import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

interface User {
  user_id: number;
  username: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  verifyCode: (code: string) => Promise<boolean>;
  createUser: (username: string) => Promise<boolean>;
  logout: () => void;
  isCodeVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const verifyCode = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        setIsCodeVerified(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Code verification error:', error);
      return false;
    }
  };

  const createUser = async (username: string): Promise<boolean> => {
    try {
      // First check if username is available
      const checkResponse = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!checkResponse.ok) {
        return false;
      }

      // Create user
      const createResponse = await fetch(`${API_BASE_URL}/api/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (createResponse.ok) {
        const userData = await createResponse.json();
        setUser(userData.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('User creation error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.username) {
        await fetch(`${API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });
      }
    } catch (e) {
      console.error('Logout cleanup error:', e);
    } finally {
      setUser(null);
      setIsCodeVerified(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      verifyCode,
      createUser,
      logout,
      isCodeVerified
    }}>
      {children}
    </AuthContext.Provider>
  );
};
