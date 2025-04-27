// src/api/permissions.js
import api from './index';

/**
 * API module for permissions-related endpoints
 */
export const permissionsApi = {
  /**
   * Check if the current user has permission to perform an operation
   * 
   * @param {Object} data - Permission check data
   * @param {string} data.operation - The operation to check (e.g., 'create_expedition')
   * @param {number|null} data.resource_id - ID of the resource (optional)
   * @param {number|null} data.team_id - ID of the team (optional)
   * @returns {Promise<Object>} - Response with has_permission boolean
   */
  checkPermission: async (data) => {
    try {
      const response = await api.post('/permissions/check', data);
      return response.data;
    } catch (err) {
      console.error('Permission check error:', err);
      return { has_permission: false };
    }
  },
  
  /**
   * Get all permissions available to the current user
   * 
   * @returns {Promise<Object>} - Response with permissions data
   */
  getUserPermissions: async () => {
    try {
      const response = await api.get('/permissions/user');
      return response.data;
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      return { permissions: [] };
    }
  },
  
  /**
   * Get all role configurations (global default permissions)
   * 
   * @returns {Promise<Object>} - Response with role configurations
   */
  getRoleConfigurations: async () => {
    try {
      const response = await api.get('/permissions/role-configurations');
      return response.data;
    } catch (err) {
      console.error('Error fetching role configurations:', err);
      return { role_configurations: {} };
    }
  },
  
  /**
   * Get team-specific permissions
   * 
   * @param {number} teamId - ID of the team
   * @returns {Promise<Object>} - Response with team permissions
   */
  getTeamPermissions: async (teamId) => {
    try {
      const response = await api.get(`/permissions/team/${teamId}/permissions`);
      return response.data;
    } catch (err) {
      console.error('Error fetching team permissions:', err);
      return { permissions: {} };
    }
  },
  
  /**
   * Update team-specific permissions
   * 
   * @param {number} teamId - ID of the team
   * @param {Object} permissions - Permissions object to update
   * @returns {Promise<Object>} - Response data
   */
  updateTeamPermissions: async (teamId, permissions) => {
    try {
      const response = await api.post(`/permissions/team/${teamId}/permissions`, { permissions });
      return response.data;
    } catch (err) {
      console.error('Error updating team permissions:', err);
      throw err;
    }
  },
  
  /**
   * Sync team permissions with default role configurations
   * 
   * @param {Object} data - Sync request data
   * @param {number} data.team_id - ID of the team
   * @returns {Promise<Object>} - Response data
   */
  syncTeamPermissions: async (data) => {
    try {
      const response = await api.post('/permissions/sync-permissions', data);
      return response.data;
    } catch (err) {
      console.error('Error syncing team permissions:', err);
      throw err;
    }
  }
};

export default permissionsApi;