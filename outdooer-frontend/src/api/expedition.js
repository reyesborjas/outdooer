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
      throw error;
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
  
  // Get expeditions created by user
  getCreatedExpeditions: async (userId) => {
    try {
      const response = await api.get(`/expeditions/created-by/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching created expeditions:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get expeditions led by user
  getLedExpeditions: async (userId) => {
    try {
      const response = await api.get(`/expeditions/led-by/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching led expeditions:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Expedition Activities Management
  getExpeditionActivities: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/activities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition activities:', error.response?.data || error.message);
      throw error;
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
  
  // Expedition Participants
  getExpeditionParticipants: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/participants`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition participants:', error.response?.data || error.message);
      throw error;
    }
  },
  
  addExpeditionParticipant: async (expeditionId, participantData) => {
    try {
      const response = await api.post(`/expeditions/${expeditionId}/participants`, participantData);
      return response.data;
    } catch (error) {
      console.error('Error adding expedition participant:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateExpeditionParticipant: async (expeditionId, participantId, participantData) => {
    try {
      const response = await api.put(`/expeditions/${expeditionId}/participants/${participantId}`, participantData);
      return response.data;
    } catch (error) {
      console.error('Error updating expedition participant:', error.response?.data || error.message);
      throw error;
    }
  },
  
  removeExpeditionParticipant: async (expeditionId, participantId) => {
    try {
      const response = await api.delete(`/expeditions/${expeditionId}/participants/${participantId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing expedition participant:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Expedition Routes
  getExpeditionRoute: async (expeditionId) => {
    try {
      const response = await api.get(`/expeditions/${expeditionId}/route`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expedition route:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default expeditionsApi;