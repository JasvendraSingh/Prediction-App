import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../api/fifaApi";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import { fifaTheme } from "../../constants/fifaTheme";

const ROUND_FLOW  = ["r32", "r16", "qf", "sf", "final"];
const ROUND_LABELS = {
  r32:   "Round of 32",
  r16:   "Round of 16",
  qf:    "Quarter Finals",
  sf:    "Semi Finals",
  final: "Finals",
};

function isStageComplete(state, stage) {
  if (!state) return false;
  if (stage === "final") {
    return !!(state.final?.winner && state.third_place?.winner);
  }
  return state[stage]
    ? Object.values(state[stage]).every((m) => !!m.winner)
    : false;
}

export default function FifaKnockouts() {
  const navigate = useNavigate();

  const [state,   setState]   = useState(
    JSON.parse(sessionStorage.getItem("fifa_state") || "null")
  );
  const [stage,   setStage]   = useState("r32");
  const [loading, setLoading] = useState(false);

  /* Guard — if no state, send back to groups */
  useEffect(() => {
    if (!state) navigate("/fifa/groups");
  }, [state, navigate]);

  const activeMatches = useMemo(() => {
    if (!state || stage === "final") return [];
    return state[stage]
      ? Object.entries(state[stage]).map(([slot, m]) => ({ ...m, match: slot }))
      : [];
  }, [state, stage]);

  /* Pairing IDs for R32 display */
  const r32PairingBadges = useMemo(() => {
    if (stage !== "r32" || !state?.r32) return {};
    return Object.fromEntries(
      Object.entries(state.r32).map(([slot, m]) => [slot, m.pairing_id])
    );
  }, [stage, state]);

  async function handleAutoSubmit(_, matchId, payload) {
    const match =
      stage === "final"
        ? matchId === "THIRD_PLACE"
          ? state.third_place
          : state.final
        : state[stage]?.[matchId];

    if (!match) return;

    const res = await apiPost("/api/fifa2026/predict_knockout_match", {
      user_id:      localStorage.getItem("username") || "guest",
      stage,
      match_slot:   matchId,
      teamA:        match.teamA,
      teamB:        match.teamB,
      scoreA:       payload.scoreA,
      scoreB:       payload.scoreB,
      penaltyWinner: payload.penaltyWinner,
    });

    if (!res?.success) return;

    const next = { ...state };

    if (stage === "final") {
      const key = matchId === "THIRD_PLACE" ? "third_place" : "final";
      next[key] = {
        ...next[key],
        scoreA:        res.scoreA,
        scoreB:        res.scoreB,
        penaltyWinner: payload.penaltyWinner ?? null,
        winner:        res.winner,
      };
    } else {
      next[stage][matchId] = {
        ...next[stage][matchId],
        scoreA:        res.scoreA,
        scoreB:        res.scoreB,
        penaltyWinner: payload.penaltyWinner ?? null,
        winner:        res.winner,
      };
    }

    sessionStorage.setItem("fifa_state", JSON.stringify(next));
    setState(next);
  }

  const currentIndex = ROUND_FLOW.indexOf(stage);
  const nextStage    = ROUND_FLOW[currentIndex + 1];
  const canProceed   = isStageComplete(state, stage);

  async function proceed() {
    if (stage === "final") {
      navigate("/fifa/winner");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost(`/api/fifa2026/generate_${nextStage}`, {
        user_id: localStorage.getItem("username") || "guest",
        state,
      });
      if (res?.success) {
        sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        setState(res.state);
        setStage(nextStage);
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

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base,
                 display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: "#fff" }}>Generating bracket…</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: fifaTheme.background.base,
        p: { xs: 2, md: 5 },
        position: "relative",
      }}
    >
      {/* ── Top bar ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: "#e6faff",
              textShadow: "0 0 18px rgba(0,200,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            FIFA World Cup 2026
          </Typography>
          <Typography sx={{ color: "rgba(140,210,255,0.65)", fontSize: 13 }}>
            Logged in as{" "}
            <strong style={{ color: "#7edcff" }}>
              {localStorage.getItem("username") || "guest"}
            </strong>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/fifa/groups")}
            sx={{
              color: "rgba(140,200,255,0.7)",
              borderColor: "rgba(140,200,255,0.3)",
              borderRadius: 2,
              textTransform: "none",
              fontSize: 12,
            }}
          >
            ← Groups
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLogout}
            sx={{
              color: "rgba(200,220,255,0.7)",
              borderColor: "rgba(200,220,255,0.3)",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { borderColor: "#f77", color: "#f99" },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg">
        {/* Round heading */}
        <Typography
          variant="h3"
          sx={{
            textAlign: "center",
            fontWeight: 900,
            letterSpacing: "0.12em",
            mb: 1,
            color: "#e6faff",
            textShadow: "0 0 18px rgba(120,220,255,0.65), 0 0 36px rgba(120,220,255,0.45)",
          }}
        >
          FIFA WORLD CUP 2026
        </Typography>

        <Typography
          variant="h4"
          sx={{
            color: fifaTheme.gold,
            textAlign: "center",
            mb: 2,
            fontWeight: 900,
            textShadow: "0 0 16px rgba(120,220,255,0.5)",
          }}
        >
          {ROUND_LABELS[stage]}
        </Typography>

        {/* R32 pairing IDs info bar */}
        {stage === "r32" && Object.keys(r32PairingBadges).length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 0.8,
              mb: 3,
              px: 2,
            }}
          >
            {Object.entries(r32PairingBadges).map(([slot, pid]) => (
              <Chip
                key={slot}
                label={`M${slot} · Pair #${pid}`}
                size="small"
                sx={{
                  background: "rgba(0,60,100,0.55)",
                  color: "rgba(120,210,255,0.85)",
                  border: "1px solid rgba(0,180,255,0.25)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        )}

        {/* Normal rounds */}
        {stage !== "final" && (
          <FifaPredictionCard
            matches={activeMatches}
            mode="playoff"
            roundKey={stage}
            onAutoSubmit={handleAutoSubmit}
          />
        )}

        {/* Final stage */}
        {stage === "final" && (
          <>
            <Typography
              sx={{
                textAlign: "center",
                fontWeight: 900,
                mt: 2,
                mb: 2,
                color: "#ffcc99",
                letterSpacing: 1,
              }}
            >
              THIRD PLACE PLAYOFF
            </Typography>
            <FifaPredictionCard
              matches={[{ ...state.third_place, match: "THIRD_PLACE" }]}
              mode="playoff"
              roundKey="final"
              onAutoSubmit={handleAutoSubmit}
            />

            <Typography
              sx={{
                textAlign: "center",
                fontWeight: 900,
                mt: 5,
                mb: 2,
                color: "#bdefff",
                letterSpacing: 1.2,
              }}
            >
              WORLD CUP FINAL
            </Typography>
            <FifaPredictionCard
              matches={[{ ...state.final, match: "FINAL" }]}
              mode="playoff"
              roundKey="final"
              onAutoSubmit={handleAutoSubmit}
            />
          </>
        )}

        {/* Proceed button */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <Button
            variant="contained"
            disabled={!canProceed}
            onClick={proceed}
            sx={{
              position: "relative",
              px: 5,
              py: 1.6,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, rgba(200,245,255,0.35), rgba(120,190,255,0.25))",
              backdropFilter: "blur(14px)",
              boxShadow:
                "0 0 18px rgba(120,220,255,0.55), 0 0 42px rgba(120,220,255,0.35)",
              color: "#00263f",
              border: "1px solid rgba(255,255,255,0.55)",
              "&.Mui-disabled": {
                background: "rgba(120,120,120,0.25)",
                boxShadow: "none",
                color: "#aaa",
              },
            }}
          >
            {stage === "final" ? "🏆 View Results" : "Proceed →"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
