// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { permissionApi } from '../api/permissions'; // New API for checking permissions

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionCache, setPermissionCache] = useState({});

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('token', data.access_token);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('token', data.access_token);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      setPermissionCache({}); // Clear permission cache on logout
    }
  };

  // Authentication status
  const isAuthenticated = () => !!user;

  // Role checks
  const isAdmin = () => user?.roles?.includes('admin');
  const isGuide = () => user?.roles?.includes('guide');
  const isExplorer = () => user?.roles?.includes('explorer');

  // Team role checks
  const getRoleLevelInTeam = (teamId) => {
    if (!user?.teams) return null;
    const teamMembership = user.teams.find(team => team.team_id === teamId);
    return teamMembership ? teamMembership.role_level : null;
  };

  const isMasterGuide = () => user?.teams?.some(team => team.role_level === 1 || team.is_master_guide);
  const isTacticalGuide = () => user?.teams?.some(team => team.role_level === 2);
  const isTechnicalGuide = () => user?.teams?.some(team => team.role_level === 3);
  const isBaseGuide = () => user?.teams?.some(team => team.role_level === 4);

  // Permission check helper with backend validation and caching
  const checkPermission = async (operation, resourceId = null, teamId = null) => {
    if (isAdmin()) return true; // Admins always have permission
    
    if (!user) return false;
    
    // Generate cache key
    const cacheKey = `${operation}_${resourceId || ''}_${teamId || ''}`;
    
    // Check cache first
    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }
    
    try {
      // Call backend permission service
      const response = await permissionApi.checkPermission({
        operation,
        resource_id: resourceId,
        team_id: teamId
      });
      
      // Update cache
      setPermissionCache(prev => ({
        ...prev,
        [cacheKey]: response.has_permission
      }));
      
      return response.has_permission;
    } catch (err) {
      console.error('Permission check error:', err);
      return false;
    }
  };

  // Permission checks - these now check with the backend
  const canCreateActivity = async (teamId) => {
    return checkPermission('create_activity', null, teamId);
  };

  const canEditActivity = async (activity) => {
    if (!activity) return false;
    return checkPermission('update_activity', activity.id, activity.team_id);
  };

  const canDeleteActivity = async (activity) => {
    if (!activity) return false;
    return checkPermission('delete_activity', activity.id, activity.team_id);
  };

  const canCreateExpedition = async (teamId) => {
    return checkPermission('create_expedition', null, teamId);
  };

  const canEditExpedition = async (expedition) => {
    if (!expedition) return false;
    return checkPermission('update_expedition', expedition.id, expedition.team_id);
  };

  const canDeleteExpedition = async (expedition) => {
    if (!expedition) return false;
    return checkPermission('delete_expedition', expedition.id, expedition.team_id);
  };

  // Synchronous permission checks for UI rendering (based on role level only)
  // These are less accurate but don't require async operations
  const canCreateExpeditionSync = (teamId) => {
    if (isAdmin()) return true;
    const roleLevel = getRoleLevelInTeam(teamId);
    return roleLevel !== null && roleLevel <= 2; // Only Master and Tactical Guides
  };

  const canEditExpeditionSync = (expedition) => {
    if (!expedition) return false;
    if (isAdmin()) return true;
    
    const roleLevel = getRoleLevelInTeam(expedition.team_id);
    if (!roleLevel) return false;
    
    if (roleLevel <= 2) return true; // Master and Tactical Guides
    if (roleLevel === 3) { // Technical Guide
      return expedition.created_by === user.user_id || expedition.leader_id === user.user_id;
    }
    return false; // Base Guides cannot edit
  };

  const canDeleteExpeditionSync = (expedition) => {
    if (!expedition) return false;
    if (isAdmin()) return true;
    
    const roleLevel = getRoleLevelInTeam(expedition.team_id);
    return roleLevel === 1; // Only Master Guides
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isInitialized,
        setUser,
        setError,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isGuide,
        isExplorer,
        isMasterGuide,
        isTacticalGuide,
        isTechnicalGuide,
        isBaseGuide,
        getRoleLevelInTeam,
        // Async permission checks (accurate, backend validated)
        canCreateActivity,
        canEditActivity,
        canDeleteActivity,
        canCreateExpedition,
        canEditExpedition,
        canDeleteExpedition,
        // Sync permission checks (for UI rendering)
        canCreateExpeditionSync,
        canEditExpeditionSync,
        canDeleteExpeditionSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;