import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchLeagueMatches = async (leagueName) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/matches/${leagueName}`);
    const data = response.data;

    return {
      league: data.league,
      completed_table: data.completed_table || [],
      next_matchdays: data.next_matchdays || {},
      first_unplayed_matchday: data.first_unplayed_matchday || null,
      played_results: data.played_results || {},
      metadata: data.metadata || {}
    };
  } catch (err) {
    console.error("Error fetching league matches:", err);
    return {
      league: leagueName.toUpperCase(),
      completed_table: [],
      next_matchdays: {},
      first_unplayed_matchday: null,
      played_results: {},
      metadata: {}
    };
  }
};

export const submitPredictions = async (leagueName, payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/predict/${leagueName}`, payload);
    return response.data;
  } catch (err) {
    console.error("Error submitting predictions:", err);
    throw err;
  }
};

export const downloadLeaguePDF = async (leagueName) => {
  try {
    const response = await axios({
      url: `${BASE_URL}/api/download/${leagueName}`,
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
    const response = await axios.post(`${BASE_URL}/api/refresh/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error refreshing league data:", err);
    throw err;
  }
};

export const getLeagueStatus = async (leagueName) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/status/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching league status:", err);
    return {};
  }
};
