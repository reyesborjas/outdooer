import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import permissionService from '../../services/permissionService';

const PermissionGate = ({ 
  children, 
  permission = null,
  resourceId = null,
  teamId = null,
  minRoleLevel = null,
  renderNoAccess = false,
  noAccess = null,
  fallback = null,
  forceSync = false
}) => {
  const { 
    isAdmin, 
    isAuthenticated,
    getRoleLevelInTeam
  } = useContext(AuthContext);
  
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const hasRequiredRoleLevel = () => {
    if (!isAuthenticated()) return false;
    if (isAdmin()) return true;
    if (!minRoleLevel) return true;
    
    const roleLevel = getRoleLevelInTeam(teamId);
    return roleLevel !== null && roleLevel <= minRoleLevel;
  };
  
  useEffect(() => {
    const checkPermission = async () => {
      if (!isAuthenticated()) {
        setHasPermission(false);
        setLoading(false);
        return;
      }
      
      if (isAdmin()) {
        setHasPermission(true);
        setLoading(false);
        return;
      }
      
      if (!permission && minRoleLevel) {
        setHasPermission(hasRequiredRoleLevel());
        setLoading(false);
        return;
      }
      
      // If forceSync is true, attempt to check synchronously
      if (forceSync && hasRequiredRoleLevel()) {
        setHasPermission(true);
        setLoading(false);
        return;
      }
      
      try {
        const result = await permissionService.checkPermission({
          permission,
          resourceId,
          teamId,
        });
        setHasPermission(result.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkPermission();
  }, [permission, resourceId, teamId, minRoleLevel, forceSync, isAuthenticated, isAdmin, getRoleLevelInTeam]);
  
  if (loading) {
    return fallback || null;
  }
  
  if (!hasPermission) {
    return renderNoAccess ? (noAccess || null) : null;
  }
  
  return <>{children}</>;
};

export default PermissionGate;