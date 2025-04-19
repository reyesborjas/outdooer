// src/components/common/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * A wrapper component for routes that require authentication
 * and/or specific roles to access.
 * 
 * @param {Object} props Component properties
 * @param {React.ReactNode} props.children Child components to render
 * @param {Array} props.allowedRoles Optional array of roles allowed to access the route
 * @param {boolean} props.requireAuth Whether authentication is required (default: true)
 * @returns {React.ReactNode} The protected route or redirect
 */
const ProtectedRoute = ({ children, allowedRoles, requireAuth = true }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has at least one of them
  if (allowedRoles && allowedRoles.length > 0) {
    // Make sure user and user.roles exist before checking roles
    const userRoles = user?.roles || [];
    
    // Check if the user has at least one of the required roles
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;