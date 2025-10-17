import React, { useState } from "react";
import { Container, Box, Typography, CircularProgress } from "@mui/material";
import { useLeagueData } from "../hooks/useLeagueData";
import { leagueColors, leagueFullNames, backgroundGradients } from "../constants/leagueConstants";
import { downloadLeaguePDF } from "../api/leaguesApi";
import LeagueSelector from "../components/LeagueSelector";
import PredictionCard from "../components/PredictionCard";
import CompactLeagueTable from "../components/CompactLeagueTable";
import ResultTableCard from "../components/ResultTableCard";
import EmptyState from "../components/EmptyState";

const HomePage = () => {
  const [league, setLeague] = useState("");
  const [updatedTable, setUpdatedTable] = useState(null);
  const [finalTable, setFinalTable] = useState(null);
  const {
    matchdays,
    matchdayKeys,
    currentDayIndex,
    setCurrentDayIndex,
    predictions,
    setPredictions,
    initialTable,
    playedResultsCount,
    totalMatchdays,
    loading,
    handlePredictions,
    handleReset,
  } = useLeagueData(league);

  const handleLeagueChange = (newLeague) => {
    setLeague(newLeague);
    setUpdatedTable(null);
    setFinalTable(null);
  };

  const handleNavigate = (direction) => {
    if (direction === "back" && currentDayIndex > 0) {
      setCurrentDayIndex((prev) => prev - 1);
    } else if (direction === "next" && currentDayIndex < matchdayKeys.length - 1) {
      setCurrentDayIndex((prev) => prev + 1);
    }
  };

  const handleSubmitPredictions = async () => {
    const currentMatchday = matchdayKeys[currentDayIndex];
    const currentPreds = predictions[currentMatchday] || {};
    
    // Validate all predictions are filled
    const allFilled = Object.values(currentPreds).every(
      (pred) => pred && pred.homeScore !== "" && pred.awayScore !== ""
    );

    if (!allFilled) {
      console.log("Not all predictions filled");
      return;
    }

    const result = await handlePredictions(currentPreds);

    // Update the table with the result from this matchday
    if (result?.table) {
      setUpdatedTable(result.table);
    }

    // Check if this is the last matchday
    const isLastMatchday = currentDayIndex === matchdayKeys.length - 1;

    if (isLastMatchday) {
      // Show final table after last matchday
      if (result?.table) {
        setFinalTable(result.table);
      }
    } else {
      // Move to next matchday
      handleNavigate("next");
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

  const handleResetAll = () => {
    setLeague("");
    setUpdatedTable(null);
    setFinalTable(null);
    handleReset();
  };

  const currentMatchday = matchdayKeys[currentDayIndex];
  const currentMatches = matchdays[currentMatchday];
  
  // Display table: updated table if available (after submission), otherwise initial table
  const displayTable = updatedTable || initialTable;

  const getBgColor = () => {
    return backgroundGradients[league] || backgroundGradients.default;
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
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
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

        <LeagueSelector league={league} onLeagueChange={handleLeagueChange} />

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

        {!loading && displayTable && !finalTable && playedResultsCount > 0 && currentMatchday && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 3, mb: 4 }}>
            <PredictionCard
              currentMatchday={currentMatchday}
              matches={currentMatches}
              league={league}
              currentDayIndex={currentDayIndex}
              matchdayKeys={matchdayKeys}
              predictions={predictions}
              setPredictions={setPredictions}
              onNavigate={handleNavigate}
              onSubmit={handleSubmitPredictions}
            />
            <CompactLeagueTable
              tableData={displayTable}
              league={league}
              playedResultsCount={playedResultsCount}
              currentDayIndex={currentDayIndex}
              matchdayKeys={matchdayKeys}
            />
          </Box>
        )}

        {!loading && finalTable && (
          <ResultTableCard
            table={finalTable}
            league={league}
            playedResultsCount={playedResultsCount}
            onDownload={handleDownload}
            onReset={handleResetAll}
          />
        )}

        {!loading && (!currentMatchday || matchdayKeys.length === 0) && league && (
          <EmptyState
            league={league}
            playedResultsCount={playedResultsCount}
            totalMatchdays={totalMatchdays}
          />
        )}
      </Container>
    </Box>
  );
};

export default HomePage;