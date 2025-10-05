import axios from 'axios';

// Use Codespace/ENV URL if available, otherwise fallback to relative path
// Example: https://your-username-8000.app.github.dev
const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch all matchdays for a given league
 */
export const fetchLeagueMatches = async (leagueName) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/matches/${leagueName}`);
    // Backend sends matchdays under "next_matchdays"
    return response.data.next_matchdays || {};
  } catch (err) {
    console.error("Error fetching league matches:", err);
    return {};
  }
};

/**
 * Submit predictions for the current matchday of a league
 */
export const submitPredictions = async (leagueName, payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/predict/${leagueName}`, payload);
    return response.data;
  } catch (err) {
    console.error("Error submitting predictions:", err);
    throw err;
  }
};



/**
 * Download final league prediction table as PDF
 */
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
