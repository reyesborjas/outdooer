// src/api/activities.js
import api from './index';

export const activitiesApi = {
  // Get all activities
  getAllActivities: async () => {
    try {
      const response = await api.get('/activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get activities by team ID
  getActivitiesByTeam: async (teamId) => {
    try {
      const response = await api.get(`/activities/team/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get a specific activity by ID
  getActivityById: async (activityId) => {
    try {
      const response = await api.get(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get activities based on user's role (my activities)
  getMyActivities: async () => {
    try {
      const response = await api.get('/activities/my-activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching my activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Check if an activity title is unique within a team
  checkActivityTitle: async (title, teamId, activityId = null) => {
    try {
      const params = { title, team_id: teamId };
      if (activityId) params.activity_id = activityId;
      
      const response = await api.get('/activities/check-title', { params });
      return response.data;
    } catch (error) {
      console.error('Error checking title:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Check for similar activities
  checkSimilarActivities: async (teamId, activityTypeId, locationId, activityId = null) => {
    try {
      const params = { 
        team_id: teamId, 
        activity_type_id: activityTypeId, 
        location_id: locationId 
      };
      
      if (activityId) params.activity_id = activityId;
      
      const response = await api.get('/activities/check-similar', { params });
      return response.data;
    } catch (error) {
      console.error('Error checking similar activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a new activity
  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update an existing activity
  updateActivity: async (activityId, activityData) => {
    try {
      const response = await api.put(`/activities/${activityId}`, activityData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete an activity
  deleteActivity: async (activityId) => {
    try {
      const response = await api.delete(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default activitiesApi;