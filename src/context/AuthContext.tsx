import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  getAllUsers: () => User[];
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

  useEffect(() => {
    // Initialize demo users if they don't exist
    const existingUsers = localStorage.getItem('jachai_users');
    if (!existingUsers) {
      const demoUsers: User[] = [
        {
          id: 'demo1',
          email: 'john@demo.com',
          displayName: 'John Smith',
          bio: 'Tech enthusiast and food lover. Always looking for the next great experience! 📱🍕',
          profilePicture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          followers: ['demo2', 'demo3'],
          following: ['demo2'],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
        },
        {
          id: 'demo2',
          email: 'sarah@demo.com',
          displayName: 'Sarah Johnson',
          bio: 'Travel blogger and restaurant critic. Sharing my adventures around the world 🌍✈️',
          profilePicture: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
          followers: ['demo1', 'demo3'],
          following: ['demo1', 'demo3'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
        },
        {
          id: 'demo3',
          email: 'mike@demo.com',
          displayName: 'Mike Chen',
          bio: 'Software developer by day, gamer by night. Love reviewing the latest tech and games. 💻🎮',
          profilePicture: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
          followers: ['demo1'],
          following: ['demo1', 'demo2'],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
        }
      ];
      localStorage.setItem('jachai_users', JSON.stringify(demoUsers));
    }

    // Check for saved user session
    const savedUser = localStorage.getItem('jachai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      if (!response.ok) {
        return false;
      }

      const userData = await response.json();
      
      // Convert server response to frontend User format
      const foundUser: User = {
        id: userData.user_id.toString(),
        email: userData.email,
        displayName: userData.username,
        bio: userData.bio || '',
        profilePicture: userData.profile_picture || undefined,
        followers: [],
        following: [],
        createdAt: userData.created_at || new Date().toISOString()
      };

      setUser(foundUser);
      localStorage.setItem('jachai_user', JSON.stringify(foundUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: displayName,
          email,
          password,
          created_at: new Date().toISOString(),
          isAdmin: false,
          bio: '',
          profile_picture: null,
          location: null
        }),
      });

      if (!response.ok) {
        return false;
      }

      const userData = await response.json();
      
      // Convert server response to frontend User format
      const newUser: User = {
        id: userData.user_id.toString(),
        email: userData.email,
        displayName: userData.username,
        bio: userData.bio || '',
        profilePicture: userData.profile_picture || undefined,
        followers: [],
        following: [],
        createdAt: userData.created_at
      };

      setUser(newUser);
      localStorage.setItem('jachai_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jachai_user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('jachai_user', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('jachai_users') || '[]');
    const userIndex = users.findIndex((u: User) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('jachai_users', JSON.stringify(users));
    }
  };

  const followUser = (userId: string) => {
    if (!user || user.following.includes(userId)) return;
    
    const newFollowing = [...user.following, userId];
    updateProfile({ following: newFollowing });

    // Update the followed user's followers list
    const users = JSON.parse(localStorage.getItem('jachai_users') || '[]');
    const targetUserIndex = users.findIndex((u: User) => u.id === userId);
    if (targetUserIndex !== -1) {
      users[targetUserIndex].followers.push(user.id);
      localStorage.setItem('jachai_users', JSON.stringify(users));
    }
  };

  const unfollowUser = (userId: string) => {
    if (!user) return;
    
    const newFollowing = user.following.filter(id => id !== userId);
    updateProfile({ following: newFollowing });

    // Update the unfollowed user's followers list
    const users = JSON.parse(localStorage.getItem('jachai_users') || '[]');
    const targetUserIndex = users.findIndex((u: User) => u.id === userId);
    if (targetUserIndex !== -1) {
      users[targetUserIndex].followers = users[targetUserIndex].followers.filter((id: string) => id !== user.id);
      localStorage.setItem('jachai_users', JSON.stringify(users));
    }
  };

  const isFollowing = (userId: string): boolean => {
    return user?.following.includes(userId) || false;
  };

  const getAllUsers = (): User[] => {
    return JSON.parse(localStorage.getItem('jachai_users') || '[]');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateProfile,
      followUser,
      unfollowUser,
      isFollowing,
      getAllUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};