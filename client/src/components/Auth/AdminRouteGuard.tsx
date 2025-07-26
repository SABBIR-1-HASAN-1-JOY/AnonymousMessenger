import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { user } = useAuth();

  // If user is admin, redirect them away from this route
  if (user?.isAdmin || user?.role === 'admin') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
