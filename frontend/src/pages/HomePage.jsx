import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useLeagueData } from "../hooks/useLeagueData";
import {
  leagueColors,
  leagueFullNames,
  backgroundGradients,
} from "../constants/leagueConstants";

import { downloadLeaguePDF, saveAllPredictionsToIPFS } from "../api/leaguesApi";

import LeagueSelector from "../components/LeagueSelector";
import PredictionCard from "../components/PredictionCard";
import CompactLeagueTable from "../components/CompactLeagueTable";
import ResultTableCard from "../components/ResultTableCard";
import EmptyState from "../components/EmptyState";

const HomePage = () => {
  const navigate = useNavigate();

  const [league, setLeague] = useState("");
  const [updatedTable, setUpdatedTable] = useState(null);
  const [finalTable, setFinalTable] = useState(null);

  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
  } = useLeagueData(league === "fifa2026" ? null : league);

  useEffect(() => {
    if (league === "fifa2026") {
      navigate("/fifa/playoffs");
    }
  }, [league, navigate]);

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

    const allFilled = Object.values(currentPreds).every(
      (pred) => pred && pred.homeScore !== "" && pred.awayScore !== ""
    );

    if (!allFilled) return;

    setPredictions((prev) => ({
      ...prev,
      [currentMatchday]: currentPreds,
    }));

    const result = await handlePredictions(currentPreds);

    if (result?.table) {
      setUpdatedTable(result.table);
    }

    const isLast = currentDayIndex === matchdayKeys.length - 1;

    if (isLast) {
      if (result?.table) {
        setFinalTable(result.table);
        const storedUsername =
          localStorage.getItem("username") || username || "guest";

        const key = `predictions_${storedUsername}_${league.toUpperCase()}`;
        const allPreds = JSON.parse(localStorage.getItem(key) || "{}");

        try {
          await saveAllPredictionsToIPFS(
            league.toLowerCase(),
            storedUsername,
            allPreds
          );
        } catch (e) {
          console.error("Failed to save predictions:", e);
        }
      }
    } else {
      handleNavigate("next");
    }
  };

  const handleDownload = async () => {
    if (!league) return;

    try {
      const storedUsername =
        localStorage.getItem("username") || username || "guest";

      const pdfBlob = await downloadLeaguePDF(league.toLowerCase(), {
        username: storedUsername,
      });

      const url = window.URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" })
      );
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

  const handleLogin = () => {
    const trimmed = username.trim();
    if (trimmed !== "") {
      localStorage.setItem("username", trimmed);
      setUsername(trimmed);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    localStorage.removeItem("username");
    handleResetAll();
  };

  const currentMatchday = matchdayKeys[currentDayIndex];
  const currentMatches = matchdays[currentMatchday];
  const displayTable = updatedTable || initialTable;

  const getBgColor = () => {
    return backgroundGradients[league] || backgroundGradients.default;
  };

  if (!isLoggedIn) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: getBgColor(),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: "white",
            fontWeight: 900,
            mb: 3,
            letterSpacing: "0.1em",
          }}
        >
          Predict
        </Typography>

        <TextField
          variant="outlined"
          label="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            input: { color: "white" },
            label: { color: "#aaa" },
            mb: 3,
          }}
        />

        <Button
          variant="contained"
          onClick={handleLogin}
          sx={{
            backgroundColor: leagueColors[league] || "#00ff88",
            px: 5,
            py: 1.5,
            fontWeight: "bold",
            color: "white",
          }}
        >
          Enter
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: getBgColor(),
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              color: "white",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Predict
          </Typography>

          <Box
            sx={{
              backgroundColor: leagueColors[league] || "#020b8aff",
              color: "white",
              px: 3,
              py: 1,
              mt: 2,
              display: "inline-block",
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              borderRadius: 2,
            }}
          >
            {leagueFullNames[league] || "League"}
          </Box>
        </Box>

        <Typography
          variant="h6"
          sx={{ color: "white", textAlign: "center", mb: 2 }}
        >
          Current User: {username}
        </Typography>

        {/* League selector ALWAYS shown */}
        <LeagueSelector league={league} onLeagueChange={handleLeagueChange} />

        {loading && (
          <Box textAlign="center" mt={4}>
            <CircularProgress
              size={60}
              sx={{ color: leagueColors[league] || "white" }}
            />
          </Box>
        )}

        {!loading &&
          displayTable &&
          !finalTable &&
          currentMatchday &&
          currentMatches && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 320px",
                gap: 3,
                mb: 4,
              }}
            >
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

        {!loading &&
          (!currentMatchday || matchdayKeys.length === 0) &&
          league && (
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
