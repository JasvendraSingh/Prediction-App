import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { Box, TextField, Typography, Paper } from "@mui/material";

const leagueColors = {
  UCL: "#1b0094ff",
  UEL: "#ff9800",
  UCFL: "#00ff88",
};

const getTeamIcon = (teamName) => {
  const icons = { default: "" };
  return icons[teamName?.toLowerCase()] || icons.default;
};

const PredictionForm = forwardRef(({ matches = [], onSubmit, league }, ref) => {
  if (!matches || matches.length === 0) return <p>No matches available.</p>;

  const [predictions, setPredictions] = useState({});
  const [focusedMatch, setFocusedMatch] = useState(null);
  const inputRefs = useRef([]);
  const containerRef = useRef(null);

  const isUCL = league === "UCL";
  const isUEL = league === "UEL";
  const isUCFL = league === "UCFL";

  useEffect(() => {
    if (!Array.isArray(matches)) return;
    const initialPredictions = matches.reduce((acc, { home, away }) => {
      acc[`${home}_vs_${away}`] = { homeScore: "", awayScore: "" };
      return acc;
    }, {});
    setPredictions(initialPredictions);
    inputRefs.current = [];

    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 100);
  }, [matches]);

  const notifyParent = useCallback(() => {
    if (Object.keys(predictions).length > 0 && onSubmit) {
      const formatted = {};
      Object.entries(predictions).forEach(([key, value]) => {
        formatted[key] = `${value.homeScore || "0"}-${value.awayScore || "0"}`;
      });
      onSubmit(formatted);
    }
  }, [predictions, onSubmit]);

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

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[idx + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const allFilled = useMemo(
    () => Object.values(predictions).every((pred) => pred.homeScore !== "" && pred.awayScore !== ""),
    [predictions]
  );

  const firstUnfilledKey = useMemo(
    () => Object.entries(predictions).find(([_, pred]) => pred.homeScore === "" || pred.awayScore === "")?.[0],
    [predictions]
  );

  const scrollToUnfilled = useCallback(() => {
    if (!firstUnfilledKey) return;
    const idx = Object.keys(predictions).indexOf(firstUnfilledKey);
    if (inputRefs.current[idx * 2]) {
      inputRefs.current[idx * 2].scrollIntoView({ behavior: "smooth", block: "center" });
      inputRefs.current[idx * 2].focus();
    }
  }, [firstUnfilledKey, predictions]);

  useImperativeHandle(ref, () => ({
    allFilled,
    scrollToUnfilled,
    predictions,
  }));

  const themeColor = useMemo(() => leagueColors[league] || "#00ff88", [league]);

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
    <Box ref={containerRef} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {matches.map(({ home, away }, idx) => {
        const key = `${home}_vs_${away}`;
        const hasScore = predictions[key]?.homeScore !== "" || predictions[key]?.awayScore !== "";
        const isFocused = focusedMatch === key;
        const isActive = isFocused || hasScore;
        const isMissing = !hasScore && firstUnfilledKey === key;

        // Determine dynamic colors
        const borderRGB = isUCL ? "27,0,148" : isUEL ? "255,152,0" : "0,255,136";
        const bgGradient = isUCL
          ? `linear-gradient(135deg, rgba(27,0,148,${isActive ? 0.15 : isMissing ? 0.12 : 0.08}) 0%, rgba(0,0,0,0.8) 50%)`
          : isUEL
          ? `linear-gradient(135deg, rgba(255,152,0,${isActive ? 0.15 : isMissing ? 0.12 : 0.08}) 0%, rgba(0,0,0,0.8) 50%)`
          : `linear-gradient(135deg, rgba(0,255,136,${isActive ? 0.15 : isMissing ? 0.12 : 0.08}) 0%, rgba(0,0,0,0.8) 50%)`;

        return (
          <Paper
            key={key}
            sx={{
              p: 3,
              background: bgGradient,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `2px solid rgba(${borderRGB}, ${isMissing ? 0.8 : isActive ? 0.6 : 0.2})`,
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.2s ease, background 0.2s ease",
              boxShadow: isMissing ? `inset 0 0 20px rgba(${borderRGB}, 0.1)` : "none",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: 140, justifyContent: "flex-end" }}>
              <Typography sx={{ color: "white", fontWeight: 600, fontSize: "1rem", mr: 1 }}>{home}</Typography>
              <Typography sx={{ fontSize: "1.2rem", opacity: 0.6 }}>{getTeamIcon(home)}</Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                backgroundColor: isActive
                  ? `rgba(${borderRGB}, 0.1)`
                  : isMissing
                  ? `rgba(${borderRGB}, 0.05)`
                  : "rgba(0,0,0,0.3)",
                padding: "12px 16px",
                borderRadius: "20px",
                border: `1px solid rgba(${borderRGB}, ${isActive ? 0.5 : isMissing ? 0.4 : 0.2})`,
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <TextField
                placeholder="0"
                value={predictions[key]?.homeScore || ""}
                onChange={(e) => handleChange(key, "homeScore", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, idx * 2)}
                onFocus={() => setFocusedMatch(key)}
                onBlur={() => setFocusedMatch(null)}
                inputRef={(el) => (inputRefs.current[idx * 2] = el)}
                sx={{
                  width: 50,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: 2,
                    height: 40,
                    transition: "border-color 0.2s ease",
                    "& fieldset": { border: "none" },
                    "&:hover fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: `2px solid ${themeColor} !important` },
                  },
                }}
                inputProps={{ style: { textAlign: "center", fontWeight: 700, fontSize: "1.1rem" }, maxLength: 2 }}
              />

              <Typography
                sx={{
                  color: themeColor,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textShadow: isActive ? `0 0 8px ${themeColor}` : "none",
                  transition: "text-shadow 0.2s ease",
                }}
              >
                VS
              </Typography>

              <TextField
                placeholder="0"
                value={predictions[key]?.awayScore || ""}
                onChange={(e) => handleChange(key, "awayScore", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, idx * 2 + 1)}
                onFocus={() => setFocusedMatch(key)}
                onBlur={() => setFocusedMatch(null)}
                inputRef={(el) => (inputRefs.current[idx * 2 + 1] = el)}
                sx={{
                  width: 50,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: 2,
                    height: 40,
                    transition: "border-color 0.2s ease",
                    "& fieldset": { border: "none" },
                    "&:hover fieldset": { border: "none" },
                    "&.Mui-focused fieldset": { border: `2px solid ${themeColor} !important` },
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
});

PredictionForm.displayName = "PredictionForm";

export default PredictionForm;
