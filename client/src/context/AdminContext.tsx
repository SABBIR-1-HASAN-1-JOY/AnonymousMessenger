import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    // Check if admin=true is in URL and user is actually an admin
    const adminParam = searchParams.get('admin');
    const isAdmin = user?.isAdmin === true;
    
    if (adminParam === 'true' && isAdmin) {
      setIsAdminMode(true);
    } else {
      setIsAdminMode(false);
    }
  }, [searchParams, user]);

  const setAdminMode = (mode: boolean) => {
    const isAdmin = user?.isAdmin === true;
    if (mode && !isAdmin) {
      console.warn('Cannot enable admin mode: user is not an admin');
      return;
    }
    setIsAdminMode(mode);
  };

  return (
    <AdminContext.Provider value={{ isAdminMode, setAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
