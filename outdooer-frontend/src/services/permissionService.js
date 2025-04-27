// src/services/permissionService.js
import api from '../api';

/**
 * Service for handling permissions and roles in the Outdooer application
 */
class PermissionService {
  /**
   * Cache for permission checks to avoid redundant API calls
   * Format: { operation_resourceId_teamId: result }
   */
  permissionCache = {};
  
  /**
   * Check if a user has permission to perform an operation
   * @param {string} operation - The operation to check (e.g., 'create_activity')
   * @param {number|null} resourceId - ID of the resource (optional)
   * @param {number|null} teamId - ID of the team (optional)
   * @returns {Promise<boolean>} - Whether the user has permission
   */
  async checkPermission(operation, resourceId = null, teamId = null) {
    // Generate cache key
    const cacheKey = `${operation}_${resourceId || ''}_${teamId || ''}`;
    
    // Return cached result if available
    if (this.permissionCache[cacheKey] !== undefined) {
      return this.permissionCache[cacheKey];
    }
    
    try {
      // Call backend API to check permission
      const response = await api.post('/permissions/check', {
        operation,
        resource_id: resourceId,
        team_id: teamId
      });
      
      // Cache the result
      const hasPermission = response.data.has_permission;
      this.permissionCache[cacheKey] = hasPermission;
      
      return hasPermission;
    } catch (err) {
      console.error('Permission check error:', err);
      return false;
    }
  }
  
  /**
   * Get all permissions for the current user
   * @returns {Promise<Array>} - Array of permission objects
   */
  async getUserPermissions() {
    try {
      const response = await api.get('/permissions/user');
      return response.data.permissions || [];
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      return [];
    }
  }
  
  /**
   * Get role configurations for all levels
   * @returns {Promise<Object>} - Role configuration object
   */
  async getRoleConfigurations() {
    try {
      const response = await api.get('/permissions/role-configurations');
      return response.data.role_configurations || {};
    } catch (err) {
      console.error('Error fetching role configurations:', err);
      return {};
    }
  }
  
  /**
   * Get team-specific role permissions
   * @param {number} teamId - ID of the team
   * @returns {Promise<Object>} - Team permissions object
   */
  async getTeamPermissions(teamId) {
    try {
      const response = await api.get(`/permissions/team/${teamId}/permissions`);
      return response.data.permissions || {};
    } catch (err) {
      console.error('Error fetching team permissions:', err);
      return {};
    }
  }
  
  /**
   * Update team-specific role permissions
   * @param {number} teamId - ID of the team
   * @param {Object} permissions - Permissions object to update
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  async updateTeamPermissions(teamId, permissions) {
    try {
      await api.post(`/permissions/team/${teamId}/permissions`, { permissions });
      
      // Clear cache since permissions have changed
      this.clearCache();
      
      return true;
    } catch (err) {
      console.error('Error updating team permissions:', err);
      return false;
    }
  }
  
  /**
   * Sync team permissions with default role configurations
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>} - Whether the sync was successful
   */
  async syncTeamPermissions(teamId) {
    try {
      await api.post('/permissions/sync-permissions', { team_id: teamId });
      
      // Clear cache since permissions have changed
      this.clearCache();
      
      return true;
    } catch (err) {
      console.error('Error syncing team permissions:', err);
      return false;
    }
  }
  
  /**
   * Clear the permission cache
   */
  clearCache() {
    this.permissionCache = {};
  }
  
  /**
   * Check if user can create activities
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>}
   */
  async canCreateActivity(teamId) {
    return this.checkPermission('create_activity', null, teamId);
  }
  
  /**
   * Check if user can edit an activity
   * @param {Object} activity - Activity object
   * @returns {Promise<boolean>}
   */
  async canEditActivity(activity) {
    if (!activity) return false;
    return this.checkPermission('update_activity', activity.activity_id, activity.team_id);
  }
  
  /**
   * Check if user can delete an activity
   * @param {Object} activity - Activity object
   * @returns {Promise<boolean>}
   */
  async canDeleteActivity(activity) {
    if (!activity) return false;
    return this.checkPermission('delete_activity', activity.activity_id, activity.team_id);
  }
  
  /**
   * Check if user can create expeditions
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>}
   */
  async canCreateExpedition(teamId) {
    return this.checkPermission('create_expedition', null, teamId);
  }
  
  /**
   * Check if user can edit an expedition
   * @param {Object} expedition - Expedition object
   * @returns {Promise<boolean>}
   */
  async canEditExpedition(expedition) {
    if (!expedition) return false;
    return this.checkPermission('update_expedition', expedition.expedition_id, expedition.team_id);
  }
  
  /**
   * Check if user can delete an expedition
   * @param {Object} expedition - Expedition object
   * @returns {Promise<boolean>}
   */
  async canDeleteExpedition(expedition) {
    if (!expedition) return false;
    return this.checkPermission('delete_expedition', expedition.expedition_id, expedition.team_id);
  }
  
  /**
   * Check if user can create team invitations
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>}
   */
  async canCreateInvitation(teamId) {
    return this.checkPermission('create_invitation', null, teamId);
  }
  
  /**
   * Check if user can manage team members
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>}
   */
  async canManageTeamMembers(teamId) {
    return this.checkPermission('manage_team_members', null, teamId);
  }
  
  /**
   * Check if user can update team settings
   * @param {number} teamId - ID of the team
   * @returns {Promise<boolean>}
   */
  async canUpdateTeamSettings(teamId) {
    return this.checkPermission('update_team_settings', null, teamId);
  }
}

// Create a singleton instance
const permissionService = new PermissionService();

export default permissionService;