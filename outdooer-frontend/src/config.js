// src/config.js
// This file contains configuration settings for the frontend application

// Base URL for API requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Other global configuration settings
export const APP_NAME = 'Outdooer';
export const APP_VERSION = '1.0.0';

// Authentication settings
export const TOKEN_STORAGE_KEY = 'token';
export const AUTH_HEADER_PREFIX = 'Bearer';

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload settings
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Other API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  TEAMS: {
    BASE: '/api/teams',
    MY_TEAMS: '/api/teams/my-teams'
  },
  ACTIVITIES: {
    BASE: '/api/activities',
    MY_ACTIVITIES: '/api/activities/my-activities'
  },
  EXPEDITIONS: {
    BASE: '/api/expeditions'
  },
  PERMISSIONS: {
    CHECK: '/api/permissions/check'
  }
};