import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Check if admin mode is enabled via URL parameter
  const urlParams = new URLSearchParams(location.search);
  const isAdminMode = urlParams.get('admin') === 'true';

  // If user is admin and NOT in admin mode, redirect them away from this route
  if ((user?.isAdmin || user?.role === 'admin') && !isAdminMode) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
