// src/components/common/ProtectedRoute.jsx
import { useContext, useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import permissionService from '../../services/permissionService';

/**
 * A route component that protects routes based on authentication and permissions
 * 
 * @param {Object} props - Component props
 * @param {Array} props.requiredRoles - Array of roles that can access this route (e.g., ['admin', 'guide'])
 * @param {number} props.requiredLevel - Minimum role level required (1-4)
 * @param {string} props.requiredPermission - Specific permission required (e.g., 'create_activity')
 * @param {string} props.resourceIdParam - URL parameter name for resource ID (for permission checks)
 * @param {string} props.teamIdParam - URL parameter name for team ID (for permission checks)
 */
const ProtectedRoute = ({ 
  requiredRoles = [], 
  requiredLevel = null,
  requiredPermission = null,
  resourceIdParam = null,
  teamIdParam = null
}) => {
  const { 
    isAuthenticated, 
    isInitialized, 
    loading, 
    isAdmin,
    hasRoleLevel
  } = useContext(AuthContext);
  
  const location = useLocation();
  const params = useParams();
  
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  
  // Check permission if requiredPermission is specified
  useEffect(() => {
    const checkRoutePermission = async () => {
      if (!requiredPermission || !isAuthenticated()) return;
      
      setPermissionLoading(true);
      
      try {
        // For admins, bypass permission check
        if (isAdmin()) {
          setHasPermission(true);
          return;
        }
        
        // Get resource ID and team ID from URL params if specified
        const resourceId = resourceIdParam ? Number(params[resourceIdParam]) : null;
        const teamId = teamIdParam ? Number(params[teamIdParam]) : null;
        
        // Check permission with the service
        const result = await permissionService.checkPermission(
          requiredPermission,
          resourceId,
          teamId
        );
        
        setHasPermission(result);
      } catch (err) {
        console.error('Error checking route permission:', err);
        setHasPermission(false);
      } finally {
        setPermissionLoading(false);
      }
    };
    
    checkRoutePermission();
  }, [requiredPermission, isAuthenticated, isAdmin, params, resourceIdParam, teamIdParam]);
  
  // If auth is still initializing or loading, show a loading spinner
  if (!isInitialized || loading || permissionLoading) {
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
  
  // If permission check fails
  if (!hasPermission) {
    console.warn(`Access denied: User does not have the required permission (${requiredPermission})`);
    return <Navigate to="/unauthorized" replace />;
  }
  
  // If all checks pass, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;