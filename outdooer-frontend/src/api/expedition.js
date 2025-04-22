// src/api/expeditions.js
import api from './index';

export const expeditionsApi = {
  // Get all expeditions
  getAllExpeditions: async () => {
    try {
      const response = await api.get('/expeditions');
      return response.data;
    } catch (error) {
      console.error('Error fetching expeditions:', error.response?.data || error.message);
      return { expeditions: [] };
    }
  },
  
  // Get expedition by id
  getExpedition: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create new expedition
  createExpedition: async (expeditionData) => {
    try {
      const response = await api.post('/expeditions', expeditionData);
      return response.data;
    } catch (error) {
      console.error('Error creating expedition:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update expedition
  updateExpedition: async (expeditionId, expeditionData) => {
    try {
      const response = await api.put(`/expeditions/${expeditionId}`, expeditionData);
      return response.data;
    } catch (error) {
      console.error('Error updating expedition:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete expedition
  deleteExpedition: async (expeditionId) => {
    try {
      const response = await api.delete(`/expeditions/${expeditionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting expedition:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get expeditions created by user (client-side filtering solution)
  getCreatedExpeditions: async (userId) => {
    try {
      // First attempt to use the endpoint directly
      try {
        const response = await api.get(`/expeditions/created-by/${userId}`);
        return response.data;
      } catch (directError) {
        // If direct endpoint fails, fetch all expeditions and filter client-side
        console.warn('Direct endpoint not available, using client-side filtering');
        const allResponse = await api.get('/expeditions');
        
        // Filter expeditions created by this user
        const filteredExpeditions = allResponse.data.expeditions.filter(
          expedition => expedition.created_by === parseInt(userId)
        );
        
        return { expeditions: filteredExpeditions };
      }
    } catch (error) {
      console.error('Error fetching created expeditions:', error.response?.data || error.message);
      // Return empty array as fallback to prevent UI errors
      return { expeditions: [] };
    }
  },
  
  // Get expeditions led by user (client-side filtering solution)
  getLedExpeditions: async (userId) => {
    try {
      // First attempt to use the endpoint directly
      try {
        const response = await api.get(`/expeditions/led-by/${userId}`);
        return response.data;
      } catch (directError) {
        // If direct endpoint fails, fetch all expeditions and filter client-side
        console.warn('Direct endpoint not available, using client-side filtering');
        const allResponse = await api.get('/expeditions');
        
        // Filter expeditions led by this user
        const filteredExpeditions = allResponse.data.expeditions.filter(
          expedition => expedition.leader_id === parseInt(userId)
        );
        
        return { expeditions: filteredExpeditions };
      }
    } catch (error) {
      console.error('Error fetching led expeditions:', error.response?.data || error.message);
      // Return empty array as fallback to prevent UI errors
      return { expeditions: [] };
    }
  },
  
  // Expedition Activities Management
  getExpeditionActivities: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/activities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition activities:', error.response?.data || error.message);
      return { activities: [] };
    }
  },
  
  addExpeditionActivities: async (expeditionId, activitiesData) => {
    try {
      const response = await api.post(`/expeditions/${expeditionId}/activities`, activitiesData);
      return response.data;
    } catch (error) {
      console.error('Error adding expedition activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateExpeditionActivities: async (expeditionId, activitiesData) => {
    try {
      const response = await api.put(`/expeditions/${expeditionId}/activities`, activitiesData);
      return response.data;
    } catch (error) {
      console.error('Error updating expedition activities:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Expedition Participants (placeholder methods for API completeness)
  getExpeditionParticipants: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/participants`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition participants:', error.response?.data || error.message);
      return { participants: [] };
    }
  },
  
  // Expedition Locations (can be added if needed by your frontend)
  getExpeditionLocations: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition locations:', error.response?.data || error.message);
      return { locations: [] };
    }
  },
  
  // Helpers for querying expeditions by status
  getExpeditionsByStatus: async (status) => {
    try {
      // Get all expeditions and filter by status
      const response = await api.get(`/expeditions`);
      const filteredExpeditions = response.data.expeditions.filter(
        expedition => expedition.expedition_status === status
      );
      
      return { expeditions: filteredExpeditions };
    } catch (error) {
      console.error(`Error fetching ${status} expeditions:`, error.response?.data || error.message);
      return { expeditions: [] };
    }
  },
  
  // Utility function to get active expeditions
  getActiveExpeditions: async () => {
    return expeditionsApi.getExpeditionsByStatus('active');
  },
  
  // Utility function to get completed expeditions
  getCompletedExpeditions: async () => {
    return expeditionsApi.getExpeditionsByStatus('completed');
  }
};

export default expeditionsApi;