// src/services/api.service.js
import axios from 'axios';

// Get API base URL from environment variable
function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!envUrl) {
    console.error('❌ VITE_API_BASE_URL is not set in environment variables!');
    console.error('💡 Create a .env file with: VITE_API_BASE_URL=http://localhost:5000/api');
    throw new Error('VITE_API_BASE_URL environment variable is required');
  }
  
  if (import.meta.env.DEV) {
    console.log('✅ Using API base URL:', envUrl);
  }
  
  return envUrl;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  transformResponse: [
    function (data, headers) {
      const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
      
      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        try {
          if (typeof data === 'string') {
            return JSON.parse(data);
          }
          return data;
        } catch (e) {
          console.warn('Failed to parse JSON response:', e);
          return data;
        }
      }
      
      return data;
    }
  ]
});

// Log the base URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 API Configuration:');
  console.log('  Base URL:', apiClient.defaults.baseURL);
  console.log('  Environment mode:', import.meta.env.MODE);
}

// Add request interceptor to attach token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  error => {
    if (error.response) {
      const { status, data, headers } = error.response;    
      const url = error.config?.url || '';
      
      const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
      const isNonJsonResponse = typeof data === 'string' || 
                               contentType.includes('text/html') || 
                               contentType.includes('text/xml');
      
      if (import.meta.env.DEV) {
        console.error(`❌ ${status} ${url}`, isNonJsonResponse ? `[Non-JSON response]` : data);
      }    
      
      // Handle unauthorized - redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }    
      
      // Handle forbidden
      if (status === 403) {
        const backendMessage = (typeof data === 'string') ? data : (data?.message || data?.title);
        return Promise.reject(new Error(backendMessage || 'Access denied. Insufficient permissions.'));
      }    
      
      // Handle server errors (500+)
      if (status >= 500) {
        let errorMessage = `Server error (${status}).`;
        if (data?.message) {
          errorMessage = data.message;
        }
        error.userMessage = errorMessage;
        return Promise.reject(error);
      }    
      
      const message = data?.message || data?.title || data?.error || 'An error occurred';
      error.userMessage = message;
      return Promise.reject(error);
    }   
    
    // Network errors
    if (error.request) {
      const isCorsError = !error.response && 
                         (error.message?.includes('CORS') || 
                          error.code === 'ERR_NETWORK');
      
      if (isCorsError) {
        const frontendOrigin = window.location.origin;
        const backendUrl = apiClient.defaults.baseURL;
        
        let errorMessage = `CORS Configuration Error: The backend API at ${backendUrl} is not configured to allow requests from ${frontendOrigin}.`;
        
        console.error('🚫 CORS Error:', { frontendOrigin, backendUrl });
        
        const corsError = new Error(errorMessage);
        corsError.isCorsError = true;
        return Promise.reject(corsError);
      }
      
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
     
    return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
  }
);

// Auth Service
export const authService = {
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      const userData = { ...response.data.user };
      if (userData.role && !userData.roles) {
        userData.roles = [userData.role];
      } else if (!userData.roles) {
        userData.roles = [];
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      const userData = { ...response.data.user };
      if (userData.role && !userData.roles) {
        userData.roles = [userData.role];
      } else if (!userData.roles) {
        userData.roles = [];
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
};

// User Service
export const userService = {
  async getAll() {
    const response = await apiClient.get('/users');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async create(user) {
    const response = await apiClient.post('/users', user);
    return response.data;
  },

  async update(id, user) {
    const response = await apiClient.put(`/users/${id}`, user);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  async resetPassword(userId, resetData) {
    const response = await apiClient.post(`/users/${userId}/reset-password`, resetData);
    return response.data;
  }
};

// Utility function to get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  return !!(token && user);
};

// Utility function to check user role
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  
  return user.role === role;
};

// Utility function to check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  if (!user || !Array.isArray(roles)) return false;
  
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(userRole => roles.includes(userRole));
  }
  
  return roles.includes(user.role);
};

// Officer Service
export const officerService = {
  async getAll() {
    const response = await apiClient.get('/officers');
    return response.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/officers/${id}`);
    return response.data;
  },

  async create(officer) {
    const response = await apiClient.post('/officers', officer);
    return response.data;
  },

  async update(id, officer) {
    const response = await apiClient.put(`/officers/${id}`, officer);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/officers/${id}`);
    return response.data;
  }
};

// Shift/Rota Service
export const rotaService = {
  async getShifts(params = {}) {
    const response = await apiClient.get('/shifts', { params });
    return response.data;
  },

  async generateWeekRota(weekStart) {
    const response = await apiClient.post('/shifts/generate', { week_start: weekStart });
    return response.data;
  },

  async getWeekRotation(weekStart) {
    const response = await apiClient.get('/shifts/rotation', { params: { week_start: weekStart } });
    return response.data;
  },

  async getWeekRota(weekStart) {
    const response = await apiClient.get('/rota/week', { params: { week_start: weekStart } });
    return response.data;
  },

  getWeekRotaPdfUrl(weekStart) {
    return `${apiClient.defaults.baseURL}/rota/week/pdf?week_start=${weekStart}`;
  },

  async importState(weekStart, dayShiftTeam) {
    const response = await apiClient.post('/admin/import-state', {
      week_start: weekStart,
      day_shift_team: dayShiftTeam
    });
    return response.data;
  },

  async importShiftsCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/import-shifts/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async importOfficersCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/import-officers/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getOfficersTemplateUrl() {
    return `${apiClient.defaults.baseURL}/admin/template/officers`;
  },

  getShiftsTemplateUrl() {
    return `${apiClient.defaults.baseURL}/admin/template/shifts`;
  }
};

export default apiClient;
