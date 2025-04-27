// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import permissionService from '../services/permissionService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
      
      // Clear permission cache on login
      permissionService.clearCache();
      
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
      
      // Clear permission cache on register
      permissionService.clearCache();
      
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
      
      // Clear permission cache on logout
      permissionService.clearCache();
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
    const teamMembership = user.teams.find(team => team.team_id === Number(teamId));
    return teamMembership ? teamMembership.role_level : null;
  };

  // Role level checks by role type
  const isMasterGuide = () => user?.teams?.some(team => team.role_level === 1 || team.is_master_guide);
  const isTacticalGuide = () => user?.teams?.some(team => team.role_level === 2);
  const isTechnicalGuide = () => user?.teams?.some(team => team.role_level === 3);
  const isBaseGuide = () => user?.teams?.some(team => team.role_level === 4);
  
  // Check if user has a specific role level in any team
  const hasRoleLevel = (level) => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level <= level);
  };

  // Permission checks using permission service - these are async operations
  const canCreateActivity = async (teamId) => {
    return permissionService.canCreateActivity(teamId);
  };

  const canEditActivity = async (activity) => {
    return permissionService.canEditActivity(activity);
  };

  const canDeleteActivity = async (activity) => {
    return permissionService.canDeleteActivity(activity);
  };

  const canCreateExpedition = async (teamId) => {
    return permissionService.canCreateExpedition(teamId);
  };

  const canEditExpedition = async (expedition) => {
    return permissionService.canEditExpedition(expedition);
  };

  const canDeleteExpedition = async (expedition) => {
    return permissionService.canDeleteExpedition(expedition);
  };
  
  const canCreateInvitation = async (teamId) => {
    return permissionService.canCreateInvitation(teamId);
  };
  
  const canManageTeamMembers = async (teamId) => {
    return permissionService.canManageTeamMembers(teamId);
  };
  
  const canUpdateTeamSettings = async (teamId) => {
    return permissionService.canUpdateTeamSettings(teamId);
  };

  // Synchronous permission checks for UI rendering (based on role level only)
  // These are less accurate but don't require async operations
  const canCreateActivitySync = (teamId) => {
    if (isAdmin()) return true;
    const roleLevel = getRoleLevelInTeam(teamId);
    return roleLevel !== null && roleLevel <= 3; // Master, Tactical, and Technical Guides
  };

  const canEditActivitySync = (activity) => {
    if (!activity) return false;
    if (isAdmin()) return true;
    
    const roleLevel = getRoleLevelInTeam(activity.team_id);
    if (!roleLevel) return false;
    
    // Master and Tactical Guides can edit any activity
    if (roleLevel <= 2) return true;
    
    // Technical Guides can edit activities they created or lead
    if (roleLevel === 3) {
      return activity.created_by === user.user_id || activity.leader_id === user.user_id;
    }
    
    return false; // Base Guides cannot edit
  };

  const canDeleteActivitySync = (activity) => {
    if (!activity) return false;
    if (isAdmin()) return true;
    
    const roleLevel = getRoleLevelInTeam(activity.team_id);
    if (!roleLevel) return false;
    
    // Only Master Guides and Tactical Guides can delete activities
    return roleLevel <= 2;
  };

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
    return roleLevel <= 2; // Only Master and Tactical Guides
  };
  
  const canCreateInvitationSync = (teamId) => {
    if (isAdmin()) return true;
    const roleLevel = getRoleLevelInTeam(teamId);
    return roleLevel <= 2; // Only Master and Tactical Guides
  };
  
  const canManageTeamMembersSync = (teamId) => {
    if (isAdmin()) return true;
    const roleLevel = getRoleLevelInTeam(teamId);
    return roleLevel <= 2; // Only Master and Tactical Guides
  };
  
  const canUpdateTeamSettingsSync = (teamId) => {
    if (isAdmin()) return true;
    const roleLevel = getRoleLevelInTeam(teamId);
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
        hasRoleLevel,
        // Async permission checks (accurate, backend validated)
        canCreateActivity,
        canEditActivity,
        canDeleteActivity,
        canCreateExpedition,
        canEditExpedition,
        canDeleteExpedition,
        canCreateInvitation,
        canManageTeamMembers,
        canUpdateTeamSettings,
        // Sync permission checks (for UI rendering)
        canCreateActivitySync,
        canEditActivitySync,
        canDeleteActivitySync,
        canCreateExpeditionSync,
        canEditExpeditionSync,
        canDeleteExpeditionSync,
        canCreateInvitationSync,
        canManageTeamMembersSync,
        canUpdateTeamSettingsSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;