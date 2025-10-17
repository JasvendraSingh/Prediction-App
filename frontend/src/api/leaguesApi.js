import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || '';
console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const fetchLeagueMatches = async (leagueName) => {
  try {
    const response = await api.get(`/api/matches/${leagueName}`);
    const data = response.data;
    return {
      league: data.league,
      completed_table: data.completed_table || [],
      next_matchdays: data.next_matchdays || {},
      first_unplayed_matchday: data.first_unplayed_matchday || null,
      played_results: data.played_results || {},
      metadata: data.metadata || {},
      ipfs_cid: data.ipfs_cid || null
    };
  } catch (err) {
    console.error("Error fetching league matches:", err);
    throw err; // Re-throw to handle in component
  }
};

export const submitPredictions = async (leagueName, payload) => {
  try {
    const response = await api.post(`/api/predict/${leagueName}`, payload);
    return response.data;
  } catch (err) {
    console.error("Error submitting predictions:", err);
    throw err;
  }
};

export const downloadLeaguePDF = async (leagueName) => {
  try {
    const response = await api({
      url: `/api/download/${leagueName}`,
      method: 'GET',
      responseType: 'blob',
    });
    return response.data;
  } catch (err) {
    console.error("Error downloading PDF:", err);
    throw err;
  }
};

export const refreshLeagueData = async (leagueName) => {
  try {
    const response = await api.post(`/api/refresh/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error refreshing league data:", err);
    throw err;
  }
};

export const getLeagueStatus = async (leagueName) => {
  try {
    const response = await api.get(`/api/status/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching league status:", err);
    return {};
  }
};

// Health check function
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    console.log('Backend is healthy:', response.data);
    return true;
  } catch (err) {
    console.error('Backend health check failed:', err.message);
    return false;
  }
};