// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if token exists in localStorage on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and get user info
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authApi.login({ email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Set user data and auth state
      setUser(data);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      return false;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authApi.register(userData);
      
      // Store token in localStorage
      localStorage.setItem('token', data.access_token);
      
      // Set user data and auth state
      setUser(data);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Helper functions to check user roles
  const isExplorer = () => {
    return user?.roles.includes('explorer');
  };
  
  const isGuide = () => {
    return user?.roles.includes('guide');
  };
  
  const isAdmin = () => {
    return user?.roles.includes('admin');
  };
  
  // Helper function to get user's role level in a specific team
  const getRoleInTeam = (teamId) => {
    if (!user?.teams) return null;
    
    const teamMembership = user.teams.find(team => team.team_id === teamId);
    return teamMembership ? teamMembership.role_level : null;
  };
  
  // Check if user is a Master Guide (Level 1) in any team
  const isMasterGuide = () => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level === 1);
  };
  
  // Check if user is a Tactical Guide (Level 2) in any team
  const isTacticalGuide = () => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level === 2);
  };
  
  // Check if user is a Technical Guide (Level 3) in any team
  const isTechnicalGuide = () => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level === 3);
  };
  
  // Check if user is a Base Guide (Level 4) in any team
  const isBaseGuide = () => {
    if (!user?.teams) return false;
    return user.teams.some(team => team.role_level === 4);
  };
  
  // Function to check if user has permission to create activities
  const canCreateActivity = () => {
    return isGuide(); // All guide levels can create activities
  };
  
  // Function to check if user has permission to edit an activity
  const canEditActivity = (activity) => {
    if (!user || !activity) return false;
    
    // Get user's role in the activity's team
    const roleLevel = getRoleInTeam(activity.team_id);
    
    if (!roleLevel) return false;
    
    // Level 1 (Master) and Level 2 (Tactical) can edit any activity
    if (roleLevel <= 2) return true;
    
    // Level 3 (Technical) can edit activities they created or lead
    if (roleLevel === 3) {
      return activity.created_by === user.user_id || activity.leader_id === user.user_id;
    }
    
    // Level 4 (Base) can only edit activities they created
    if (roleLevel === 4) {
      return activity.created_by === user.user_id;
    }
    
    return false;
  };
  
  // Function to check if user has permission to delete an activity
  const canDeleteActivity = (activity) => {
    if (!user || !activity) return false;
    
    // Get user's role in the activity's team
    const roleLevel = getRoleInTeam(activity.team_id);
    
    // Only Master Guide (Level 1) can delete activities
    return roleLevel === 1;
  };
  
  // Function to check if user has permission to create expeditions
  const canCreateExpedition = () => {
    if (!user?.teams) return false;
    
    // Only Level 1 (Master) and Level 2 (Tactical) can create expeditions
    return user.teams.some(team => team.role_level <= 2);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        isExplorer,
        isGuide,
        isAdmin,
        getRoleInTeam,
        isMasterGuide,
        isTacticalGuide,
        isTechnicalGuide,
        isBaseGuide,
        canCreateActivity,
        canEditActivity,
        canDeleteActivity,
        canCreateExpedition
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;