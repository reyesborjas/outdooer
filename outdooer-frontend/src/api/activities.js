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
  
  // Get activity by id
  getActivity: async (activityId) => {
    try {
      const response = await api.get(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create new activity
  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update activity
  updateActivity: async (activityId, activityData) => {
    try {
      const response = await api.put(`/activities/${activityId}`, activityData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete activity
  deleteActivity: async (activityId) => {
    try {
      const response = await api.delete(`/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get activities created by user
  getCreatedActivities: async (userId) => {
    try {
      const response = await api.get(`/activities/created-by/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching created activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get activities led by user
  getLedActivities: async (userId) => {
    try {
      const response = await api.get(`/activities/led-by/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching led activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get activities for a team
  getTeamActivities: async (teamId) => {
    try {
      const response = await api.get(`/activities/team/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Activity Dates Management
  getActivityDates: async (activityId) => {
    try {
      const response = await api.get(`/activities/${activityId}/dates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity dates:', error.response?.data || error.message);
      throw error;
    }
  },
  
  createActivityDate: async (activityId, dateData) => {
    try {
      const response = await api.post(`/activities/${activityId}/dates`, dateData);
      return response.data;
    } catch (error) {
      console.error('Error creating activity date:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateActivityDate: async (dateId, dateData) => {
    try {
      const response = await api.put(`/activity-dates/${dateId}`, dateData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity date:', error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteActivityDate: async (dateId) => {
    try {
      const response = await api.delete(`/activity-dates/${dateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity date:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Activity Types
  getActivityTypes: async () => {
    try {
      const response = await api.get('/activity-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity types:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default activitiesApi;