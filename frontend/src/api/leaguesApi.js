import axios from 'axios';

// Use Codespace/ENV URL if available, otherwise fallback to relative path
const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch all matchdays for a given league.
 * Now includes completed table, played results, first unplayed matchday, and metadata.
 * Returns:
 * {
 *   league: "UEL" | "UCFL",
 *   completed_table: [...],
 *   next_matchdays: {...},           // only unplayed matchdays
 *   first_unplayed_matchday: "X",
 *   played_results: {...},           // {(home, away): (score)}
 *   metadata: {...}
 * }
 */
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

/**
 * Submit predictions for a specific matchday of a league.
 * Payload example:
 * {
 *   matchday: "X",
 *   predictions: {
 *      "Team A vs Team B": [2, 1],
 *      ...
 *   }
 * }
 */
export const submitPredictions = async (leagueName, payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/predict/${leagueName}`, payload);
    // Returns table after merging played results + submitted predictions
    return response.data;
  } catch (err) {
    console.error("Error submitting predictions:", err);
    throw err;
  }
};

/**
 * Download the PDF of the league table.
 * Uses the last calculated table from backend (after submitPredictions)
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

/**
 * Force refresh data from web scraping.
 * Updates local JSON cache and Pinata IPFS with latest played/unplayed matches.
 */
export const refreshLeagueData = async (leagueName) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/refresh/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error refreshing league data:", err);
    throw err;
  }
};

/**
 * Get current status of the league without fetching full match data.
 * Useful to check how many matches are played, next matchday, last scraped timestamp.
 */
export const getLeagueStatus = async (leagueName) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/status/${leagueName}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching league status:", err);
    return {};
  }
};
