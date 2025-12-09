import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent, Box, TextField, Button, Typography, MenuItem } from "@mui/material";
import FifaFlag from "./FifaFlag";
import { fifaTheme } from "../constants/fifaTheme";

export default function FifaPredictionCard({ matches = [], onAutoSubmit, onAdvance, disabled = false, leagueTitle = "Group" }) {
  const [local, setLocal] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const init = {};
    matches.forEach((m, idx) => {
      const id = m.id || `${m.teamA}-${m.teamB}-${idx}`;
      init[id] = { A: m.scoreA ?? "", B: m.scoreB ?? "", penaltyWinner: m.penaltyWinner ?? "", submitted: !!m.winner || !!m.played };
    });
    setLocal(init);
    // focus first input
    setTimeout(() => {
      const firstKey = Object.keys(init)[0];
      refs.current[firstKey]?.A?.focus?.();
    }, 120);
  }, [matches]);

  function updateValue(id, field, value) {
    setLocal((p) => {
      const next = { ...p, [id]: { ...(p[id] || {}), [field]: value } };
      return next;
    });
  }

  // attempt auto-submit whenever both scores present (and penalty if tied)
  useEffect(() => {
    (async () => {
      for (const id of Object.keys(local)) {
        const s = local[id];
        if (!s) continue;
        if (s.submitted) continue;
        if (s.A === "" || s.B === "" || s.A === undefined || s.B === undefined) continue;
        // both scores present
        const A = Number(s.A);
        const B = Number(s.B);
        if (A === B) {
          // need penalty winner selected
          if (!s.penaltyWinner) {
            // focus penalty dropdown
            refs.current[id]?.penalty?.focus?.();
            continue;
          }
        }

        // build payload and submit
        const matchObj = matches.find((m) => (m.id || `${m.teamA}-${m.teamB}`) === id || (m.id === id));
        const payload = {
          match_id: matchObj?.match || matchObj?.id || id,
          teamA: matchObj?.teamA || matchObj?.homeTeam,
          teamB: matchObj?.teamB || matchObj?.awayTeam,
          scoreA: Number(s.A),
          scoreB: Number(s.B),
          penaltyWinner: s.penaltyWinner,
        };

        // mark as submitted immediately to avoid double submits while awaiting
        setLocal((p) => ({ ...p, [id]: { ...(p[id] || {}), submitting: true } }));

        try {
          if (onAutoSubmit) {
            await onAutoSubmit(id, payload);
          }
        } catch (e) {
          console.error("Auto submit error", e);
        } finally {
          // mark submitted and move focus to next match's first input
          setLocal((p) => ({ ...p, [id]: { ...(p[id] || {}), submitted: true, submitting: false } }));

          const keys = Object.keys(local);
          const idx = keys.indexOf(id);
          const nextKey = keys[idx + 1];
          if (nextKey) {
            // focus next home input
            setTimeout(() => refs.current[nextKey]?.A?.focus?.(), 120);
            if (onAdvance) onAdvance(idx + 1);
          } else {
            // finished all matches in this card
            if (onAdvance) onAdvance(null);
          }
        }
      }
    })();
  }, [local]); 

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: "rgba(0, 0, 0, 0.75)",
        border: `1px solid ${fifaTheme.goldSoft}`,
        boxShadow: fifaTheme.shadow,
      }}
    >
      <CardHeader
        title={<Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 900 }}>{leagueTitle} — Predict</Typography>}
        subheader={<Typography sx={{ color: fifaTheme.textMuted }}>{matches.length} matches</Typography>}
        sx={{ background: "rgba(255,255,255,0.02)" }}
      />
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {matches.map((m, index) => {
            const id = m.id || `${m.teamA || m.homeTeam}-${m.teamB || m.awayTeam}-${index}`;
            const s = local[id] || { A: "", B: "", penaltyWinner: "", submitted: false, submitting: false };
            return (
              <Box
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1,
                  px: 1.5,
                  borderRadius: 2,
                  background: s.submitted ? "rgba(255, 0, 140, 0.86)" : "rgba(0, 255, 255, 0.05)",
                  border: `1px solid rgba(255, 255, 255, 0.03)`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 180 }}>
                  <FifaFlag team={m.teamA || m.homeTeam} size={26} />
                  <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>{m.teamA || m.homeTeam}</Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center", fontWeight: 800 } }}
                    size="small"
                    value={s.A ?? ""}
                    onChange={(e) => updateValue(id, "A", e.target.value.replace(/[^\d]/g, ""))}
                    sx={{ width: 64, bgcolor: "rgba(243, 18, 18, 0.03)", borderRadius: 1 }}
                    disabled={disabled || s.submitted}
                    inputRef={(el) => (refs.current[id] = { ...(refs.current[id] || {}), A: el })}
                  />

                  <Typography sx={{ fontWeight: 900, color: fifaTheme.textPrimary }}>—</Typography>

                  <TextField
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center", fontWeight: 800 } }}
                    size="small"
                    value={s.B ?? ""}
                    onChange={(e) => updateValue(id, "B", e.target.value.replace(/[^\d]/g, ""))}
                    sx={{ width: 64, bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                    disabled={disabled || s.submitted}
                    inputRef={(el) => (refs.current[id] = { ...(refs.current[id] || {}), B: el })}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 180, justifyContent: "flex-end" }}>
                  {/* Penalty dropdown — shown if both scores present & tied */}
                  {s.A !== "" && s.B !== "" && Number(s.A) === Number(s.B) ? (
                    <TextField
                      select
                      size="small"
                      value={s.penaltyWinner || ""}
                      onChange={(e) => updateValue(id, "penaltyWinner", e.target.value)}
                      sx={{ minWidth: 160, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
                      helperText={s.penaltyWinner ? "Penalty winner selected — auto-submitting" : "Choose penalty winner"}
                      inputRef={(el) => (refs.current[id] = { ...(refs.current[id] || {}), penalty: el })}
                      disabled={disabled || s.submitted}
                    >
                      <MenuItem value="">{/* placeholder */}</MenuItem>
                      <MenuItem value={m.teamA || m.homeTeam}>{m.teamA || m.homeTeam}</MenuItem>
                      <MenuItem value={m.teamB || m.awayTeam}>{m.teamB || m.awayTeam}</MenuItem>
                    </TextField>
                  ) : (
                    <>
                      <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>{m.teamB || m.awayTeam}</Typography>
                      <FifaFlag team={m.teamB || m.awayTeam} size={26} />
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
