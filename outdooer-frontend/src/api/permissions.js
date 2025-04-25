// src/api/permissions.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const permissionApi = {
  /**
   * Check if the current user has permission to perform an operation
   * @param {Object} data - Permission check data
   * @param {string} data.operation - The operation to check (e.g., 'create_expedition')
   * @param {number|null} data.resource_id - ID of the resource (optional)
   * @param {number|null} data.team_id - ID of the team (optional)
   * @returns {Promise<Object>} - Response with has_permission boolean
   */
  checkPermission: async (data) => {
    const response = await apiClient.post('/permissions/check', data);
    return response.data;
  },
  
  /**
   * Get all permissions available to the current user
   * @returns {Promise<Object>} - Response with permissions data
   */
  getUserPermissions: async () => {
    const response = await apiClient.get('/permissions/user');
    return response.data;
  },
  
  /**
   * Get all role configurations
   * @returns {Promise<Object>} - Response with role configurations
   */
  getRoleConfigurations: async () => {
    const response = await apiClient.get('/permissions/role-configurations');
    return response.data;
  }
};