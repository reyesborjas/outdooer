// src/config.js
// Simple configuration file for the Outdooer frontend

// Environment-specific API base URL
// For Vite, use import.meta.env instead of process.env
const getApiBaseUrl = () => {
  // If using Vite, check for environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }
  
  // Fallback for other environments or if not using Vite
  return 'http://localhost:5000';
};

// Export the base URL for API requests
export const API_BASE_URL = getApiBaseUrl();

// Export other API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  ACTIVITIES: {
    BASE: '/api/activities',
    MY_ACTIVITIES: '/api/activities/my-activities'
  },
  ACTIVITY_DATES: {
    BASE: '/api/activity-dates',
    FOR_ACTIVITY: '/api/activity-dates/for-activity'
  },
  EXPEDITIONS: {
    BASE: '/api/expeditions'
  },
  TEAMS: {
    MY_TEAMS: '/api/teams/my-teams',
    MEMBERS: '/api/teams/{team_id}/members'
  },
  PERMISSIONS: {
    CHECK: '/api/permissions/check'
  }
};