// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

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

  // Permission checks
  const canCreateActivity = () => isGuide();

  const canEditActivity = (activity) => {
    if (!user || !activity) return false;
    if (isAdmin()) return true;

    const roleLevel = getRoleLevelInTeam(activity.team_id);
    if (!roleLevel) return false;

    if (roleLevel <= 2) return true;
    if (roleLevel === 3) {
      return activity.created_by === user.user_id || activity.leader_id === user.user_id;
    }
    if (roleLevel === 4) {
      return activity.created_by === user.user_id;
    }
    return false;
  };

  const canDeleteActivity = (activity) => {
    if (!user || !activity) return false;
    if (isAdmin()) return true;

    const roleLevel = getRoleLevelInTeam(activity.team_id);
    return roleLevel === 1;
  };

  const canCreateExpedition = () => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level <= 2);
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
        canCreateActivity,
        canEditActivity,
        canDeleteActivity,
        canCreateExpedition,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
