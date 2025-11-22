import { useState, useEffect } from "react";
import { fetchLeagueMatches, submitPredictions } from "../api/leaguesApi";

export const useLeagueData = (league) => {
  const [matchdays, setMatchdays] = useState({});
  const [matchdayKeys, setMatchdayKeys] = useState([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [table, setTable] = useState(null);
  const [initialTable, setInitialTable] = useState(null);
  const [firstUnplayedMatchday, setFirstUnplayedMatchday] = useState(null);
  const [playedResultsCount, setPlayedResultsCount] = useState(0);
  const [totalMatchdays, setTotalMatchdays] = useState(0);
  const [loading, setLoading] = useState(false);

  //  Auto-persist predictions per user/league
  useEffect(() => {
    if (league && Object.keys(predictions).length > 0) {
      const username = localStorage.getItem("username") || "guest";
      const key = `predictions_${username}_${league.toUpperCase()}`;
      localStorage.setItem(key, JSON.stringify(predictions));
    }
  }, [predictions, league]);

  useEffect(() => {
    if (!league) return;

    setLoading(true);
    fetchLeagueMatches(league)
      .then((response) => {
        const data = response.next_matchdays || {};
        const filtered = Object.fromEntries(
          Object.entries(data).filter(([_, matches]) => matches?.length > 0)
        );

        setMatchdays(filtered);
        const keys = Object.keys(filtered).sort((a, b) => parseInt(a) - parseInt(b));
        setMatchdayKeys(keys);
        setCurrentDayIndex(0);
        setTable(null);
        setPredictions({});

        if (response.completed_table) setInitialTable(response.completed_table);
        if (response.first_unplayed_matchday) setFirstUnplayedMatchday(response.first_unplayed_matchday);
        if (response.played_results) setPlayedResultsCount(Object.keys(response.played_results).length);
        if (response.total_matchdays) setTotalMatchdays(response.total_matchdays);
      })
      .catch((err) => console.error("Error fetching league data:", err))
      .finally(() => setLoading(false));
  }, [league]);

  const handlePredictions = async (formattedPredictions) => {
    if (!league) return;
    const currentMatchday = matchdayKeys[currentDayIndex];
    const payload = { matchday: currentMatchday, predictions: formattedPredictions };

    setLoading(true);
    try {
      const result = await submitPredictions(league, payload);
      setTable(result?.table || []);
      // Keep predictions in state; don't wipe them out
      setPredictions((prev) => ({
        ...prev,
        [currentMatchday]: formattedPredictions,
      }));
      return result;
    } catch (err) {
      console.error("Error submitting predictions:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMatchdays({});
    setMatchdayKeys([]);
    setCurrentDayIndex(0);
    setPredictions({});
    setTable(null);
    setInitialTable(null);
    setFirstUnplayedMatchday(null);
    setPlayedResultsCount(0);
    setTotalMatchdays(0);
  };

  return {
    matchdays,
    matchdayKeys,
    currentDayIndex,
    setCurrentDayIndex,
    predictions,
    setPredictions,
    table,
    setTable,
    initialTable,
    firstUnplayedMatchday,
    playedResultsCount,
    totalMatchdays,
    loading,
    handlePredictions,
    handleReset,
  };
};
