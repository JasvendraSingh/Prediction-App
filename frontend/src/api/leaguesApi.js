import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Fetch matchdays for a given league
export const fetchLeagueMatches = async (leagueName) => {
  try {
    const response = await axios.get(`${BASE_URL}/matches/${leagueName}`);
    // Backend stores matchdays under next_matchdays
    return response.data.next_matchdays || {}; 
  } catch (err) {
    console.error("Error fetching league matches:", err);
    return {};
  }
};

// Submit predictions for a matchday
export const submitPredictions = async (leagueName, predictions) => {
  try {
    const response = await axios.post(`${BASE_URL}/predict/${leagueName}`, {
      predictions,
    });
    return response.data;
  } catch (err) {
    console.error("Error submitting predictions:", err);
    throw err;
  }
};

// Download final league table PDF
export const downloadLeaguePDF = async (leagueName) => {
  try {
    const response = await axios({
      url: `${BASE_URL}/download/${leagueName}`,
      method: 'GET',
      responseType: 'blob',
    });
    return response.data;
  } catch (err) {
    console.error("Error downloading PDF:", err);
    throw err;
  }
};
