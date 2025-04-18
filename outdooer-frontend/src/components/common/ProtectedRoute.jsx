// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

// Component for routes that require authentication
const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, userRoles } = useContext(AuthContext);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  // Check if user is not authenticated
  if (!isAuthenticated) {
    // Redirect to login page, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If specific roles are required, check if user has any of them
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      // User is authenticated but doesn't have the required role
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // If authenticated and has required roles (or no roles required), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;