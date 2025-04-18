// src/api/auth.js
import api from './index';

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  validateInvitationCode: async (code) => {
    try {
      const response = await api.get(`/invitations/validate/${code}`);
      return response.data;
    } catch (error) {
      console.error('Invitation code validation error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  logout: async () => {
    // This might be a server call or just client-side cleanup
    localStorage.removeItem('token');
  }
};

export default authApi;