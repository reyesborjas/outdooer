import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          setUserRoles(userData.roles || []);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Authentication check failed:', err);
          // Clear invalid token
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, []);
  
  // Helper functions to check user roles
  const hasRole = (role) => {
    return userRoles.includes(role);
  };
  
  const isAdmin = () => hasRole('admin');
  const isGuide = () => hasRole('guide') || hasRole('master_guide');
  const isMasterGuide = () => hasRole('master_guide');
  const isExplorer = () => hasRole('explorer');
  
  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        
        // Save user data and roles
        const userData = {
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email
        };
        
        setUser(userData);
        setUserRoles(data.roles || []);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return false;
    }
  };
  
  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const data = await authApi.register(userData);
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        
        // Save user data and roles
        const newUser = {
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email
        };
        
        setUser(newUser);
        setUserRoles(data.roles || []);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      setUser(null);
      setUserRoles([]);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    userRoles,
    hasRole,
    isAdmin,
    isGuide,
    isMasterGuide,
    isExplorer,
    login,
    register,
    logout,
    setError
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};