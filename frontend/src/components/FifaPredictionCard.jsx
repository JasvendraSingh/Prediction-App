import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Fade,
} from "@mui/material";
import FifaFlag from "./FifaFlag";
import { fifaTheme } from "../constants/fifaTheme";

export default function FifaPredictionCard({
  matches = [],
  mode = "group",
  roundKey,
  onAutoSubmit,
  disabled = false,
  leagueTitle,
}) {
  const [local, setLocal] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const next = {};
    matches.forEach((m, idx) => {
      const id = m.match || m.id || `${m.teamA}-${m.teamB}-${idx}`;
      next[id] = {
        scoreA: m.scoreA ?? "",
        scoreB: m.scoreB ?? "",
        penaltyWinner: m.penaltyWinner ?? "",
        submitted: !!m.played || !!m.winner,
        submitting: false,
      };
    });
    setLocal(next);
  }, [matches]);

  function handleKeyDown(e, id, field) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (field === "A") {
      refs.current[id]?.B?.focus();
    } else if (field === "B") {
      const s = local[id];
      if (mode === "playoff" && s.scoreA !== "" && s.scoreB !== "" && Number(s.scoreA) === Number(s.scoreB)) {
        refs.current[id]?.penalty?.focus();
      } else {
        submit(id);
      }
    }
  }

  async function submit(id, override = {}) {
    const s = { ...local[id], ...override };
    if (!s || s.submitted || s.submitting) return;
    if (s.scoreA === "" || s.scoreB === "") return;

    const a = Number(s.scoreA);
    const b = Number(s.scoreB);
    if (isNaN(a) || isNaN(b)) return;
    if (mode === "playoff" && a === b && !s.penaltyWinner) return;

    const m = matches.find((x, idx) => (x.match || x.id || `${x.teamA}-${x.teamB}-${idx}`) === id);
    if (!m) return;

    setLocal(p => ({ ...p, [id]: { ...p[id], submitting: true } }));
    await onAutoSubmit(roundKey, m.match || m.id || id, { scoreA: a, scoreB: b, penaltyWinner: s.penaltyWinner });
    setLocal(p => ({ ...p, [id]: { ...p[id], submitted: true, submitting: false } }));

    const keys = Object.keys(local);
    const idx = keys.indexOf(id);
    if (keys[idx + 1]) {
      setTimeout(() => refs.current[keys[idx + 1]]?.A?.focus(), 50);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 900,
          color: fifaTheme.text.primary,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textAlign: "center",
          textShadow: "0 0 20px rgba(0, 180, 255, 0.5)",
          mb: 1
        }}
      >
        {leagueTitle}
      </Typography>

      {matches.map((m, idx) => {
        const id = m.match || m.id || `${m.teamA}-${m.teamB}-${idx}`;
        const s = local[id] || {};
        const isTie = s.scoreA !== "" && s.scoreB !== "" && Number(s.scoreA) === Number(s.scoreB);

        return (
          <Fade in key={id} style={{ transitionDelay: `${idx * 50}ms` }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                background: fifaTheme.background.panel,
                backdropFilter: fifaTheme.backdrop,
                border: fifaTheme.border,
                boxShadow: fifaTheme.shadow,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-4px) scale(1.01)",
                  boxShadow: "0 0 50px rgba(0, 180, 255, 0.25)",
                  borderColor: "rgba(0, 180, 255, 0.5)",
                },
              }}
            >
              {/* Match Details */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                
                {/* Team A */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 140 }}>
                  <Box sx={{ width: { xs: 32, sm: 44 }, height: { xs: 24, sm: 32 }, borderRadius: 1, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                    <FifaFlag team={m.teamA} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: fifaTheme.text.primary, fontSize: { xs: 14, sm: 18 }, letterSpacing: 0.5 }}>
                    {m.teamA}
                  </Typography>
                </Box>

                {/* Score Input Area */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, borderRadius: 3, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <ScoreInput 
                    value={s.scoreA} 
                    disabled={disabled || s.submitted}
                    onChange={(val) => setLocal(p => ({ ...p, [id]: { ...p[id], scoreA: val } }))}
                    onKeyDown={(e) => handleKeyDown(e, id, "A")}
                    inputRef={(el) => (refs.current[id] = { ...refs.current[id], A: el })}
                  />
                  
                  <Typography sx={{ fontWeight: 900, color: fifaTheme.text.muted, fontSize: 12, opacity: 0.6 }}>VS</Typography>
                  
                  <ScoreInput 
                    value={s.scoreB} 
                    disabled={disabled || s.submitted}
                    onChange={(val) => setLocal(p => ({ ...p, [id]: { ...p[id], scoreB: val } }))}
                    onKeyDown={(e) => handleKeyDown(e, id, "B")}
                    inputRef={(el) => (refs.current[id] = { ...refs.current[id], B: el })}
                  />
                </Box>

                {/* Team B */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 140, justifyContent: "flex-end", textAlign: "right" }}>
                  <Typography sx={{ fontWeight: 800, color: fifaTheme.text.primary, fontSize: { xs: 14, sm: 18 }, letterSpacing: 0.5 }}>
                    {m.teamB}
                  </Typography>
                  <Box sx={{ width: { xs: 32, sm: 44 }, height: { xs: 24, sm: 32 }, borderRadius: 1, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                    <FifaFlag team={m.teamB} />
                  </Box>
                </Box>
              </Box>

              {/* Penalty Section */}
              {mode === "playoff" && isTie && (
                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: fifaTheme.gold, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
                    Penalty Winner
                  </Typography>
                  <TextField
                    select
                    size="small"
                    value={s.penaltyWinner}
                    onChange={(e) => submit(id, { penaltyWinner: e.target.value })}
                    disabled={disabled || s.submitted}
                    inputRef={(el) => (refs.current[id] = { ...refs.current[id], penalty: el })}
                    sx={{
                      width: 200,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        background: "rgba(0,0,0,0.4)",
                        color: fifaTheme.text.primary,
                        fontWeight: 700,
                        "& fieldset": { borderColor: "rgba(255,215,0,0.3)" },
                        "&:hover fieldset": { borderColor: fifaTheme.gold },
                      }
                    }}
                  >
                    <MenuItem value={m.teamA}>{m.teamA}</MenuItem>
                    <MenuItem value={m.teamB}>{m.teamB}</MenuItem>
                  </TextField>
                </Box>
              )}
              
              {/* Status Indicator */}
              {s.submitted && (
                <Box sx={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: fifaTheme.success, boxShadow: `0 0 10px ${fifaTheme.success}` }} />
              )}
            </Paper>
          </Fade>
        );
      })}
    </Box>
  );
}

function ScoreInput({ value, disabled, onChange, onKeyDown, inputRef }) {
  return (
    <TextField
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      onKeyDown={onKeyDown}
      inputRef={inputRef}
      variant="standard"
      autoComplete="off"
      InputProps={{ disableUnderline: true }}
      inputProps={{
        style: {
          textAlign: "center",
          fontWeight: 900,
          fontSize: 22,
          color: "#fff",
          width: 40,
          fontFamily: "'Outfit', sans-serif",
          textShadow: "0 0 12px rgba(255,255,255,0.3)",
        }
      }}
      sx={{
        "& .MuiInputBase-input.Mui-disabled": {
          WebkitTextFillColor: "rgba(255,255,255,0.8)",
          color: "rgba(255,255,255,0.8)",
        }
      }}
    />
  );
}
