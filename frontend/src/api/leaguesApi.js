import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "";
console.log("API Base URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

//  Interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API Response Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Core API functions 
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
      ipfs_cid: data.ipfs_cid || null,
    };
  } catch (err) {
    console.error("Error fetching league matches:", err);
    throw err;
  }
};

export const downloadLeaguePDF = async (leagueName, payload = null) => {
  try {
    let config = {
      url: `/api/download/${leagueName}`,
      method: "GET",
      responseType: "blob",
    };

    if (payload) {
      config = {
        url: `/api/download/${leagueName}`,
        method: "POST",
        data: payload,   // <-- send username here
        responseType: "blob",
      };
    }

    const response = await api(config);
    return response.data;
  } catch (err) {
    console.error("Error downloading PDF:", err);
    throw err;
  }
};

export const submitPredictions = async (leagueName, payload) => {
  const response = await api.post(`/api/predict/${leagueName}`, payload);
  return response.data;
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

// Health check 
export const checkBackendHealth = async () => {
  try {
    const response = await api.get("/health");
    console.log("Backend is healthy:", response.data);
    return true;
  } catch (err) {
    console.error("Backend health check failed:", err.message);
    return false;
  }
};

//  User prediction persistence
export async function saveUserPredictions(league, payload) {
  const response = await fetch(`${BASE_URL}/user-predictions/${league}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

// Pinata Upload Integration 
export const loadUserPredictionsFromIPFS = async (leagueName, username) => {
  try {
    const response = await api.get(`/api/load_predictions/${leagueName}`, {
      params: { username }
    });
    return response.data;
  } catch (err) {
    console.error("Error loading predictions from IPFS:", err);
    return null;
  }
};

//SubmitPredictions to include username
export const saveAllPredictionsToIPFS = async (leagueName, username, predictions) => {
  try {
    const response = await api.post(`/api/save_predictions/${leagueName}`, {
      username,
      predictions,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  } catch (err) {
    console.error("Error saving all predictions to IPFS:", err);
    throw err;
  }
};