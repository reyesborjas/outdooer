// src/components/common/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ requiredRoles = [], requiredLevel = null }) => {
  const { isAuthenticated, isInitialized, loading, user, isAdmin, isGuide, isMasterGuide, isExplorer, hasRoleLevel } = useContext(AuthContext);
  const location = useLocation();

  // If auth is still initializing or loading, show a loading spinner
  if (!isInitialized || loading) {
    return <LoadingSpinner />;
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there are required roles, check if user has any of them
  if (requiredRoles.length > 0) {
    let hasRequiredRole = false;

    // Check each required role
    for (const role of requiredRoles) {
      if (
        (role === 'admin' && isAdmin()) ||
        (role === 'guide' && isGuide()) ||
        (role === 'master_guide' && isMasterGuide()) ||
        (role === 'explorer' && isExplorer())
      ) {
        hasRequiredRole = true;
        break;
      }
    }

    // If user doesn't have any of the required roles
    if (!hasRequiredRole) {
      console.warn('Access denied: User does not have the required role(s)');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If there's a required team role level (e.g., Master Guide=1, Tactical=2, etc.)
  if (requiredLevel !== null) {
    if (!hasRoleLevel(requiredLevel)) {
      console.warn(`Access denied: User does not have the required team role level (${requiredLevel})`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If all checks pass, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;