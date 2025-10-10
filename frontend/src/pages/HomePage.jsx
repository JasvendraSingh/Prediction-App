import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  CircularProgress,
  Button,
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Chip,
} from "@mui/material";
import PredictionForm from "../components/PredictionForm";
import LeagueTable from "../components/LeagueTable";
import { fetchLeagueMatches, submitPredictions, downloadLeaguePDF } from "../api/leaguesApi";

const leagueColors = {
  UEL: "#ff9800",
  UCFL: "#00ff88",
};

const defaultBg =
  "radial-gradient(circle at 20% 80%, #06001fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #020027ff 0%, transparent 50%), linear-gradient(135deg, #000000ff, #1f2092ff)";
const uelBg =
  "radial-gradient(circle at 20% 80%, #ff9800 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff9800 0%, transparent 50%), linear-gradient(135deg, #000000, #1a1a1a)";
const ucflBg =
  "radial-gradient(circle at 20% 80%, #00ff88 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00ff88 0%, transparent 50%), linear-gradient(135deg, #000000, #1a1a1a)";

const leagueFullNames = {
  UEL: "UEFA Europa League",
  UCFL: "UEFA Conference League",
};

const HomePage = () => {
  const [league, setLeague] = useState("");
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

  // Fetch matchdays whenever league changes
  useEffect(() => {
    if (!league) return;
    
    setLoading(true);
    fetchLeagueMatches(league)
      .then((response) => {
        console.log("Fetched league data:", response);        
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
        // Set initial table with played matches
        if (response.completed_table) {
          setInitialTable(response.completed_table);
        }        
        // Set first unplayed matchday info
        if (response.first_unplayed_matchday) {
          setFirstUnplayedMatchday(response.first_unplayed_matchday);
        }        
        // Count played results
        if (response.played_results) {
          setPlayedResultsCount(Object.keys(response.played_results).length);
        }        
        // Set total matchdays
        if (response.total_matchdays) {
          setTotalMatchdays(response.total_matchdays);
        }
      })
      .catch((err) => {
        console.error("Error fetching league data:", err);
      })
      .finally(() => setLoading(false));
  }, [league]);

  const handlePredictions = async (formattedPredictions) => {
    if (!league) return;
    const currentMatchday = matchdayKeys[currentDayIndex];
    const payload = { matchday: currentMatchday, predictions: formattedPredictions };

    setLoading(true);
    try {
      const result = await submitPredictions(league, payload);
      // Always set table to array (even empty)
      setTable(result?.table || []);
      // Reset predictions for current matchday after submit
      setPredictions((prev) => ({ ...prev, [currentMatchday]: {} }));
      return result;
    } catch (err) {
      console.error("Error submitting predictions:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!league) return;
    try {
      const pdfBlob = await downloadLeaguePDF(league.toLowerCase());
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${league}_table.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  const handleReset = () => {
    setLeague("");
    setPredictions({});
    setTable(null);
    setInitialTable(null);
    setMatchdays({});
    setMatchdayKeys([]);
    setCurrentDayIndex(0);
    setFirstUnplayedMatchday(null);
    setPlayedResultsCount(0);
    setTotalMatchdays(0);
  };

  const currentMatchday = matchdayKeys[currentDayIndex];

  const getBgColor = () => {
    if (league === "UEL") return uelBg;
    if (league === "UCFL") return ucflBg;
    return defaultBg;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: getBgColor(),
        transition: "background 0.8s ease",
        py: 4,
        px: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          background: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${leagueColors[league] || "#00ff88"}10 2deg, transparent 4deg)`,
          opacity: 0.1,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              color: "white",
              fontWeight: 900,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              mb: 1,
            }}
          >
            PREDICT
          </Typography>
          <Box
            sx={{
              display: "inline-block",
              backgroundColor: leagueColors[league] || "#020b8aff",
              color: "white",
              px: 3,
              py: 1,
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: { xs: "1.5rem", md: "2rem" },
              letterSpacing: "0.2em",
              mb: 2,
            }}
          >
            {leagueFullNames[league] || "League"}
          </Box>
        </Box>
        <Card
          sx={{
            mb: 4,
            borderRadius: 4,
            boxShadow: `0 20px 40px rgba(0,0,0,0.3)`,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid rgba(0,0,0,0.6)`,
            position: "absolute",
            top: 0,
            right: -120,
            width: 180,
            height: 150,
          }}
        >
          <CardHeader
            title={
              <Typography variant="subtitle1" sx={{ color: "white", fontWeight: 700 }}>
                Select League
              </Typography>
            }
            sx={{
              backgroundColor: "rgba(17, 17, 17, 0)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          />
          <CardContent>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "white",
                color: "black",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option disabled value="">
                Choose League
              </option>
              <option value="UEL">UEFA Europa League</option>
              <option value="UCFL">UEFA Conference League</option>
            </select>
          </CardContent>
        </Card>

        {/* Show initial table with played matches */}
        {!loading && initialTable && !table && playedResultsCount > 0 && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              boxShadow: `0 20px 40px rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.3)`,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.2)`,
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    Current League Table
                  </Typography>
                  <Chip 
                    label={`${playedResultsCount} matches played`}
                    size="small"
                    sx={{ 
                      backgroundColor: leagueColors[league] || "#00ff88",
                      color: "black",
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={`Matchday ${firstUnplayedMatchday} coming up`}
                    size="small"
                    sx={{ 
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 600
                    }}
                  />
                </Box>
              }
              subheader={
                <Typography
                  sx={{ color: leagueColors[league] || "#00ff88", opacity: 0.8, mt: 1 }}
                >
                  Based on real results • Start predicting from Matchday {firstUnplayedMatchday}
                </Typography>
              }
              sx={{
                backgroundColor: "rgba(0,0,0,0.4)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            />
            <CardContent>
              <LeagueTable tableData={initialTable} />
            </CardContent>
          </Card>
        )}
        {loading && (
          <Box textAlign="center" sx={{ mt: 4 }}>
            <CircularProgress
              size={60}
              sx={{
                color: leagueColors[league] || "#1100ffff",
                filter: `drop-shadow(0 0 20px ${leagueColors[league] || "#1100ffff"})`,
              }}
            />
          </Box>
        )}
        {!loading && currentMatchday && !table && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              boxShadow: `0 20px 40px rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.3)`,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.2)`,
            }}
          >
            <CardHeader
              title={
                <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                  Matchday {currentMatchday}
                </Typography>
              }
              subheader={
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
                  <Typography
                    sx={{ color: leagueColors[league] || "#00ff88", opacity: 0.8 }}
                  >
                    {leagueFullNames[league] || league}
                  </Typography>
                  <Chip 
                    label={`${currentDayIndex + 1} of ${matchdayKeys.length} unplayed matchdays`}
                    size="small"
                    sx={{ 
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "white",
                      fontWeight: 600
                    }}
                  />
                </Box>
              }
              sx={{
                backgroundColor: "rgba(0,0,0,0.4)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            />
            <CardContent>
              <PredictionForm
                matches={matchdays[currentMatchday]}
                onSubmit={(formattedPreds) => {
                  setPredictions((prev) => ({ ...prev, [currentMatchday]: formattedPreds }));
                }}
                league={league}
                showSubmit={currentDayIndex === matchdayKeys.length - 1}
              />
            </CardContent>
            <CardActions sx={{ justifyContent: "space-between", p: 3 }}>
              <Button
                disabled={currentDayIndex === 0}
                onClick={() => setCurrentDayIndex((prev) => prev - 1)}
                variant="outlined"
                sx={{
                  borderRadius: "25px",
                  px: 4,
                  py: 1.5,
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "white",
                  "&:hover": {
                    borderColor: leagueColors[league] || "#00ff88",
                    backgroundColor: `rgba(${
                      league === "UEL" ? "255,152,0" : "0,255,136"
                    }, 0.1)`,
                  },
                  "&:disabled": {
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                ← Back
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const currentPreds = predictions[currentMatchday] || {};
                  const result = await handlePredictions(currentPreds);
                  // Move to next matchday only if exists
                  if (currentDayIndex < matchdayKeys.length - 1) {
                    setCurrentDayIndex((prev) => prev + 1);
                  }
                  // Table is always updated after every submission
                  if (result?.table) {
                    setTable(result.table);
                  }
                }}
                sx={{
                  borderRadius: "25px",
                  px: 4,
                  py: 1.5,
                  backgroundColor: leagueColors[league] || "#00ff88",
                  color: "black",
                  fontWeight: 700,
                  "&:hover": { 
                    opacity: 0.9,
                    backgroundColor: leagueColors[league] || "#00ff88",
                  },
                }}
              >
                {currentDayIndex === matchdayKeys.length - 1 ? "Finish →" : "Next Matchday →"}
              </Button>
            </CardActions>
          </Card>
        )}

        {!loading && table && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              boxShadow: `0 20px 40px rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.3)`,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.2)`,
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    Final League Table
                  </Typography>
                  <Chip 
                    label="Predictions Complete"
                    size="small"
                    sx={{ 
                      backgroundColor: leagueColors[league] || "#00ff88",
                      color: "black",
                      fontWeight: 600
                    }}
                  />
                </Box>
              }
              subheader={
                <Typography
                  sx={{ color: leagueColors[league] || "#00ff88", opacity: 0.8, mt: 1 }}
                >
                  Based on {playedResultsCount} real results + your predictions
                </Typography>
              }
              sx={{
                backgroundColor: "rgba(0,0,0,0.4)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            />
            <CardContent>
              <LeagueTable tableData={table} />
            </CardContent>
            <CardActions sx={{ justifyContent: "center", gap: 2, p: 3 }}>
              <Button
                variant="contained"
                onClick={handleDownload}
                sx={{
                  borderRadius: "25px",
                  px: 4,
                  py: 1.5,
                  backgroundColor: leagueColors[league] || "#00ff88",
                  color: "black",
                  fontWeight: 700,
                  "&:hover": {
                    opacity: 0.9,
                    backgroundColor: leagueColors[league] || "#00ff88",
                  },
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  borderRadius: "25px",
                  px: 4,
                  py: 1.5,
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": {
                    borderColor: leagueColors[league] || "#00ff88",
                    backgroundColor: `rgba(${
                      league === "UEL" ? "255,152,0" : "0,255,136"
                    }, 0.1)`,
                  },
                }}
              >
                Predict Again
              </Button>
            </CardActions>
          </Card>
        )}

        {!loading && (!currentMatchday || matchdayKeys.length === 0) && league && (
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              p: 4,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 3,
              border: `1px solid rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              }, 0.3)`,
            }}
          >
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 600, mb: 2 }}>
              {playedResultsCount > 0 
                ? "All Matchdays Complete!"
                : "No Matches Available"}
            </Typography>
            <Typography sx={{ color: "white", fontSize: "1.1rem", opacity: 0.8 }}>
              {playedResultsCount > 0 
                ? `All ${totalMatchdays} matchdays have been played. Check the standings above!`
                : "No matches are currently scheduled for this league."}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;