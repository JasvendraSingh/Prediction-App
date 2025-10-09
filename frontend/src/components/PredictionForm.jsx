import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, TextField, Typography, Paper } from "@mui/material";

const leagueColors = {
  UEL: "#ff9800",
  UCFL: "#00ff88",
};

const getTeamIcon = (teamName) => {
  const icons = { default: "" };
  return icons[teamName?.toLowerCase()] || icons.default;
};

const PredictionForm = ({ matches = [], onSubmit, league }) => {
  if (!matches || matches.length === 0) return <p>No matches available.</p>;
  const [predictions, setPredictions] = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!Array.isArray(matches)) return;
    const initialPredictions = matches.reduce((acc, { home, away }) => {
      acc[`${home}_vs_${away}`] = { homeScore: "", awayScore: "" };
      return acc;
    }, {});
    setPredictions(initialPredictions);
    inputRefs.current = [];
    
    // Scroll to top and focus first input when matches change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus first input after a small delay to ensure DOM is updated
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  }, [matches]);

  // Create stable callback using useCallback
  const notifyParent = useCallback(() => {
    if (Object.keys(predictions).length > 0) {
      const formatted = {};
      Object.entries(predictions).forEach(([key, value]) => {
        const homeScore = value?.homeScore || "0";
        const awayScore = value?.awayScore || "0";
        formatted[key] = `${homeScore}-${awayScore}`;
      });
      console.log("PredictionForm sending to parent:", formatted);
      if (onSubmit) {
        onSubmit(formatted);
      }
    }
  }, [predictions, onSubmit]);

  // Call notifyParent whenever predictions change
  useEffect(() => {
    notifyParent();
  }, [notifyParent]);

  const handleChange = (key, field, value) => {
    if (value === "" || /^\d+$/.test(value)) {
      setPredictions((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value },
      }));
    }
  };

  const handleKeyDown = (e, currentIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  if (!Array.isArray(matches) || matches.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: "white", fontSize: "1.1rem", opacity: 0.8 }}>
          No matches available for this matchday.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {matches.map(({ home, away }, matchIdx) => {
        const key = `${home}_vs_${away}`;
        return (
          <Paper
            key={key}
            sx={{
              p: 3,
              background: `linear-gradient(135deg, rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              },0.15) 0%, rgba(0,0,0,0.8) 50%)`,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid rgba(${
                league === "UEL" ? "255,152,0" : "0,255,136"
              },0.3)`,
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: 140, justifyContent: "flex-end" }}>
              <Typography sx={{ color: "white", fontWeight: 600, fontSize: "1rem", mr: 1 }}>
                {home}
              </Typography>
              <Typography sx={{ fontSize: "1.2rem", opacity: 0.6 }}>{getTeamIcon(home)}</Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: "rgba(0,0,0,0.4)",
                padding: "12px 16px",
                borderRadius: "20px",
                border: `1px solid rgba(${league === "UEL" ? "255,152,0" : "0,255,136"}, 0.2)`,
              }}
            >
              <TextField
                placeholder="0"
                value={predictions[key]?.homeScore || ""}
                onChange={(e) => handleChange(key, "homeScore", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, matchIdx * 2)}
                inputRef={(el) => (inputRefs.current[matchIdx * 2] = el)}
                sx={{
                  width: 50,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: 2,
                    height: 40,
                    "& fieldset": { border: "none" },
                    "&:hover fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: `2px solid ${leagueColors[league] || "#00ff88"}` },
                  },
                }}
                inputProps={{ style: { textAlign: "center", fontWeight: 700, fontSize: "1.1rem" }, maxLength: 2 }}
              />

              <Typography
                sx={{
                  color: leagueColors[league] || "#00ff88",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textShadow: `0 0 10px ${leagueColors[league] || "#00ff88"}`,
                }}
              >
                VS
              </Typography>

              <TextField
                placeholder="0"
                value={predictions[key]?.awayScore || ""}
                onChange={(e) => handleChange(key, "awayScore", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, matchIdx * 2 + 1)}
                inputRef={(el) => (inputRefs.current[matchIdx * 2 + 1] = el)}
                sx={{
                  width: 50,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: 2,
                    height: 40,
                    "& fieldset": { border: "none" },
                    "&:hover fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: `2px solid ${leagueColors[league] || "#00ff88"}` },
                  },
                }}
                inputProps={{ style: { textAlign: "center", fontWeight: 700, fontSize: "1.1rem" }, maxLength: 2 }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", width: 140 }}>
              <Typography sx={{ fontSize: "1.2rem", opacity: 0.6, mr: 1 }}>{getTeamIcon(away)}</Typography>
              <Typography sx={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{away}</Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default PredictionForm;