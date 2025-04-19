// src/components/common/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ requiredRoles = [], requireAuth = true }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  // Si requiere auth y no está logueado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere roles específicos y no los tiene
  if (requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si todo OK, renderizamos los hijos con Outlet
  return <Outlet />;
};

export default ProtectedRoute;
