import React, { useEffect, useState } from "react";
import { Box, Container, Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FifaFlag from "../../components/FifaFlag";
import { apiPost } from "../../api/fifaApi";
import { fifaTheme } from "../../constants/fifaTheme";

export default function FifaKnockouts() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => {
    const s = sessionStorage.getItem("fifa_state");
    return s ? JSON.parse(s) : null;
  });
  const [matches, setMatches] = useState({});
  const [stage, setStage] = useState("r32");
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate("/fifa/groups");
      return;
    }
    if (state.r32) {
      setMatches(state.r32);
      setStage("r32");
    } else {
      // generate server-side (same as original)
      (async () => {
        setLoading(true);
        try {
          const res = await apiPost("/api/fifa2026/generate_r32", {
            user_id: localStorage.getItem("username") || "guest",
            state,
          });
          if (res?.success) {
            const s2 = res.state || state;
            sessionStorage.setItem("fifa_state", JSON.stringify(s2));
            setState(s2);
            setMatches(res.r32 || s2.r32 || {});
          } else {
            alert("Failed to generate Round of 32");
          }
        } catch (e) {
          console.error("Network error generating R32", e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []); // eslint-disable-line

  const updateScore = (slot, side, value) => {
    setScores((p) => ({ ...p, [slot]: { ...(p[slot] || {}), [side]: value } }));
  };

  useEffect(() => {
    // auto-submit when both scores exist; if tied wait for penaltyWinner
    (async () => {
      for (const slot of Object.keys(scores)) {
        const sc = scores[slot] || {};
        if (sc._submitted) continue;
        if (sc.A === undefined || sc.B === undefined || sc.A === "" || sc.B === "") continue;
        const A = Number(sc.A);
        const B = Number(sc.B);
        if (A === B && !sc.penaltyWinner) continue; // wait for penalty selection

        // submit
        setScores((p) => ({ ...p, [slot]: { ...(p[slot] || {}), submitting: true } }));
        try {
          const match = matches[slot] || {};
          const payload = {
            user_id: localStorage.getItem("username") || "guest",
            stage,
            match_slot: slot,
            teamA: match.teamA,
            teamB: match.teamB,
            scoreA: Number(sc.A),
            scoreB: Number(sc.B),
            penaltyWinner: sc.penaltyWinner,
          };

          const res = await apiPost("/api/fifa2026/predict_knockout_match", payload);
          if (res?.success) {
            const s = { ...(state || {}) };
            s.r32 = { ...(s.r32 || {}) };
            s.r32[slot] = { ...(s.r32[slot] || match), scoreA: res.scoreA, scoreB: res.scoreB, winner: res.winner };
            sessionStorage.setItem("fifa_state", JSON.stringify(s));
            setState(s);
            // mark submitted
            setScores((p) => ({ ...p, [slot]: { ...(p[slot] || {}), _submitted: true, submitting: false } }));
          } else {
            console.warn("Failed to predict match", res);
          }
        } catch (e) {
          console.error("predictMatch error", e);
        }
      }
    })();
  }, [scores]); // eslint-disable-line

  function renderMatch(slot, m) {
    const sc = scores[slot] || {};
    return (
      <Box key={slot} sx={{ mb: 3, p: 3, borderRadius: 2, background: fifaTheme.background.panel, border: `1px solid ${fifaTheme.goldSoft}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FifaFlag team={m.teamA} size={34} />
            <Typography sx={{ fontWeight: 800, color: "white" }}>{m.teamA}</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {m.winner ? (
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{m.scoreA} - {m.scoreB}</Typography>
                <Typography sx={{ color: fifaTheme.gold }}>Winner: {m.winner}</Typography>
              </Box>
            ) : (
              <>
                <TextField
                  size="small"
                  value={sc.A ?? ""}
                  onChange={(e) => updateScore(slot, "A", e.target.value.replace(/[^\d]/g, ""))}
                  inputProps={{ style: { textAlign: "center", fontWeight: 800 }, maxLength: 2 }}
                  sx={{ width: 64, bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  disabled={sc._submitted}
                />
                <Typography sx={{ fontWeight: 900, color: "white" }}>-</Typography>
                <TextField
                  size="small"
                  value={sc.B ?? ""}
                  onChange={(e) => updateScore(slot, "B", e.target.value.replace(/[^\d]/g, ""))}
                  inputProps={{ style: { textAlign: "center", fontWeight: 800 }, maxLength: 2 }}
                  sx={{ width: 64, bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1 }}
                  disabled={sc._submitted}
                />
                {/* penalty inline when tied */}
                {sc.A !== "" && sc.B !== "" && Number(sc.A) === Number(sc.B) && (
                  <TextField
                    select
                    size="small"
                    value={sc.penaltyWinner || ""}
                    onChange={(e) => updateScore(slot, "penaltyWinner", e.target.value)}
                    sx={{ minWidth: 160, ml: 2 }}
                  >
                    <option value=""></option>
                    <option value={m.teamA}>{m.teamA}</option>
                    <option value={m.teamB}>{m.teamB}</option>
                  </TextField>
                )}
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontWeight: 800, color: "white" }}>{m.teamB}</Typography>
            <FifaFlag team={m.teamB} size={34} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!state) return <div style={{ padding: 20, color: "white" }}>Loading...</div>;

  return (
    <Box sx={{ minHeight: "100vh", p: 8, background: fifaTheme.background.base }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ color: "white", fontWeight: 900, mb: 2 }}>Knockout Stage — {stage.toUpperCase()}</Typography>

        <Box>
          {stage === "r32" && (state.r32 ? Object.entries(state.r32).map(([s,m]) => renderMatch(s,m)) : <p>No matches</p>)}
          {stage === "r16" && (state.r16 ? Object.entries(state.r16).map(([s,m]) => renderMatch(s,m)) : null)}
          {stage === "qf" && (state.qf ? Object.entries(state.qf).map(([s,m]) => renderMatch(s,m)) : null)}
          {stage === "sf" && (state.sf ? Object.entries(state.sf).map(([s,m]) => renderMatch(s,m)) : null)}
          {stage === "final" && state.final && renderMatch("FINAL", state.final)}
        </Box>
      </Container>
    </Box>
  );
}
