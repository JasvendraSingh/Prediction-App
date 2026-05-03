import React, { useState, useCallback } from "react";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/fifaApi";

/* ---- Subtle animated ball background ---- */
const BALLS = Array.from({ length: 6 }, (_, i) => ({
  size: 340 + i * 90,
  top: `${-10 + i * 18}%`,
  left: `${-8 + i * 17}%`,
  opacity: 0.035 + i * 0.006,
  duration: 18 + i * 4,
}));

export default function HomePage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("username", trimmed);

      // If state already initialised (e.g. user returning mid-tournament),
      // skip the init call and go straight to groups.
      const cached = sessionStorage.getItem("fifa_state");
      if (!cached) {
        const res = await apiPost("/api/fifa2026/init", { user_id: trimmed });
        if (res?.success && res.state) {
          sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        }
      }

      navigate("/fifa/groups");
    } catch (err) {
      console.error("Init failed:", err);
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 20% 80%, #001a3a 0%, transparent 55%)," +
          "radial-gradient(ellipse at 80% 15%, #002255 0%, transparent 55%)," +
          "linear-gradient(160deg, #000a1a 0%, #001433 50%, #000d22 100%)",
      }}
    >
      {/* ── Decorative football watermarks ── */}
      {BALLS.map((b, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: b.top,
            left: b.left,
            width:  b.size,
            height: b.size,
            borderRadius: "50%",
            border: "1.5px solid rgba(0,180,255,0.12)",
            opacity: b.opacity,
            animation: `spin ${b.duration}s linear infinite`,
            "@keyframes spin": {
              from: { transform: "rotate(0deg)" },
              to:   { transform: "rotate(360deg)" },
            },
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Main card ── */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          px: { xs: 3, sm: 6 },
          py: { xs: 5, sm: 7 },
          width: { xs: "92%", sm: 460 },
          borderRadius: 5,
          background:
            "linear-gradient(145deg, rgba(0,40,90,0.55), rgba(0,15,40,0.80))",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(0,180,255,0.25)",
          boxShadow:
            "0 0 40px rgba(0,120,255,0.18)," +
            "0 0 80px rgba(0,80,180,0.12)," +
            "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Trophy icon */}
        <Typography
          sx={{ fontSize: 56, lineHeight: 1, userSelect: "none" }}
          aria-hidden
        >
          🏆
        </Typography>

        {/* Title */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#e6f4ff",
              textTransform: "uppercase",
              textShadow:
                "0 0 18px rgba(0,180,255,0.55)," +
                "0 0 40px rgba(0,120,255,0.35)",
              fontSize: { xs: "1.7rem", sm: "2.2rem" },
            }}
          >
            FIFA World Cup
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.15em",
              background:
                "linear-gradient(90deg, #ffe066, #ffd700, #ffb800)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              fontSize: { xs: "1.4rem", sm: "1.8rem" },
            }}
          >
            2026 ★ Predictor
          </Typography>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            width: "60%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,180,255,0.45), transparent)",
          }}
        />

        {/* Subtitle */}
        <Typography
          variant="body2"
          sx={{
            color: "rgba(180,220,255,0.7)",
            textAlign: "center",
            fontSize: "0.875rem",
            letterSpacing: "0.03em",
          }}
        >
          Enter your username to start predicting all 3 matchdays,<br />
          the Round of 32 knockout bracket, and beyond.
        </Typography>

        {/* Input */}
        <TextField
          id="username-input"
          label="Your Username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          onKeyDown={handleKey}
          autoFocus
          fullWidth
          error={!!error}
          helperText={error}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#e0f4ff",
              borderRadius: 2,
              "& fieldset": { borderColor: "rgba(0,180,255,0.35)" },
              "&:hover fieldset":  { borderColor: "rgba(0,180,255,0.6)" },
              "&.Mui-focused fieldset": {
                borderColor: "#00b4ff",
                boxShadow: "0 0 12px rgba(0,180,255,0.35)",
              },
            },
            "& .MuiInputLabel-root": { color: "rgba(140,200,255,0.75)" },
            "& .MuiInputLabel-root.Mui-focused": { color: "#00b4ff" },
            "& .MuiFormHelperText-root": { color: "#ff6b6b" },
          }}
        />

        {/* Login button */}
        <Button
          id="login-btn"
          variant="contained"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
          sx={{
            py: 1.6,
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderRadius: 3,
            background:
              "linear-gradient(135deg, #0070d8 0%, #0050a8 50%, #003d80 100%)",
            boxShadow:
              "0 0 20px rgba(0,120,255,0.4)," +
              "0 4px 16px rgba(0,60,180,0.5)",
            border: "1px solid rgba(0,180,255,0.4)",
            transition: "all 0.3s ease",
            "&:hover": {
              background:
                "linear-gradient(135deg, #0090ff 0%, #0068d0 50%, #004db0 100%)",
              boxShadow:
                "0 0 30px rgba(0,160,255,0.65)," +
                "0 6px 24px rgba(0,80,200,0.6)",
              transform: "translateY(-2px)",
            },
            "&:active": { transform: "translateY(0)" },
            "&.Mui-disabled": {
              background: "rgba(0,60,120,0.4)",
              color: "rgba(255,255,255,0.35)",
              boxShadow: "none",
            },
          }}
        >
          {loading
            ? <CircularProgress size={22} sx={{ color: "rgba(255,255,255,0.6)" }} />
            : "Enter Predictor"}
        </Button>

        {/* Footer note */}
        <Typography
          variant="caption"
          sx={{ color: "rgba(120,180,255,0.45)", textAlign: "center" }}
        >
          48 teams · 12 groups · 3 matchdays · 32-team knockout
        </Typography>
      </Box>
    </Box>
  );
}
