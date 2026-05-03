import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button, IconButton, Tooltip, Chip, Paper, Fade } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronLeft, Trophy, Target } from "lucide-react";
import { apiPost } from "../../api/fifaApi";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import { fifaTheme } from "../../constants/fifaTheme";

const ROUND_FLOW = ["r32", "r16", "qf", "sf", "final"];
const ROUND_LABELS = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter Finals",
  sf: "Semi Finals",
  final: "Grand Final",
};

export default function FifaKnockouts() {
  const navigate = useNavigate();
  const [state, setState] = useState(JSON.parse(sessionStorage.getItem("fifa_state") || "null"));
  const [stage, setStage] = useState("r32");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) navigate("/fifa/groups");
  }, [state, navigate]);

  const activeMatches = useMemo(() => {
    if (!state || stage === "final") return [];
    return state[stage] ? Object.entries(state[stage]).map(([slot, m]) => ({ ...m, match: slot })) : [];
  }, [state, stage]);

  async function handleAutoSubmit(_, matchId, payload) {
    const match = stage === "final" ? (matchId === "THIRD_PLACE" ? state.third_place : state.final) : state[stage]?.[matchId];
    if (!match) return;

    const res = await apiPost("/api/fifa2026/predict_knockout_match", {
      user_id: localStorage.getItem("username") || "guest",
      stage,
      match_slot: matchId,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      penaltyWinner: payload.penaltyWinner,
    });

    if (res?.success) {
      const next = { ...state };
      const key = stage === "final" ? (matchId === "THIRD_PLACE" ? "third_place" : "final") : stage;
      if (stage === "final") {
        next[key] = { ...next[key], scoreA: res.scoreA, scoreB: res.scoreB, winner: res.winner, penaltyWinner: payload.penaltyWinner };
      } else {
        next[stage][matchId] = { ...next[stage][matchId], scoreA: res.scoreA, scoreB: res.scoreB, winner: res.winner, penaltyWinner: payload.penaltyWinner };
      }
      sessionStorage.setItem("fifa_state", JSON.stringify(next));
      setState(next);
    }
  }

  const canProceed = useMemo(() => {
    if (!state) return false;
    if (stage === "final") return !!(state.final?.winner && state.third_place?.winner);
    return state[stage] ? Object.values(state[stage]).every(m => !!m.winner) : false;
  }, [state, stage]);

  async function proceed() {
    if (stage === "final") {
      navigate("/fifa/winner");
      return;
    }
    setLoading(true);
    try {
      const nextIdx = ROUND_FLOW.indexOf(stage) + 1;
      const nextStage = ROUND_FLOW[nextIdx];
      const res = await apiPost(`/api/fifa2026/generate_${nextStage}`, {
        user_id: localStorage.getItem("username") || "guest",
        state,
      });
      if (res?.success) {
        sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        setState(res.state);
        setStage(nextStage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem("username");
    navigate("/");
  }

  if (!state || loading) return null;

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, pb: 10 }}>
      {/* Top Nav */}
      <Box sx={{ 
        height: 80, px: { xs: 2, md: 6 }, display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0, 10, 30, 0.4)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0, 180, 255, 0.15)",
        position: "sticky", top: 0, zIndex: 1000
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Trophy color={fifaTheme.gold} size={28} />
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#fff", letterSpacing: 1.5, fontSize: { xs: 14, sm: 18 }, textTransform: "uppercase" }}>
              FIFA World Cup 2026
            </Typography>
            <Typography sx={{ color: fifaTheme.text.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Knockout Stage · <span style={{ color: fifaTheme.cyan }}>{ROUND_LABELS[stage]}</span>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Back to Groups">
            <IconButton onClick={() => navigate("/fifa/groups")} sx={{ color: fifaTheme.text.muted }}>
              <ChevronLeft size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: fifaTheme.text.muted }}>
              <LogOut size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        {/* Pairing Legend (for R32) */}
        {stage === "r32" && (
          <Fade in>
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, background: "rgba(0,180,255,0.05)", border: "1px solid rgba(0,180,255,0.1)", display: "flex", alignItems: "center", gap: 2 }}>
              <Target size={20} color={fifaTheme.cyan} />
              <Typography sx={{ fontSize: 12, color: fifaTheme.text.secondary, fontWeight: 600 }}>
                Bracket generated based on official 496-pairing combinatorics. Each match corresponds to a unique pairing ID.
              </Typography>
            </Paper>
          </Fade>
        )}

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography sx={{ color: fifaTheme.gold, fontWeight: 900, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", mb: 1 }}>
            Live Bracket
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", letterSpacing: 2, textShadow: "0 0 30px rgba(0,180,255,0.4)" }}>
            {ROUND_LABELS[stage]}
          </Typography>
        </Box>

        {/* Prediction Area */}
        {stage !== "final" ? (
          <FifaPredictionCard
            matches={activeMatches}
            mode="playoff"
            roundKey={stage}
            onAutoSubmit={handleAutoSubmit}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
             <FifaPredictionCard
               matches={[{ ...state.third_place, match: "THIRD_PLACE" }]}
               mode="playoff"
               roundKey="final"
               leagueTitle="Third Place Playoff"
               onAutoSubmit={handleAutoSubmit}
             />
             <FifaPredictionCard
               matches={[{ ...state.final, match: "FINAL" }]}
               mode="playoff"
               roundKey="final"
               leagueTitle="Grand Final"
               onAutoSubmit={handleAutoSubmit}
             />
          </Box>
        )}

        {/* Proceed Action */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <Button
            variant="contained"
            disabled={!canProceed}
            onClick={proceed}
            sx={{
              px: 8, py: 2, borderRadius: 10, fontWeight: 900, fontSize: 16, letterSpacing: 2,
              background: canProceed ? fifaTheme.goldGradient : "rgba(255,255,255,0.1)",
              color: "#000",
              "&:hover": { transform: "scale(1.05)", boxShadow: `0 0 40px ${fifaTheme.gold}` },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            {stage === "final" ? "Complete Predictions" : "Next Round"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
