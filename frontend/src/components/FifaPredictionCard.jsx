import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import FifaFlag from "./FifaFlag";

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

  /* ---------- SYNC ---------- */
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

  /* ---------- KEY FLOW ---------- */
  function handleKeyDown(e, id, field) {
    if (e.key !== "Enter") return;

    e.preventDefault();  
    e.stopPropagation(); 

    if (field === "A") {
      refs.current[id]?.B?.focus();
      return;
    }

    if (field === "B") {
      const s = local[id];
      if (!s) return;

      if (
        mode === "playoff" &&
        s.scoreA !== "" &&
        s.scoreB !== "" &&
        Number(s.scoreA) === Number(s.scoreB)
      ) {
        refs.current[id]?.penalty?.focus();
        return;
      }

      submit(id);
    }
  }

  /* ---------- SUBMIT ---------- */
  async function submit(id, override = {}) {
    const s = { ...local[id], ...override };
    if (!s || s.submitted || s.submitting) return;
    if (s.scoreA === "" || s.scoreB === "") return;

    const a = Number(s.scoreA);
    const b = Number(s.scoreB);
    if (Number.isNaN(a) || Number.isNaN(b)) return;
    if (mode === "playoff" && a === b && !s.penaltyWinner) return;

    const m = matches.find(
      (x, idx) =>
        (x.match || x.id || `${x.teamA}-${x.teamB}-${idx}`) === id
    );
    if (!m) return;

    setLocal((p) => ({
      ...p,
      [id]: { ...p[id], submitting: true },
    }));

    await onAutoSubmit(roundKey, m.match || m.id || id, {
      scoreA: a,
      scoreB: b,
      penaltyWinner: s.penaltyWinner,
    });

    setLocal((p) => ({
      ...p,
      [id]: { ...p[id], submitted: true, submitting: false },
    }));

    const keys = Object.keys(local);
    const idx = keys.indexOf(id);
    const nextKey = keys[idx + 1];
    if (nextKey) {
      setTimeout(() => refs.current[nextKey]?.A?.focus(), 80);
    }
  }

  /* ---------- RENDER ---------- */
  return (
    <Card
      sx={{
        position: "relative",
        borderRadius: 4,
        background:
          "linear-gradient(180deg, rgba(10,15,20,0.65), rgba(5,5,8,0.85))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(0,255,255,0.35)",
        boxShadow: `
          0 0 18px rgba(0,255,255,0.45),
          0 0 40px rgba(0,255,255,0.25)
        `,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: -3,
          borderRadius: 6,
          background:
            "linear-gradient(180deg, rgba(0,255,255,0.6), rgba(0,255,255,0.05))",
          opacity: 0.25,
          pointerEvents: "none",
          zIndex: -1,
          filter: "blur(10px)",
        },
      }}
    >
      <CardHeader
        title={
          <Typography
            sx={{
              fontWeight: 900,
              textAlign: "center",
              color: "#fff",
              letterSpacing: 1,
              textShadow: "0 0 14px rgba(0,255,255,0.7)",
            }}
          >
            {leagueTitle}
          </Typography>
        }
      />

      <CardContent>
        {matches.map((m, idx) => {
          const id = m.match || m.id || `${m.teamA}-${m.teamB}-${idx}`;
          const s = local[id] || {};
          const isTie =
            s.scoreA !== "" &&
            s.scoreB !== "" &&
            Number(s.scoreA) === Number(s.scoreB);

          return (
            <Box
              key={id}
              sx={{
                mb: 2.5,
                pb: 1.8,
                borderBottom: "1px solid rgba(0,255,255,0.25)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                {/* TEAM A */}
                <Box sx={{ display: "flex", gap: 1.5, minWidth: 220 }}>
                  <Box sx={{ width: 36 }}>
                    <FifaFlag team={m.teamA} />
                  </Box>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      ml: 0.5,
                      textShadow: "0 0 8px rgba(0,255,255,0.5)",
                    }}
                  >
                    {m.teamA}
                  </Typography>
                </Box>

                {/* SCORES */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    value={s.scoreA}
                    disabled={disabled || s.submitted}
                    onChange={(e) =>
                      setLocal((p) => ({
                        ...p,
                        [id]: {
                          ...p[id],
                          scoreA: e.target.value.replace(/\D/g, ""),
                        },
                      }))
                    }
                    onKeyDown={(e) => handleKeyDown(e, id, "A")}
                    inputRef={(el) =>
                      (refs.current[id] = {
                        ...(refs.current[id] || {}),
                        A: el,
                      })
                    }
                    sx={{
                      width: 64,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(0,0,0,0.35)", 
                        borderRadius: 2,
                      },
                    }}
                    inputProps={{
                      style: {
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: 14,        
                        lineHeight: "24px",
                        color: "#ffffff",     
                        WebkitTextFillColor: "#ffffff", 
                        textShadow: `
                          0 0 6px rgba(0,255,255,0.9),
                          0 0 12px rgba(0,255,255,0.9),
                          0 0 20px rgba(0,255,255,0.6)
                        `,
                      },
                    }}  
                  />

                  <Typography
                    sx={{
                      color: "#ffffff",
                      fontWeight: 900,
                      textShadow: `
                        0 0 6px rgba(0,255,255,0.9),
                        0 0 12px rgba(0,255,255,0.7)
                      `,
                    }}
                  >
                    v/s
                  </Typography>

                  <TextField
                    type="text"
                    value={s.scoreB}
                    disabled={disabled || s.submitted}
                    onChange={(e) =>
                      setLocal((p) => ({
                        ...p,
                        [id]: {
                          ...p[id],
                          scoreB: e.target.value.replace(/\D/g, ""),
                        },
                      }))
                    }
                    onKeyDown={(e) => handleKeyDown(e, id, "B")}
                    inputRef={(el) =>
                      (refs.current[id] = {
                        ...(refs.current[id] || {}),
                        B: el,
                      })
                    }
                    sx={{
                      width: 64,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(0,0,0,0.35)",
                        borderRadius: 2,
                      },
                    }}
                    inputProps={{
                      style: {
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: 14,
                        lineHeight: "24px",
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff",
                        textShadow: `
                          0 0 6px rgba(0,255,255,0.9),
                          0 0 12px rgba(0,255,255,0.9),
                          0 0 20px rgba(0,255,255,0.6)
                        `,
                      },
                    }}
                  />
                </Box>

                {/* TEAM B */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    minWidth: 220,
                    justifyContent: "flex-end",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      mr: 0.5,
                      textShadow: "0 0 8px rgba(0,255,255,0.5)",
                    }}
                  >
                    {m.teamB}
                  </Typography>
                  <Box sx={{ width: 36 }}>
                    <FifaFlag team={m.teamB} />
                  </Box>
                </Box>
              </Box>

              {/* PENALTY */}
              {mode === "playoff" && isTie && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 0.75,              
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      color: "#ffffff",
                      textTransform: "uppercase",
                      textShadow: `
                        0 0 6px rgba(0,255,255,0.4),
                        0 0 12px rgba(0,255,255,0.3),
                        0 0 20px rgba(0,255,255,0.5)
                      `,
                    }}
                  >
                    Penalty Winner
                  </Typography>


                  <TextField
                    select
                    size="small"
                    sx={{
                      mt: 0.5,
                      width: 220,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "#00ffff",
                        "& fieldset": { borderColor: "#00ffff" },
                      },
                    }}
                    value={s.penaltyWinner}
                    onChange={(e) =>
                      submit(id, { penaltyWinner: e.target.value })
                    }
                    inputRef={(el) =>
                      (refs.current[id] = {
                        ...(refs.current[id] || {}),
                        penalty: el,
                      })
                    }
                  >
                    <MenuItem value={m.teamA}>{m.teamA}</MenuItem>
                    <MenuItem value={m.teamB}>{m.teamB}</MenuItem>
                  </TextField>
                </Box>
              )}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
